from collections import deque

class ConversationBufferMemory:
    def __init__(self, max_turns=8):
        self.buffer = deque(maxlen=max_turns)

    def update(self, role: str, text: str):
        self.buffer.append({"role": role, "text": text})

    def get_context(self) -> str:
        context = "\n".join([f"{m['role'].capitalize()}: {m['text']}" for m in self.buffer])
        return context if context else "No prior context."
