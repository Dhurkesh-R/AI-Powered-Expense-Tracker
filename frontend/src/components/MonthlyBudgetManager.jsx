import React, { useState, useEffect, useCallback } from "react";
import { setMonthlyBudget, fetchMonthlyBudget } from "../services/api";

const MonthlyBudgetManager = ({ theme, historicalData }) => {
  const [monthlyBudget, setMonthlyBudgetState] = useState(0);

  // Fetch monthly budget from backend
  const getBudget = useCallback(async () => {
    try {
      const data = await fetchMonthlyBudget();
      setMonthlyBudgetState(data.limit || 0);
    } catch (error) {
      console.error("Error fetching monthly budget:", error);
    }
  }, []);

  useEffect(() => {
    getBudget();
  }, [getBudget]);

  const handleBudgetChange = (value) => {
    setMonthlyBudgetState(Number(value));
  };

  const handleSaveBudget = async () => {
    try {
      await setMonthlyBudget(monthlyBudget);
      await getBudget(); // refresh after saving
    } catch (error) {
      console.error("Error saving monthly budget:", error);
    }
  };

  return (
    <div
      className={
        theme === "gradient"
          ? "bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 py-12 px-6 rounded-2xl shadow-xl"
          : "bg-white dark:bg-gray-900 dark:text-white p-4 rounded shadow"
      }
    >
      <h2 className="text-xl font-bold mb-2">💰 Monthly Budget</h2>

      {/* Input + Save */}
      <label className="block my-2 text-sm font-medium">Set Budget (₹):</label>
      <input
        type="number"
        value={monthlyBudget}
        onChange={(e) => handleBudgetChange(e.target.value)}
        className={
          theme === "gradient"
            ? "border p-2 rounded w-full bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 rounded-xl shadow"
            : "border p-2 rounded w-full dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600"
        }
      />
      <button
        onClick={handleSaveBudget}
        className="mt-4 w-full bg-blue-500 text-white p-2 rounded"
      >
        Set Monthly Budget
      </button>
    </div>
  );
};

export default MonthlyBudgetManager;
