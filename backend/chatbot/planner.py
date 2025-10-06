class Planner:
    def plan_reply(self, user_input: str):
        """Placeholder for future planning logic (e.g., detect user intent)."""
        if "budget" in user_input.lower():
            return "budget_analysis"
        elif "save" in user_input.lower():
            return "saving_advice"
        elif "spent" in user_input.lower() or "expense" in user_input.lower():
            return "expense_summary"
        return "general_chat"
