import React, { useEffect, useState } from "react";
import { getSplitSummary } from "../services/api";
import EditSplitSummary from "./EditSplitSummary"

const SplitSuggestionCard = ({ groupId, theme }) => {
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    if (!groupId) return;
    getSplitSummary(groupId).then(setSummary);
  }, [groupId]);

  if (!groupId || summary.length === 0) return null;

  return (
    <div className={
          theme === "gradient"
            ? "basis-2/3 bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 p-4 rounded shadow space-y-3"
            : "basis-2/3 bg-white dark:bg-gray-800 p-4 rounded shadow space-y-3"
        }>
      <h2 className="text-lg font-bold">⚖️ Equal Split Summary</h2>
      <ul className="text-sm space-y-2">
        {summary.map((user) => (
          <li key={user.username} className={
              theme === "gradient"
                ? "bg-gradient-to-r from-indigo-800 to-blue-800 rounded-md px-4 py-2 shadow-md"
                : "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-800 rounded-md px-4 py-2 shadow-sm"
            }>
            <span className="font-semibold">{user.username}</span>: 
            spent ₹{user.spent.toFixed(2)}, 
            should have spent ₹{user.should_have_spent.toFixed(2)} → 
            {user.balance > 0 ? (
              <span className="text-green-500"> overpaid by ₹{user.balance}</span>
            ) : user.balance < 0 ? (
              <span className="text-red-500"> underpaid by ₹{Math.abs(user.balance)}</span>
            ) : (
              <span className="text-gray-500"> settled</span>
            )}
          </li>
        ))}
      </ul>

      <EditSplitSummary groupId={groupId} summary={summary} setSummary={setSummary} />
    </div>
  );
};

export default SplitSuggestionCard;
