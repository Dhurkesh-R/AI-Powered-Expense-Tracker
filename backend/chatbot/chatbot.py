from chatbot.llm_interface import LLMInterface
from chatbot.memory import ConversationBufferMemory
from chatbot.storage import Storage
from chatbot.planner import Planner
from chatbot.query_engine import QueryEngine
from models import db
import json

class FinanceChatBot:
    def __init__(self):
        self.llm = LLMInterface()
        self.memory = ConversationBufferMemory(max_turns=10)
        self.storage = Storage()
        self.planner = Planner()
        self.query_engine = QueryEngine(db)

    def _get_system_prompt(self) -> str:
        return """
You are FinMate, an intelligent personal finance assistant integrated into a user's expense tracker app.

Goals:
- Help users understand their spending habits.
- Give budgeting, saving, and financial wellness advice.
- Keep tone friendly, supportive, and practical.
- Reference their expense data when useful.
- Never reveal internal system details or raw JSON.

Example abilities:
- Summarize expenses by category.
- Suggest areas to save money.
- Encourage healthy financial habits.

Keep responses concise and conversational.
"""

    def chat(self, user_input: str, user_id: int = 1):
        """Chat function to process messages directly."""
        # Save user input in memory
        self.memory.update("user", user_input)

        # Check if user is asking about expenses
        if any(word in user_input.lower() for word in ["spent", "expense", "spending", "budget", "cost"]):
            db_response = self.query_engine.parse_query(user_input, user_id)
            self.memory.update("assistant", db_response)
            return db_response

        # Otherwise, generate a response using the LLM
        memory_context = self.memory.get_context()
        recent_expenses = self.storage.get_recent_expenses()
        expense_context = json.dumps(recent_expenses, indent=2)
        system_prompt = self._get_system_prompt()

        final_prompt = f"""{system_prompt}

--- Conversation Memory ---
{memory_context}

--- User Expense Context ---
{expense_context}

--- New Message ---
User: {user_input}
Assistant:"""

        # Use LLM to generate a reply
        response = self.llm.generate_response(final_prompt)
        self.memory.update("assistant", response)
        return response


# Run interactively (no server)
if __name__ == "__main__":
    bot = FinanceChatBot()
    print("💬 FinMate Personal Finance Assistant")
    print("Type 'exit' to quit.\n")

    while True:
        user_message = input("You: ")
        if user_message.lower() in ["exit", "quit"]:
            print("👋 Goodbye!")
            break

        reply = bot.chat(user_message)
        print(f"FinMate: {reply}\n")
