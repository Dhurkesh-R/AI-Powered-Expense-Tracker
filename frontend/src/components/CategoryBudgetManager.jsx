import React, { useState, useEffect, useCallback } from 'react';
import { setBudget,  fetchBudgets } from '../services/api';

const CategoryBudgetManager = ({ theme, categories, historicalData }) => {
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // 1. Wrap the fetch logic in useCallback so it can be safely used in handleSaveBudget
  const getBudgets = useCallback(async () => {
    try {
      const budgets = await fetchBudgets();
      
      const fetchedBudgets = {};
      budgets.forEach(b => {
        fetchedBudgets[b.category] = b.limit;
      });
      
      setCategoryBudgets(fetchedBudgets);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  }, []); // Dependencies are empty since fetchBudgets and setCategoryBudgets are stable

  // 2. Initial fetch on component mount
  useEffect(() => {
    getBudgets();
  }, [getBudgets]); // Dependency array includes getBudgets, but useCallback makes it stable

  const handleBudgetChange = (value) => {
    const currentCategory = categories[currentCategoryIndex];
    setCategoryBudgets({
      ...categoryBudgets,
      [currentCategory]: Number(value),
    });
  };

  const handleSaveBudget = async () => {
    const currentCategory = categories[currentCategoryIndex];
    const budgetAmount = categoryBudgets[currentCategory] || 0;
    
    try {
      setLoading(true)
      // Save the budget to the backend
      await setBudget(currentCategory, budgetAmount)
      
      // 3. 🚨 Key Fix: Re-fetch the budgets after a successful save.
      // This ensures the state is updated with the officially saved value.
      await getBudgets();
      setMessage("Budget saved successfully!");

    } catch (error) {
      console.error('Error saving budget:', error);
      setError(err.message || "Error saving budget");
    } finally {
      setLoading(false)
    }
  };

  const handleSwipeLeft = () => {
    setCurrentCategoryIndex((prevIndex) => 
      (prevIndex - 1 + categories.length) % categories.length
    );
  };

  const handleSwipeRight = () => {
    setCurrentCategoryIndex((prevIndex) => 
      (prevIndex + 1) % categories.length
    );
  };

  // Get total spent for the current category this month
  const currentMonth = new Date().getMonth() + 1;
  const currentCategoryName = categories[currentCategoryIndex] || '';
  const totalSpentForCategory = historicalData
    .filter(item => 
      new Date(item.ds).getMonth() + 1 === currentMonth && 
      item.category === currentCategoryName
    )
    .reduce((sum, item) => sum + item.amount, 0);

  const budgetLimit = categoryBudgets[currentCategoryName] || 0;
  const overBudget = totalSpentForCategory > budgetLimit;

  return (
    <div className={
      theme === "gradient"
        ? "bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 py-12 px-6 rounded-2xl shadow-xl"
        : "bg-white dark:bg-gray-900 dark:text-white p-4 rounded shadow"
    }>
      <h2 className="text-xl font-bold mb-2">💷Category Budgets</h2>
      
      {categories.length > 0 ? (
        <>
          {/* Swiping UI */}
          <div className="flex justify-center items-center mb-4">
            <button onClick={handleSwipeLeft}>&lt;</button>
            <h4 className="text-xl mx-2 font-semibold">
              {currentCategoryName}
            </h4>
            <button onClick={handleSwipeRight}>&gt;</button>
          </div>
          
          {/* Budget Alert for the current category */}
          {budgetLimit > 0 && (
            <div className={
              theme === "gradient"
                  ? `p-4 rounded shadow ${overBudget ? 'bg-red-900' : 'bg-green-900'}`
                  : `p-4 rounded shadow ${overBudget ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900'}`
              }>
              <p className="text-sm">
                Spent ₹{totalSpentForCategory.toFixed(2)} of ₹{budgetLimit.toFixed(2)}
              </p>
            </div>
          )}

          {/* Budget Input and Save Button */}
          <label className="block my-2 text-sm font-medium">
            Set Budget (₹):
          </label>
          <input
            type="number"
            value={categoryBudgets[currentCategoryName] || ''}
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
            disabled={loading}
          >
            {loading ? "Setting..." : "Set Budget"}
          </button>
        </>
      ) : (
        <p>No categories available to set budgets.</p>
      )}
      {message && <p className="text-green-600 mt-2">{message}</p>}
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
};

export default CategoryBudgetManager;