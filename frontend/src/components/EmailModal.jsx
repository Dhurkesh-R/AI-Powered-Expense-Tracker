import { useState } from "react";
import { registerEmail } from "../services/api"

export default function EmailModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [dontShow, setDontShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!email) return setMessage("Please enter your email!");
    setLoading(true);

    try {
      const res = await registerEmail(email)

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Email registered successfully!");
        onClose();
      } else {
        setMessage(data.error || "Something went wrong!");
      }
    } catch (err) {
      console.error(err);
      setMessage("Network error!");
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Get Budget Alerts</h2>
        <p className="mb-2">Enter your email to receive notifications about overspending and recurring expenses:</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your-email@example.com"
          className="w-full border px-3 py-2 rounded mb-2"
        />
        <div className="mb-2">
          <input
            type="checkbox"
            id="dontShow"
            checked={dontShow}
            onChange={() => setDontShow(!dontShow)}
            className="mr-2"
          />
          <label htmlFor="dontShow">Don't show this again</label>
        </div>
        {message && <p className="text-sm text-red-500 mb-2">{message}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
        <button onClick={onClose} className="px-4 py-2 rounded border">
          Cancel
        </button>
      </div>
    </div>
  );
}
