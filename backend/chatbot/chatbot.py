from flask import Flask, request, jsonify
from chatbot.llm_interface import LLMInterface
from chatbot.memory import ConversationBufferMemory
from chatbot.storage import Storage
from chatbot.planner import Planner
from chatbot.query_engine import QueryEngine
from models import db
import json

# --- Initialize Flask app ---
app = Flask(__name__)

# --- Initialize Chatbot Components ---
llm = LLMInterface()
memory = ConversationBufferMemory(max_turns=10)
storage = Storage()
planner = Planner()
query_engine = QueryEngine(db)


def get_system_prompt():
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


def chat_with_bot(user_input: str, user_id: int = 1):
    """Main chat handler logic."""

    # Step 1 — Save user message
    memory.update("user", user_input)

    try:
        # Step 2 — Handle expense-related queries
        if any(word in user_input.lower() for word in ["spent", "expense", "spending", "budget", "cost"]):
            db_response = query_engine.parse_query(user_input, user_id)
            memory.update("assistant", db_response)
            return db_response

        # Step 3 — General finance conversation
        memory_context = memory.get_context()
        recent_expenses = storage.get_recent_expenses()
        expense_context = json.dumps(recent_expenses, indent=2)
        system_prompt = get_system_prompt()

        final_prompt = f"""{system_prompt}

--- Conversation Memory ---
{memory_context}

--- User Expense Context ---
{expense_context}

--- New Message ---
User: {user_input}
Assistant:"""

        # Step 4 — Call LLM for response
        response = llm.generate_response(final_prompt)
        memory.update("assistant", response)
        return response or "I'm here to help with your finances, but I didn’t get that. Try again!"

    except Exception as e:
        print(f"❌ Error: {e}")
        return "I couldn’t process that right now. Please try again."


# --- Flask Route for Chatbot ---
@app.route("/chat", methods=["POST"])
def chat_endpoint():
    data = request.get_json(force=True)
    user_input = data.get("message", "")
    user_id = data.get("user_id", 1)

    response = chat_with_bot(user_input, user_id)
    return jsonify({"response": response})


# --- Run the server ---
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
