import React from "react";

const BudgetAlert = ({ data, budget, theme }) => {
  const month = new Date().getMonth() + 1;
  const totalSpent = data
    .filter(item => new Date(item.ds).getMonth() + 1 === month)
    .reduce((sum, item) => sum + item.amount, 0);

  const isOverBudget = totalSpent > budget;

  return (
    <div className={
          theme === "gradient"
              ? `p-4 rounded shadow ${isOverBudget ? 'bg-red-900' : 'bg-green-900'}`
              : `p-4 rounded shadow ${isOverBudget ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900'}`
          }>
      <h2 className="text-lg font-medium">
        {isOverBudget ? "⚠️ Over Budget!" : "✅ Within Budget"}
      </h2>
      <p className="text-sm">
        You spent ₹{totalSpent} out of ₹{budget} this month.
      </p>
    </div>
  );
};

export default BudgetAlert;
