import { useState } from "react";
import { registerEmail } from "../services/api"

export default function EmailModal({ isOpen, onClose, theme }) {
  const [email, setEmail] = useState("");
  const [dontShow, setDontShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  // Custom class determination based on theme
  const isGradient = theme === "gradient";
  const cardClasses = isGradient
    ? "bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 p-6 rounded-2xl w-11/12 max-w-lg shadow-2xl text-white border border-indigo-700"
    : "bg-white dark:bg-gray-900 dark:text-white p-6 rounded-lg w-11/12 max-w-lg shadow-2xl";

  const inputClasses = isGradient
    ? "w-full px-3 py-3 rounded-lg mb-4 bg-gray-800 text-white border border-gray-600 placeholder-gray-500 focus:ring focus:ring-blue-500 focus:border-blue-500 transition-all"
    : "w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white px-3 py-3 rounded-lg mb-4 focus:ring focus:ring-blue-500 focus:border-blue-500 transition-all";

  const submitButtonClasses = isGradient
    ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-6 py-2 rounded-lg mr-3 shadow-md transition-all duration-300 hover:shadow-lg disabled:opacity-50"
    : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-6 py-2 rounded-lg mr-3 shadow-md transition-all duration-300 disabled:opacity-50";

  const cancelButtonClasses = isGradient
    ? "px-6 py-2 rounded-lg border border-indigo-400 text-indigo-200 bg-transparent hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
    : "px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50";

  const handleSubmit = async () => {
    setMessage(""); // Clear previous message
    if (!email) {
      setMessage("Please enter your email!");
      return;
    }
    setLoading(true);

    try {
      const res = await registerEmail(email)

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Email registered successfully! This window will now close.");
        
        // Use local storage to remember "Don't show this again" preference
        if (dontShow) {
            localStorage.setItem('emailModalDismissed', 'true');
        }

        // Delay closing slightly so the user sees the success message
        setTimeout(onClose, 1500); 
      } else {
        setMessage("❌ " + (data.error || "Something went wrong!"));
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Network error!");
    }

    setLoading(false);
  };

  if (!isOpen) return null;
  
  // Don't show if the user previously opted out
  if (localStorage.getItem('emailModalDismissed') === 'true') return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-4 transition-opacity duration-300">
      <div className={cardClasses}>
        <h2 className="text-2xl font-extrabold mb-4">🔔 Budget Alerts Setup</h2>
        <p className="mb-4 text-gray-300 dark:text-gray-400">
          Enter your email to receive **real-time notifications** about overspending, budget forecasts, and recurring expenses:
        </p>
        
        {/* Email Input */}
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setMessage(""); // Clear message on change
          }}
          placeholder="your-email@example.com"
          className={inputClasses}
        />
        
        {/* Messages */}
        {message && <p className={`text-sm mb-4 font-medium ${message.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{message}</p>}

        {/* Checkbox */}
        <div className="flex items-center mb-6">
          <input
            type="checkbox"
            id="dontShow"
            checked={dontShow}
            onChange={() => setDontShow(!dontShow)}
            className={`mr-2 w-4 h-4 ${isGradient ? 'text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500' : 'text-blue-600 border-gray-300 rounded focus:ring-blue-500'}`}
          />
          <label htmlFor="dontShow" className={`text-sm ${isGradient ? 'text-gray-300' : 'dark:text-gray-400'}`}>
            Don't show this notification again.
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={submitButtonClasses}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
          <button 
            onClick={() => {
                // If user hits cancel and dontShow is checked, respect their choice
                if (dontShow) {
                    localStorage.setItem('emailModalDismissed', 'true');
                }
                onClose();
            }} 
            disabled={loading}
            className={cancelButtonClasses}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
