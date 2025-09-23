import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CategoryBudgetManager = ({ theme, token, categories, historicalData }) => {
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const response = await axios.get('/api/budgets', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const fetchedBudgets = {};
        response.data.budgets.forEach(b => {
          fetchedBudgets[b.category] = b.limit;
        });
        setCategoryBudgets(fetchedBudgets);
      } catch (error) {
        console.error('Error fetching budgets:', error);
      }
    };
    if (token) {
      fetchBudgets();
    }
  }, [token]);

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
      await axios.post('/api/budgets', {
        category: currentCategory,
        limit: budgetAmount,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Budget saved successfully!');
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Failed to save budget.');
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
      <h3 className="text-lg font-bold mb-2">Category Budgets</h3>
      
      {categories.length > 0 ? (
        <>
          {/* Swiping UI */}
          <div className="flex justify-between items-center mb-4">
            <button onClick={handleSwipeLeft}>&lt;</button>
            <h4 className="text-xl font-semibold">
              {currentCategoryName}
            </h4>
            <button onClick={handleSwipeRight}>&gt;</button>
          </div>
          
          {/* Budget Alert for the current category */}
          {budgetLimit > 0 && (
            <div className={`p-2 rounded-lg text-white mb-4 ${overBudget ? 'bg-red-500' : 'bg-green-500'}`}>
              <p className="text-sm">
                Spent ₹{totalSpentForCategory.toFixed(2)} of ₹{budgetLimit.toFixed(2)}
              </p>
            </div>
          )}

          {/* Budget Input and Save Button */}
          <label className="block mb-2 text-sm font-medium">
            Set Budget (₹):
          </label>
          <input
            type="number"
            value={categoryBudgets[currentCategoryName] || ''}
            onChange={(e) => handleBudgetChange(e.target.value)}
            className="border p-2 rounded w-full dark:bg-gray-800"
          />
          <button 
            onClick={handleSaveBudget} 
            className="mt-4 w-full bg-blue-500 text-white p-2 rounded"
          >
            Set Budget
          </button>
        </>
      ) : (
        <p>No categories available to set budgets.</p>
      )}
    </div>
  );
};

export default CategoryBudgetManager;