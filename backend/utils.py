import pandas as pd
import joblib
from prophet import Prophet
import os
from flask_jwt_extended import get_jwt_identity

# Load the trained Prophet model (change filename as needed)
def load_model(model_path='model/model.pkl'):
    with open(model_path, 'rb') as f:
        model = joblib.load(f)
    return model

def make_forecast(model, df, periods=30):
    df_prophet = df[["ds", "amount"]].rename(columns={"ds": "ds", "amount": "y"})
    model.fit(df_prophet)
    future = model.make_future_dataframe(periods=periods)
    forecast = model.predict(future)
    return forecast[["ds", "yhat"]]

# Load the tf-idf vectorizer (change filename as needed)
def load_vectorizer(vectorizer_path='model/vectorizer.pkl'):
    with open(vectorizer_path, 'rb') as f:
        vectorizer = joblib.load(f)
    return vectorizer

# Make future predictions
def make_forecast(model, periods=30):
    future = model.make_future_dataframe(periods=periods)
    forecast = model.predict(future)
    return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]

# Convert forecast DataFrame to JSON serializable format
def forecast_to_dict(forecast_df):
    return forecast_df.to_dict(orient='records')

# Optional: Load data if you want to expose historical data
def load_data():
    user = get_jwt_identity()
    filepath = f"data/{user}_expenses.csv"
    if not os.path.exists(filepath):
        return pd.DataFrame(columns=["ds", "amount", "category", "description"])
    return pd.read_csv(filepath, parse_dates=["ds"])



# Optional: Function to filter data by category
def filter_data_by_category(df, category):
    if category == 'all':
        return df
    else:
        return df[df['category'] == category]
# Function to calculate the total spent in a given month
def calculate_total_spent(df, month):
    # Ensure 'ds' is a datetime column
    df['ds'] = pd.to_datetime(df['ds'])
    # Filter the DataFrame for the given month
    monthly_data = df[df['ds'].dt.month == month]
    # Calculate the total spent
    total_spent = monthly_data['amount'].sum()
    return total_spent

# Budget alert function
def budget_alert(monthly_budget, total_spent):
    if total_spent > monthly_budget:
        return "⚠️ Warning: You are exceeding your budget!"
    return "✅ You're within your budget!"

from models import ExpenseAudit, db
from datetime import datetime

def log_expense_action(expense_id, user_id, action):
    audit = ExpenseAudit(
        expense_id=expense_id,
        user_id=user_id,
        action=action,
        timestamp=datetime.utcnow()
    )
    db.session.add(audit)
    db.session.commit()
