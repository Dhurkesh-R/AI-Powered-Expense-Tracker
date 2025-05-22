import React, { useState } from "react";
import { addExpense, predictCategory } from "../services/api";

const AddExpenseForm = ({ onExpenseAdded, groupId, theme }) => {
  const [form, setForm] = useState({
    ds: "",
    amount: "",
    description: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const predictedCategory = await predictCategory(form.description);
      const expenseData = {
        ...form,
        amount: parseFloat(form.amount),
        category: predictedCategory,
        group_id: groupId || null,
      };
      await addExpense(expenseData);
      setMessage("Expense added successfully!");
      setForm({ ds: "", amount: "", description: "" });
      onExpenseAdded();
    } catch (err) {
      setError(err.message || "Error adding expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={
          theme === "gradient"
              ? "bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 py-12 px-6 rounded-2xl shadow-xl text-white"
              : "bg-white dark:bg-gray-900 dark:text-white p-4 rounded shadow my-4"
          }>
      <h2 className="text-xl font-semibold mb-4">➕ Add New Expense</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
       <input
          name="ds"
          type="date"
          value={form.ds}
          onChange={handleChange}
          className={
          theme === "gradient"
              ? "border p-2 rounded w-full bg-gray-800 text-white border border-gray-600 bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 py-3 px-6 rounded-xl shadow"
              : "border p-2 rounded w-full dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600"
          }
          required
        />
        <input
          name="amount"
          type="number"
          placeholder="Amount"
          value={form.amount}
          onChange={handleChange}
          className={
          theme === "gradient"
              ? "border p-2 rounded w-full bg-gray-800 text-white border border-gray-600 bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 py-3 px-6 rounded-xl shadow"
              : "border p-2 rounded w-full dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600"
          }
          required
        />
        <input
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className={
          theme === "gradient"
              ? "border p-2 rounded md:col-span-2 w-full bg-gray-800 text-white border border-gray-600 bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 py-3 px-6 rounded-xl shadow"
              : "border p-2 rounded md:col-span-2 w-full dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600"
          }
          required
        />

        <div className="flex items-center space-x-2 pl-4 pt-2" >
          <input
            id="is_recurring"
            type="checkbox"
            checked={form.is_recurring || false}
            onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
          />
          <label htmlFor="is_recurring" className="text-lg pl-1">Is this recurring?</label>
        </div>
        
        {form.is_recurring && (
          <div className="relative">
            <select
              value={form.recurring_interval || ""}
              onChange={(e) => setForm({ ...form, recurring_interval: e.target.value })}
              className={
                theme === "gradient"
                    ? "w-full appearance-none border border-blue-500 bg-gradient-to-r from-blue-900 via-gray-900 to-indigo-900 bg-gray-800 text-white px-4 py-2 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    : "border p-2 rounded w-full dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600"
              } 
            >
              <option value="">Select interval</option>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 dark:text-blue-200 text-xs">
              ▼
            </span>
          </div>
        )}

        <button
          type="submit"
          className={
          theme === "gradient"
              ? "col-span-1 md:col-span-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-4 py-2 rounded shadow"
              : "col-span-1 md:col-span-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          }
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Expense"}
        </button>
      </form>

      {message && <p className="text-green-600 mt-2">{message}</p>}
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
};

export default AddExpenseForm;
