from llm_interface import LLMInterface
from memory import ConversationBufferMemory
from storage import Storage
from planner import Planner
import json

class FinanceChatBot:
    def __init__(self):
        self.llm = LLMInterface()
        self.memory = ConversationBufferMemory(max_turns=10)
        self.storage = Storage()
        self.planner = Planner()

# services/finance_chatbot/chatbot.py

from services.finance_chatbot.llm_interface import LLMInterface
from services.finance_chatbot.memory import ConversationBufferMemory
from services.finance_chatbot.storage import Storage
from services.finance_chatbot.planner import Planner
from services.finance_chatbot.query_engine import QueryEngine
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

    def chat(self, user_input: str, user_id: int):
        # Step 1 — Save user input
        self.memory.update("user", user_input)

        # Step 2 — If it's a query about spending, call QueryEngine
        if any(word in user_input.lower() for word in ["spent", "expense", "spending", "budget", "cost"]):
            db_response = self.query_engine.parse_query(user_input, user_id)
            self.memory.update("assistant", db_response)
            return db_response

        # Step 3 — Otherwise use LLM for normal finance talk
        memory_context = self.memory.get_context()
        recent_expenses = self.storage.get_recent_expenses()
        expense_context = json.dumps(recent_expenses, indent=2)
        system_prompt = self._get_system_prompt()

        final_prompt = f"""{system_prompt}

--- Conversation Memory ---
{memory_context}

--- Recent Expenses ---
{expense_context}

User: {user_input}
Assistant:"""

        reply = self.llm.get_reply(final_prompt)
        self.memory.update("assistant", reply)
        return reply
