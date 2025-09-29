from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from flask_migrate import Migrate 
import pandas as pd
from prophet import Prophet
import logging
from datetime import datetime
from datetime import timedelta

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)

from config import Config
from models import db, Expense, User, Budget
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
        current_user = get_jwt_identity()
        user = User.query.filter_by(username=current_user).first()
        data = request.get_json()
        description = data.get('description', '')

        if not description:
            return jsonify({'status': 'error', 'message': 'Description is required'}), 400

        X_test = vectorizer.transform([description])
        prediction = categorizer_model.predict(X_test)[0]
        category = apply_rules(user_id=user.id, description=description)

        return jsonify({'status': 'success', 'category': category if category else prediction})

    except Exception as e:
        print("[ERROR] /predict-category failed:", e)
        return jsonify({'status': 'error', 'message': str(e)}), 500
    
# Add Rule
@app.route('/rules', methods=['POST'])
@jwt_required()
def add_rule():
    try:
        current_user = get_jwt_identity()
        user = User.query.filter_by(username=current_user).first()

        data = request.get_json()
        keyword = data.get("keyword")
        category = data.get("category").strip()

        if not keyword or not category:
            return jsonify({"status": "error", "message": "Keyword and category are required"}), 400

        new_rule = Rule(user_id=user.id, keyword=keyword, category=category)
        db.session.add(new_rule)
        db.session.commit()

        return jsonify({"status": "success", "message": "Rule added successfully"})

    except Exception as e:
        print("[ERROR] /rules POST failed:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


# Get all rules
@app.route('/rules', methods=['GET'])
@jwt_required()
def get_rules():
    try:
        current_user = get_jwt_identity()
        user = User.query.filter_by(username=current_user).first()

        rules = Rule.query.filter_by(user_id=user.id).all()
        rules_list = [{"id": r.id, "keyword": r.keyword, "category": r.category} for r in rules]

        return jsonify({"status": "success", "rules": rules_list})

    except Exception as e:
        print("[ERROR] /rules GET failed:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


# Delete a rule
@app.route('/rules/<int:rule_id>', methods=['DELETE'])
@jwt_required()
def delete_rule(rule_id):
    try:
        current_user = get_jwt_identity()
        user = User.query.filter_by(username=current_user).first()

        rule = Rule.query.filter_by(id=rule_id, user_id=user.id).first()
        if not rule:
            return jsonify({"status": "error", "message": "Rule not found"}), 404

        db.session.delete(rule)
        db.session.commit()

        return jsonify({"status": "success", "message": "Rule deleted successfully"})

    except Exception as e:
        print("[ERROR] /rules DELETE failed:", e)
        return jsonify({"status": "error", "message": str(e)}), 500




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
            category=data.get('category', '').strip(),
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
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    user_id = user.id
    now = datetime.utcnow()
    current_month, current_year = now.month, now.year
    
    # --- Correctly calculate the previous month and year ---
    first_day_of_current_month = now.replace(day=1)
    last_month_date = first_day_of_current_month - timedelta(days=1)
    last_month, last_month_year = last_month_date.month, last_month_date.year

    # --- Utility for totals ---
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
    # Set to track categories that received a specific budget-based alert
    budgeted_categories_alerted = set()

    # --- Budget-based alerts (Priority 1: Most specific alerts) ---
    # FIX: Convert budget limits to float immediately for consistent arithmetic and formatting
    budgets = {b.category: float(b.limit) for b in Budget.query.filter_by(user_id=user_id).all()}

    for cat, spent in this_month.items():
        if cat in budgets:
            budget = budgets[cat]
            
            # 1. Check for OVERSPENT (spent > budget)
            if spent > budget:
                suggestions.append(f"🔥 Overspent on **{cat}** by ₹{spent - budget:.0f} (Budget: ₹{budget:.0f})")
                suggestions.append(f"💡 Suggestion: Add a **task** to review {cat} bills.")
                budgeted_categories_alerted.add(cat)

            # 2. Check for 100% Usage (spent == budget) - handles the Travel edge case
            elif spent >= budget: # This check covers spent == budget, since spent > budget is handled above
                suggestions.append(f"🚨 You have used 100% of your **{cat}** budget (₹{spent:.0f}/₹{budget:.0f}).")
                suggestions.append(f"💡 Suggestion: Stop spending in {cat} immediately or consider increasing the budget.")
                budgeted_categories_alerted.add(cat)
                
            # 3. Check for 80% Warning (spent >= 80% and < 100% of budget)
            elif spent >= 0.8 * budget:
                percent_used = round(spent / budget * 100)
                suggestions.append(f"⚠️ You’ve used {percent_used}% of your **{cat}** budget (₹{spent:.0f}/₹{budget:.0f}).")
                suggestions.append(f"💡 Suggestion: Slow down spending in {cat} for the rest of the month.")
                budgeted_categories_alerted.add(cat)

    # --- Compare month-to-month spending (Priority 2: Only for non-budgeted or non-alerted categories) ---
    for cat in set(this_month.keys()).union(prev_month.keys()):
        # FIX: Skip if a budget-based alert was already given for this category
        if cat in budgeted_categories_alerted:
            continue
            
        curr, prev = this_month.get(cat, 0), prev_month.get(cat, 0)
        
        # Spending Increased
        if curr > prev:
            # Check for a large percentage increase (as implemented before)
            if prev > 0:
                percent = round((curr - prev) / prev * 100)
                if percent > 500: # Use the threshold to generalize massive spikes
                    suggestions.append(f"⚠️ Your **{cat}** spending dramatically increased this month (₹{curr:.0f}, up from ₹{prev:.0f}).")
                else:
                    suggestions.append(f"⚠️ You spent {percent}% more on **{cat}** this month (₹{curr:.0f}).")
            else: # Case: Spending from zero
                suggestions.append(f"⚠️ You spent ₹{curr:.0f} on **{cat}** this month (zero last month).")

            suggestions.append(f"💡 Suggestion: Try setting a weekly cap for {cat} expenses.")

        # Spending Reduced (Still show for categories without budget alerts)
        elif prev > curr and curr > 0:
            suggestions.append(f"✅ You reduced your {cat} spending by ₹{prev - curr:.0f} this month.")
            suggestions.append(f"🎯 Suggestion: Turn this into a habit — keep tracking {cat} spending.")
            
        # Zero spending this month (Still show for categories without budget alerts)
        elif curr == 0 and prev > 0:
            suggestions.append(f"🚫 You didn’t spend anything on {cat} this month (₹{prev:.0f} last month).")
            suggestions.append(f"💡 Suggestion: Did you intentionally cut {cat}? If so, great job!")

    # --- No suggestions? ---
    if not suggestions:
        suggestions.append("✅ No major spending changes. Keep it up!")

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

        if m.adjusted_balance is not None:
            balance = m.adjusted_balance

        display_spent = round(share_per_user, 2) + balance

        result.append({
            "user": m.user.username,
            "total": round(display_spent, 2)   # 👈 not raw spent, but adjusted
        })


    return jsonify(result)


@app.route('/api/group/<int:group_id>/split-summary', methods=['GET'])
@jwt_required()
def split_summary(group_id):
    current_username = get_jwt_identity()
    user = User.query.filter_by(username=current_username).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    current_user_id = user.id
    # Get all expenses for this group
    expenses = Expense.query.filter_by(group_id=group_id).all()
    if not expenses:
        # still include user_role for consistency
        membership = GroupMembership.query.filter_by(group_id=group_id, user_id=current_user_id).first()
        role = membership.role if membership else None
        return jsonify({"message": "No expenses yet.", "user_role": role}), 200

    # Get total per user
    user_totals = {}
    for exp in expenses:
        user_totals[exp.user_id] = user_totals.get(exp.user_id, 0) + exp.amount

    members = GroupMembership.query.filter_by(group_id=group_id).all()
    num_members = len(members)
    total_spent = sum(user_totals.values())
    share_per_user = total_spent / num_members if num_members > 0 else 0

    # Build result
    result = []
    for m in members:
        spent = user_totals.get(m.user_id, 0)
        balance = round(spent - share_per_user, 2)

        if m.adjusted_balance is not None:
            balance = m.adjusted_balance

        display_spent = round(share_per_user, 2) + balance

        result.append({
            "username": m.user.username,
            "spent": display_spent,
            "should_have_spent": round(share_per_user, 2),
            "balance": balance  # + means overpaid, - means underpaid
        })

    # find current user's role
    membership = GroupMembership.query.filter_by(group_id=group_id, user_id=current_user_id).first()
    role = membership.role if membership else None

    return jsonify({
        "user_role": role,   # 👈 now frontend knows if admin/member
        "summary": result
    })


@app.route('/api/group/<int:group_id>/split-summary', methods=['PUT'])
@jwt_required()
def update_split_summary(group_id):
    data = request.json
    if not data or "summary" not in data:
        return jsonify({"message": "Invalid request"}), 400

    summary_updates = data["summary"]

    # Example: just log or update balances (depends on your schema)
    for user_data in summary_updates:
        username = user_data.get("username")
        balance = user_data.get("balance")

        # If you have a Balance table, update it here. Example:
        member = GroupMembership.query.join(User).filter(
            GroupMembership.group_id == group_id,
            User.username == username
        ).first()

        if member:
            # ⚠️ You’ll need a place to store balance adjustments in DB
            member.adjusted_balance = balance  

    db.session.commit()
    return jsonify({"message": "Summary updated successfully"})


@app.route("/budgets", methods=["POST"])
@jwt_required()
def set_budget():
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    category = data.get('category')
    limit = data.get('limit')

    if not category or limit is None:
        return jsonify({"error": "Missing category or limit"}), 400

    # Check if a budget for this category already exists
    budget = Budget.query.filter_by(user_id=user.id, category=category).first()

    if budget:
        # Update existing budget
        budget.limit = limit
    else:
        # Create a new budget
        new_budget = Budget(
            user_id=user.id,
            category=category,
            limit=limit,
        )
        db.session.add(new_budget)

    db.session.commit()

    return jsonify({"message": f"Budget for {category} set to {limit}"}), 200

@app.route("/budgets", methods=["GET"])
@jwt_required()
def get_budgets():
    """
    Fetches all budget limits and details for the authenticated user.
    Frontend endpoint: GET /api/budgets
    """
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # 1. Query the database for all Budget entries belonging to the user
    budgets = Budget.query.filter_by(user_id=user.id).all()
    
    # 2. Convert SQLAlchemy objects to a list of dictionaries for JSON serialization
    budgets_data = [
        {
            "id": budget.id,
            "category": budget.category,
            "limit": float(budget.limit),  # Ensure it's a standard float for JSON
            "start_date": budget.start_date.isoformat(),
            "end_date": budget.end_date.isoformat() if budget.end_date else None,
        }
        for budget in budgets
    ]

    # 3. Return the data in the format the frontend (fetchBudgets) expects: {"budgets": [...] }
    return jsonify({"budgets": budgets_data}), 200

@app.route("/budget", methods=["POST"])
@jwt_required()
def set_monthly_budget():
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    limit = data.get("limit")

    if limit is None:
        return jsonify({"error": "Missing limit"}), 400

    # Check if user already has a monthly budget
    budget = Budget.query.filter_by(user_id=user.id, category="Monthly").first()


    if budget:
        budget.limit = limit  # update
    else:
        budget = Budget(user_id=user.id, category="Monthly", limit=limit)
        db.session.add(budget)

    db.session.commit()
    return jsonify({"message": f"Monthly budget set to {limit}"}), 200


# ---------------------------
# Get Monthly Budget
# ---------------------------
@app.route("/budget", methods=["GET"])
@jwt_required()
def get_monthly_budget():
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    budget = Budget.query.filter_by(user_id=user.id, category="Monthly").first()
    if not budget:
        return jsonify({"error": "No monthly budget set"}), 404

    return jsonify({
        "id": budget.id,
        "limit": float(budget.limit),
        "start_date": budget.start_date.isoformat(),
        "end_date": budget.end_date.isoformat() if budget.end_date else None
    }), 200


@app.route("/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    overspending_alerts = check_overspending(user_id=user.id) 
    recurring_alerts = check_recurring_reminders(user_id=user.id) 
    all_alerts = (overspending_alerts or []) + (recurring_alerts or []) 
    
    return jsonify({"notifications": all_alerts})

@app.route("/register-email", methods=["POST"])
@jwt_required()
def register_email():
    user_id = get_jwt_identity()
    data = request.get_json()
    email = data.get("email")
    dont_show = data.get("dont_show_again", False)

    if not email:
        return jsonify({"error": "Email is required"}), 400

    # Check if the email is already used by another user
    existing_user = User.query.filter(User.email == email, User.id != user_id).first()
    if existing_user:
        return jsonify({"error": "This email is already registered with another account."}), 400

    user = User.query.get(user_id)
    user.email = email
    user.dont_show_email_modal = dont_show

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to save email. Please try again."}), 500

    return jsonify({"message": "Email registered successfully!"})


@app.route("/check-email", methods=["GET"])
@jwt_required()
def check_email():
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"email": user.email})

def send_recurring_expense_alerts():
    with app.app_context():
        today = datetime.today().date()
        recurring_expenses = Expense.query.filter_by(is_recurring=True).all()

        for expense in recurring_expenses:
            # Monthly recurring
            if expense.recurring_interval == "monthly" and expense.ds.day == today.day:
                user = User.query.get(expense.user_id)
                if user.email:  # only send if user has registered email
                    logging.info("Sending monthly reminder to %s for %s", user.email, expense.description)
                    msg = Message(
                        subject="🔔 Recurring Expense Reminder",
                        sender=app.config['MAIL_USERNAME'],
                        recipients=[user.email],
                        body=f"Hi {user.username}, reminder: your recurring expense '{expense.description}' of ₹{expense.amount} is due today."
                    )
                    mail.send(msg)
                    print(f"Email sent to {user.email} for {expense.description}")
            # Weekly recurring
            elif expense.recurring_interval == "weekly" and expense.ds.weekday() == today.weekday():
                user = User.query.get(expense.user_id)
                if user.email:
                    logging.info("Sending monthly reminder to %s for %s", user.email, expense.description)
                    msg = Message(
                        subject="🔔 Weekly Recurring Expense Reminder",
                        sender=app.config['MAIL_USERNAME'],
                        recipients=[user.email],
                        body=f"Hi {user.username}, reminder: your weekly recurring expense '{expense.description}' of ₹{expense.amount} is due today."
                    )
                    mail.send(msg)
                    print(f"Email sent to {user.email} for {expense.description}")


def send_budget_alerts():
    try:
        with app.app_context():
            users = User.query.all()
            for user in users:
                expenses = Expense.query.filter_by(user_id=user.id).all()
                monthly_total = sum(e.amount for e in expenses if e.ds.month == datetime.now().month)

                if monthly_total > user.budget and user.email:
                    logging.info("Sending budget alert to %s (spent ₹%s / budget ₹%s)", 
                             user.email, monthly_total, user.budget)
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
scheduler.add_job(func=send_recurring_expense_alerts, trigger="interval", days=1)
scheduler.add_job(func=send_budget_alerts, trigger="cron", hour=20)
scheduler.start()

@app.route('/')
def home():
    return "Expense Tracker Forecast API"


if __name__ == '__main__':
    app.run(debug=True, port=5000)

# This is a simple Flask app that serves as an API for making predictions using a pre-trained Prophet model.