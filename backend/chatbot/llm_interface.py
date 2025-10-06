import requests
import json

class LLMInterface:
    def __init__(self, ollama_model="llama3", host="http://127.0.0.1:11434"):
        self.model = ollama_model
        self.host = host

    def get_reply(self, prompt: str) -> str:
        """Send prompt to Ollama and stream response."""
        try:
            response = requests.post(
                f"{self.host}/api/generate",
                json={"model": self.model, "prompt": prompt},
                stream=True,
                timeout=120
            )
            response.raise_for_status()
            
            full_reply = ""
            for line in response.iter_lines():
                if not line:
                    continue
                data = json.loads(line.decode("utf-8"))
                if "response" in data:
                    full_reply += data["response"]
                if data.get("done"):
                    break

            return full_reply.strip()
        except Exception as e:
            print(f"❌ Ollama failed: {e}")
            return "I couldn’t process that right now. Please try again."
