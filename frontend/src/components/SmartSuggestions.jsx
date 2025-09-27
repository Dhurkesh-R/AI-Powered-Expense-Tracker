import { useEffect, useState } from "react";
import { getSuggestions } from "../services/api";

const SmartSuggestions = ({ theme }) => {
  const [tips, setTips] = useState([]);

  useEffect(() => {
    getSuggestions()
      .then((s) => setTips(s))
      .catch(() => setTips(["Unable to fetch suggestions."]));
  }, []);

  console.log(tips)

  return (
    <div className={
          theme === "gradient"
              ? "p-4 mt-4 rounded border border-yellow-300 bg-amber-800 text-amber-100"
              : "bg-yellow-50 p-4 mt-4 rounded border border-yellow-300 dark:bg-amber-800 dark:text-amber-100"
          }>
      <h3 className="text-lg font-semibold mb-2">🧠 Smart Suggestions</h3>
      <ul className={
          theme === "gradient"
              ? "list-disc list-inside text-sm text-amber-100"
              : "list-disc list-inside text-sm text-yellow-800 dark:text-amber-100"
          }>
        {tips.map((tip, idx) => (
          <li key={idx}>{tip}</li>
        ))}
      </ul>
    </div>
  );
};

export default SmartSuggestions;

{/* Voice Button */}
<button
type="button"
onClick={startListening}
className={`
  fixed bottom-6 right-6 z-50 transition-all duration-300 transform 
  hover:scale-105 active:scale-95 shadow-xl
  w-16 h-16 p-3 rounded-full flex items-center justify-center 
  ${
    // Theme-specific colors
    theme === "gradient"
      ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white"
      : "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
  }
`}
aria-label="Start Voice Input"
>
{/* Check if listening state is true */}
{listening ? (
    // Show the animated GIF when actively listening
    <img 
      src={micGifPath} 
      alt="Microphone for voice input"
      className="w-10 h-10 object-contain" 
    />
) : (
    // Show a standard icon when not listening (ready state)
    <HiMicrophone className="w-8 h-8" />
)}
</button>