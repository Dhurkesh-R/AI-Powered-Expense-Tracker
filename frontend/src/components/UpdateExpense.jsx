import React, { useState } from "react";
import { updateExpense } from "../services/api";
import { useTheme } from "../contexts/ThemeContext";

const UpdateExpense = ({ expense, onUpdated }) => {
  const { theme } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...expense });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      await updateExpense(form.id, form);
      setShowModal(false);
      onUpdated();
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  const inputClass = theme === "gradient"
    ? "w-full border px-2 py-1 rounded bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 text-white shadow"
    : "w-full border px-2 py-1 rounded dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600";

  const modalClass = theme === "gradient"
    ? "bg-gradient-to-br from-indigo-800 via-gray-900 to-indigo-800 text-white p-6 rounded shadow-lg w-[350px]"
    : "bg-white dark:bg-gray-900 dark:text-white p-6 rounded shadow-lg w-[350px]";

  return (
    <>
      <button
        className="text-orange-500 hover:text-orange-700"
        onClick={() => setShowModal(true)}
        title="Edit"
      >
        ✏️
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className={modalClass}>
            <h2 className="text-lg font-bold mb-4">Edit Expense</h2>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Amount</label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Category</label>
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                name="description"
                value={form.description}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className="mb-3">
              <input
                id="is_recurring"
                type="checkbox"
                checked={form.is_recurring}
                onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
              />
              <label htmlFor="is_recurring" className="text-lg pl-1">Is this recurring?</label>
            </div>

            <div className="mb-3">
              {form.is_recurring && (
                <select
                  value={form.recurring_interval}
                  onChange={(e) => setForm({ ...form, recurring_interval: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select interval</option>
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
              )}
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className={theme === "gradient" ? "px-3 py-1 bg-gray-900 text-white rounded" : "px-3 py-1 bg-gray-300 dark:bg-gray-500 dark:hover:bg-gray-600 rounded"}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className={theme === "gradient"
                  ? "px-3 py-1 	bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded hover:bg-blue-700"
                  : "px-3 py-1 bg-blue-500 text-white rounded dark:bg-blue-700 dark:hover:bg-blue-800"}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UpdateExpense;
