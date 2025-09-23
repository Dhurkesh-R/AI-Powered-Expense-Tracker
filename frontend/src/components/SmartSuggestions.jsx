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
