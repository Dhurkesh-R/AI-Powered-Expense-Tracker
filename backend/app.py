from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from flask_migrate import Migrate 
import pandas as pd
from prophet import Prophet
from datetime import datetime
from datetime import timedelta

from config import Config
from models import db, Expense, User
from auth import auth_bp
from utils import *

from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from models import *
from flask_mail import Mail, Message
import os
from dotenv import load_dotenv

load_dotenv()

MAIL_USERNAME = os.getenv('MAIL_USERNAME')
MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})# Enables CORS for all domains on all routes
app.config.from_object(Config)
db.init_app(app)
JWTManager(app)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=120)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = MAIL_USERNAME
app.config['MAIL_PASSWORD'] = MAIL_PASSWORD  # Use app password, not raw password

mail = Mail(app)

migrate = Migrate(app, db)

# Register blueprint
app.register_blueprint(auth_bp)

# Load model once at startup
categorizer_model = load_model()
vectorizer = load_vectorizer()

# @app.before_request 
# def create_tables():
#     db.create_all()

@app.route('/predict', methods=['GET'])
@jwt_required()
def predict():
    try:
        current_user = get_jwt_identity()
        user = User.query.filter_by(username=current_user).first()

        if not user:
            return jsonify({'status': 'error', 'message': 'User not found'}), 404

        expenses = Expense.query.filter_by(user_id=user.id).all()
        if not expenses:
            return jsonify({'status': 'error', 'message': 'No data available for forecasting'}), 400

        # Create DataFrame
        df = pd.DataFrame([{
            'ds': e.ds.strftime('%Y-%m-%d'),
            'y': e.amount
        } for e in expenses])



        if df.empty:
            return jsonify({'status': 'error', 'message': 'Not enough data to predict'}), 422
        df['floor'] = 0

        # Train model
        model = Prophet()
        model.fit(df)

        # Forecast
        future = model.make_future_dataframe(periods=30)
        future['floor'] = 0
        forecast = model.predict(future)
        forecast_json = forecast[['ds', 'yhat']].to_dict(orient='records')

        return jsonify({'status': 'success', 'forecast': forecast_json})

    except Exception as e:
        print("[ERROR] /predict failed:", e)
        return jsonify({'status': 'error', 'message': 'Internal server error'}), 500



@app.route('/historical', methods=['GET'])
@jwt_required()
def historical():
    try:
        current_user = get_jwt_identity()
        user = User.query.filter_by(username=current_user).first()

        expenses = Expense.query.filter_by(user_id=user.id).all()
        historical_json = [
            {
                'id': e.id,
                'ds': e.ds.isoformat(),
                'amount': e.amount,
                'category': e.category,
                'description': e.description,
                'is_recurring': e.is_recurring,
                'recurring_interval': e.recurring_interval
            } for e in expenses
        ]
        return jsonify({'status': 'success', 'historical': historical_json})
    except Exception as e:
        print("[ERROR] /historical failed:", e)
        return jsonify({'status': 'error', 'message': str(e)}), 500

    
@app.route('/predict-category', methods=['GET', 'POST'])
@jwt_required()
def predict_category():
    try:
        data = request.get_json()
        description = data.get('description', '')

        if not description:
            return jsonify({'status': 'error', 'message': 'Description is required'}), 400

        X_test = vectorizer.transform([description])
        prediction = categorizer_model.predict(X_test)[0]

        return jsonify({'status': 'success', 'category': prediction})

    except Exception as e:
        print("[ERROR] /predict-category failed:", e)
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/add-expense', methods=['POST'])
@jwt_required()
def add_expense():
    try:
        current_user = get_jwt_identity()
        user = User.query.filter_by(username=current_user).first()

        if not user:
            return jsonify({'status': 'error', 'message': 'User not found'}), 404

        data = request.get_json()
        new_expense = Expense(
            user_id=user.id,
            ds=datetime.fromisoformat(data['ds']),
            amount=float(data['amount']),
            category=data.get('category', ''),
            description=data.get('description', ''),
            is_recurring=data.get('is_recurring', False),
            recurring_interval=data.get('recurring_interval', None),
            group_id=data.get("group_id")
        )
        db.session.add(new_expense)
        db.session.commit()

        log_expense_action(new_expense.id, user.id, 'created')

        return jsonify({'status': 'success', 'message': 'Expense added.'})
    except Exception as e:
        print("[ERROR] /add-expense failed:", e)
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/get-expenses', methods=['GET'])
@jwt_required()
def get_expenses():
    try:
        user = get_jwt_identity()
        expenses = Expense.query.filter_by(user_id=user).all()
        data = [{
            'ds': exp.ds.strftime('%Y-%m-%d'),
            'amount': exp.amount,
            'category': exp.category,
            'description': exp.description,
            'is_recurring': exp.is_recurring,
            'recurring_interval': exp.recurring_interval

        } for exp in expenses]
        return jsonify({'status': 'success', 'expenses': data})
    except Exception as e:
        print("[ERROR] /get-expenses:", e)
        return jsonify({'status': 'error', 'message': str(e)}), 500
    
@app.route('/update-expense/<int:id>', methods=['PUT'])
@jwt_required()
def update_expense(id):
    try:
        current_user = get_jwt_identity()
        user = User.query.filter_by(username=current_user).first()
        data = request.get_json()

        # Try fetching the expense
        expense = Expense.query.get(id)
        if not expense:
            return jsonify({'status': 'error', 'message': 'Expense not found'}), 404

        # Check permission
        if expense.user_id != user.id:
            membership = GroupMembership.query.filter_by(user_id=user.id, group_id=expense.group_id).first()
            if not membership or membership.role != "admin":
                return jsonify({'status': 'error', 'message': 'Not authorized to update this expense'}), 403

        # Perform update
        expense.amount = float(data['amount'])
        expense.category = data.get('category', expense.category)
        expense.description = data.get('description', expense.description)
        expense.is_recurring = bool(data.get('is_recurring', expense.is_recurring))
        expense.recurring_interval = data.get('recurring_interval', expense.recurring_interval)

        db.session.commit()
        log_expense_action(expense.id, user.id, 'updated')
        return jsonify({'status': 'success', 'message': 'Expense updated.'})

    except Exception as e:
        print("[ERROR] /update-expense failed:", e)
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/delete-expense/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_expense(id):
    try:
        current_user = get_jwt_identity()
        user = User.query.filter_by(username=current_user).first()

        expense = Expense.query.get(id)
        if not expense:
            return jsonify({'status': 'error', 'message': 'Expense not found'}), 404

        # Check permission
        if expense.user_id != user.id:
            membership = GroupMembership.query.filter_by(user_id=user.id, group_id=expense.group_id).first()
            if not membership or membership.role != "admin":
                return jsonify({'status': 'error', 'message': 'Not authorized to delete this expense'}), 403

        db.session.delete(expense)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Expense deleted.'})

    except Exception as e:
        print("[ERROR] /delete-expense failed:", e)
        return jsonify({'status': 'error', 'message': str(e)}), 500

from sqlalchemy import extract, func

@app.route("/suggestions", methods=["GET"])
@jwt_required()
def get_suggestions():
    username = get_jwt_identity()

    # ✅ Get the actual user object
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    user_id = user.id  # ✔ This is now safe to use for querying expense data

    now = datetime.utcnow()
    current_month = now.month
    current_year = now.year
    last_month = current_month - 1 if current_month > 1 else 12
    last_month_year = current_year if current_month > 1 else current_year - 1

    def get_category_totals(month, year):
        result = (
            db.session.query(Expense.category, func.sum(Expense.amount))
            .filter_by(user_id=user_id)
            .filter(extract("month", Expense.ds) == month)
            .filter(extract("year", Expense.ds) == year)
            .group_by(Expense.category)
            .all()
        )
        return {cat: float(amount) for cat, amount in result}

    this_month = get_category_totals(current_month, current_year)
    prev_month = get_category_totals(last_month, last_month_year)

    suggestions = []

    for cat in set(this_month.keys()).union(prev_month.keys()):
        curr = this_month.get(cat, 0)
        prev = prev_month.get(cat, 0)
        if curr > prev:
            diff = curr - prev
            percent = round((diff / prev) * 100) if prev > 0 else 100
            suggestions.append(f"You’ve spent {percent}% more on {cat} than last month.")
        elif prev > curr and curr > 0:
            suggestions.append(f"You reduced your {cat} spending by ₹{prev - curr:.0f} this month.")
        elif curr == 0 and prev > 0:
            suggestions.append(f"You didn’t spend anything on {cat} this month (₹{prev:.0f} last month).")

    if not suggestions:
        suggestions.append("No major changes in your spending trends this month.")

    return jsonify({"suggestions": suggestions})

@app.route("/api/groups", methods=["POST"])
@jwt_required()
def create_group():
    username = get_jwt_identity()

    # ✅ Get the actual user object
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    user_id = user.id
    data = request.json
    name = data.get("name")

    if not name:
        return jsonify({"error": "Group name required"}), 400

    group = Group(name=name, created_by=user_id)
    db.session.add(group)
    db.session.commit()

    # Add creator to membership with role "admin"
    membership = GroupMembership(group_id=group.id, user_id=user_id, role="admin")
    db.session.add(membership)
    db.session.commit()

    return jsonify({"message": "Group created", "group": {"id": group.id, "name": group.name}})
@app.route("/api/groups", methods=["GET"])
@jwt_required()
def get_user_groups():
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    user_id = user.id

    memberships = GroupMembership.query.filter_by(user_id=user_id).all()
    group_ids = [m.group_id for m in memberships]

    groups = Group.query.filter(Group.id.in_(group_ids)).all()
    # Map group_id to role for this user
    group_roles = {m.group_id: m.role for m in memberships}

    result = [
        {
            "id": g.id,
            "name": g.name,
            "role": group_roles.get(g.id, "member")
        }
        for g in groups
    ]

    return jsonify({"groups": result})

@app.route("/api/groups/<int:group_id>/invite", methods=["POST"])
@jwt_required()
def invite_user(group_id):
    inviter_username = get_jwt_identity()
    inviter = User.query.filter_by(username=inviter_username).first()
    if not inviter:
        return jsonify({"error": "User not found"}), 404

    inviter_membership = GroupMembership.query.filter_by(
        user_id=inviter.id, group_id=group_id
    ).first()
    if not inviter_membership or inviter_membership.role != "admin":
        return jsonify({"error": "Only admins can invite users."}), 403

    data = request.json
    invitee_username = data.get("username")
    if not invitee_username:
        return jsonify({"error": "Username required"}), 400

    invitee = User.query.filter_by(username=invitee_username).first()
    if not invitee:
        return jsonify({"error": "User not found"}), 404

    existing_membership = GroupMembership.query.filter_by(user_id=invitee.id, group_id=group_id).first()
    if existing_membership:
        return jsonify({"error": "User already in group"}), 400

    db.session.add(GroupMembership(user_id=invitee.id, group_id=group_id))
    db.session.commit()

    return jsonify({"message": "User added to group"})

@app.route("/api/groups/<int:group_id>/expenses", methods=["GET"])
@jwt_required()
def get_group_expenses(group_id):
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    membership = GroupMembership.query.filter_by(group_id=group_id, user_id=user.id).first()
    if not membership:
        return jsonify({"error": "Not authorized"}), 403

    expenses = Expense.query.filter_by(group_id=group_id).all()

    result = []
    for e in expenses:
        is_authorised = (
            e.user_id == user.id or membership.role == "admin"
        )
        result.append({
            "id": e.id,
            "user_id": e.user_id,
            "ds": e.ds,
            "amount": e.amount,
            "category": e.category,
            "description": e.description,
            "is_recurring": e.is_recurring,
            "recurring_interval": e.recurring_interval,
            "is_authorised": is_authorised
        })

    return jsonify(result)


@app.route("/api/groups/<int:group_id>", methods=["DELETE"])
@jwt_required()
def delete_group(group_id):
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Only allow deletion if user is the creator
    group = Group.query.filter_by(id=group_id, created_by=user.id).first()
    if not group:
        return jsonify({"error": "Group not found or not authorized"}), 404

    # Delete memberships first (to avoid foreign key constraint)
    GroupMembership.query.filter_by(group_id=group_id).delete()
    # Optionally, delete group expenses as well:
    Expense.query.filter_by(group_id=group_id).delete()
    db.session.delete(group)
    db.session.commit()
    return jsonify({"message": "Group deleted"})

@app.route('/api/group_users/<int:group_id>', methods=['GET'])
@jwt_required()
def get_group_users(group_id):
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Check if requesting user is in the group
    membership = GroupMembership.query.filter_by(user_id=user.id, group_id=group_id).first()
    if not membership:
        return jsonify({'error': 'Unauthorized access to group'}), 403

    members = GroupMembership.query.filter_by(group_id=group_id).all()
    users_data = [{
        'id': m.user.id,
        'username': m.user.username,
        'role': m.role,
        'is_authorised_user': True if m.user.id == user.id or m.role == "admin" else False
    } for m in members]

    return jsonify({'users': users_data})
    
@app.route('/api/remove_user', methods=['POST'])
@jwt_required()
def remove_user(current_user):
    data = request.get_json()
    group_id = data.get('group_id')
    user_id = data.get('user_id')

    group = Group.query.filter_by(id=group_id).first()

    if not group:
        return jsonify({'error': 'Group not found'}), 404

    if group.owner_id != current_user.id:
        return jsonify({'error': 'Only the owner can remove users'}), 403

    if user_id == current_user.id:
        return jsonify({'error': 'Owner cannot remove themselves'}), 400

    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user not in group.members:
        return jsonify({'error': 'User not in group'}), 400

    group.members.remove(user)
    db.session.commit()

    return jsonify({'success': True, 'message': 'User removed successfully'})

@app.route('/api/group/<int:group_id>/audit-log', methods=['GET'])
@jwt_required()
def get_audit_log(group_id):
    logs = (
        db.session.query(ExpenseAudit, User.username, Expense.ds, Expense.amount, Expense.description)
        .join(User, ExpenseAudit.user_id == User.id)
        .join(Expense, ExpenseAudit.expense_id == Expense.id)
        .filter(Expense.group_id == group_id)
        .order_by(ExpenseAudit.timestamp.desc())
        .all()
    )

    result = [
        {
            "user": username,
            "action": audit.action,
            "timestamp": audit.timestamp,
            "amount": amount,
            "description": description,
            "date": ds
        }
        for audit, username, ds, amount, description in logs
    ]

    return jsonify(result)

@app.route('/api/group/<int:group_id>/spending_split', methods=['GET'])
@jwt_required()
def group_spending_split(group_id):
    from sqlalchemy import func
    data = db.session.query(
        User.username,
        func.sum(Expense.amount)
    ).join(Expense).filter(Expense.group_id == group_id).group_by(User.username).all()

    result = [{"user": u, "total": float(a)} for u, a in data]
    return jsonify(result)

@app.route('/api/group/<int:group_id>/split-summary', methods=['GET'])
@jwt_required()
def split_summary(group_id):
    # Get all expenses for this group
    expenses = Expense.query.filter_by(group_id=group_id).all()
    if not expenses:
        return jsonify({"message": "No expenses yet."}), 200

    # Get total per user
    user_totals = {}
    for exp in expenses:
        user_totals[exp.user_id] = user_totals.get(exp.user_id, 0) + exp.amount

    members = GroupMembership.query.filter_by(group_id=group_id).all()
    num_members = len(members)
    total_spent = sum(user_totals.values())
    share_per_user = total_spent / num_members

    # Build result
    result = []
    for m in members:
        spent = user_totals.get(m.user_id, 0)
        balance = round(spent - share_per_user, 2)
        result.append({
            "username": m.user.username,
            "spent": spent,
            "should_have_spent": round(share_per_user, 2),
            "balance": balance  # + means overpaid, - means underpaid
        })

    return jsonify(result)


def check_recurring_expenses():
    today = datetime.today().date()
    recurring_expenses = Expense.query.filter_by(is_recurring=True).all()
    for expense in recurring_expenses:
        if expense.recurring_interval == "monthly":
            if expense.ds.day == today.day:
                print(f"🔔 Reminder: Recurring expense due today - {expense.description}")

def send_budget_alerts():
    try:
        with app.app_context():
            users = User.query.all()
            for user in users:
                expenses = Expense.query.filter_by(user_id=user.id).all()
                monthly_total = sum(e.amount for e in expenses if e.ds.month == datetime.now().month)

                if monthly_total > user.budget:
                    msg = Message(
                        subject="🚨 Monthly Budget Alert",
                        sender=app.config['MAIL_USERNAME'],
                        recipients=[user.email],
                        body=f"Hi {user.username}, you've spent ₹{monthly_total} this month, exceeding your budget of ₹{user.budget}!"
                    )
                    mail.send(msg)
                    print("Mail sent successfully!")

    except Exception as e:
        print("Error:", e)

scheduler = BackgroundScheduler()
scheduler.add_job(func=check_recurring_expenses, trigger="interval", days=1)
scheduler.add_job(func=send_budget_alerts, trigger="cron", hour=20)
scheduler.start()

@app.route('/')
def home():
    return "Expense Tracker Forecast API"


if __name__ == '__main__':
    app.run(debug=True, port=5000)

# This is a simple Flask app that serves as an API for making predictions using a pre-trained Prophet model.