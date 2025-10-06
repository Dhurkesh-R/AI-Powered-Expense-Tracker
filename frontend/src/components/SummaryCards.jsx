import React from "react";

const SummaryCards = ({ expenses, theme }) => {
  const currentMonth = new Date().getMonth();
  const thisMonthExpenses = expenses.filter(e => new Date(e.ds).getMonth() === currentMonth);

  const totalSpend = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryMap = {};
  thisMonthExpenses.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });
  const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  return (
    <div className={
      theme === "gradient"
          ? "bg-gradient-to-r from-blue-900/80 via-gray-900/80 to-indigo-900/80 border border-blue-700 rounded-xl px-8 py-6 shadow-lg mb-6 transition-all duration-300 text-white grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
          : "bg-white dark:bg-gray-900 dark:text-white grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 px-8 py-6 shadow-lg border-2 border-gray-300 dark:border-gray-600 rounded"
      }>
      <div className={
      theme === "gradient"
          ? "bg-blue-900 p-4 rounded shadow text-center"
          : "bg-blue-100 dark:bg-blue-900 p-4 rounded shadow text-center"
      }>
        <h3 className={
          theme === "gradient"
              ? "text-white"
              : "text-sm text-gray-600 dark:text-white"
          }>
          📅 This Month
        </h3>
        <p className={
          theme === "gradient"
              ? "text-gray-400 "
              : "text-xl font-bold dark:text-gray-400"
        }>{new Date().toLocaleString("default", { month: "long", year: "numeric" })}</p>
      </div>
      <div className={
          theme === "gradient"
              ? "bg-green-900 p-4 rounded shadow text-center"
              : "bg-green-100 dark:bg-green-900 p-4 rounded shadow text-center"
          }>
        <h3 className={
          theme === "gradient"
              ? "text-white"
              : "text-sm text-gray-600 dark:text-white"
          }>💸 Total Spent
        </h3>
        <p className={
          theme === "gradient"
              ? "text-gray-400"
              : "text-xl font-bold dark:text-gray-400"
        }>₹{totalSpend.toFixed(2)}</p>
      </div>
      <div className={
          theme === "gradient"
              ? "bg-amber-800 p-4 rounded shadow text-center"
              : "bg-yellow-100 dark:bg-amber-800 p-4 rounded shadow text-center"
      }>
        <h3 className={
          theme === "gradient"
              ? "text-white"
              : "text-sm text-gray-600 dark:text-white"
          }>🎯 Top Category
        </h3>
        <p className={
          theme === "gradient"
              ? "text-gray-400"
              : "text-xl font-bold dark:text-gray-400"
        }>{topCategory}</p>
      </div>
    </div>
  );
};

export default SummaryCards;
