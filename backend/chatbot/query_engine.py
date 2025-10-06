# services/finance_chatbot/query_engine.py

from models import Expense
from sqlalchemy import func
from datetime import datetime, timedelta
import re

class QueryEngine:
    def __init__(self, db):
        self.db = db

    def parse_query(self, user_input: str, user_id: int):
        """Detect query intent and fetch relevant expense data."""
        text = user_input.lower()

        # --- Detect time period ---
        now = datetime.utcnow()
        start_date, end_date = None, None

        if "this month" in text:
            start_date = datetime(now.year, now.month, 1)
            end_date = now
        elif "last month" in text:
            first_of_this_month = datetime(now.year, now.month, 1)
            last_month_end = first_of_this_month - timedelta(days=1)
            start_date = datetime(last_month_end.year, last_month_end.month, 1)
            end_date = last_month_end
        elif "week" in text:
            start_date = now - timedelta(days=7)
            end_date = now

        # --- Detect category ---
        categories = ["food", "transport", "shopping", "health", "entertainment", "other"]
        category = next((c for c in categories if c in text), None)

        # --- Run appropriate query ---
        query = self.db.session.query(func.sum(Expense.amount)).filter_by(user_id=user_id)
        if start_date and end_date:
            query = query.filter(Expense.ds >= start_date, Expense.ds <= end_date)
        if category:
            query = query.filter(func.lower(Expense.category) == category.lower())

        total = query.scalar() or 0

        # --- Generate readable response ---
        time_label = (
            "this month" if "this month" in text else
            "last month" if "last month" in text else
            "this week" if "week" in text else "overall"
        )

        if category:
            return f"You spent ₹{total:.2f} on {category} {time_label}."
        else:
            return f"You spent ₹{total:.2f} in total {time_label}."
