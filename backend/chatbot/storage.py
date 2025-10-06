from models import Expense

class Storage:
    def get_recent_expenses(self, limit=5):
        """Fetch latest expenses for context."""
        expenses = Expense.query.order_by(Expense.ds.desc()).limit(limit).all()
        return [
            {"description": e.description, "amount": e.amount, "category": e.category}
            for e in expenses
        ]
