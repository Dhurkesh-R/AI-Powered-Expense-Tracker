import React, { useState } from "react";
import { HiMicrophone } from "react-icons/hi"; 
import { addExpense, predictCategory } from "../services/api";

const AddExpenseForm = ({ onExpenseAdded, groupId, theme }) => {
  const [form, setForm] = useState({
    ds: "",
    amount: "",
    description: "",
    is_recurring: false,
    recurring_interval: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const micGifPath = './uploaded:Enable mic.gif-02eac828-77c4-4f2f-9c27-ec8a5367974e';

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
      setForm({
        ds: "",
        amount: "",
        description: "",
        is_recurring: false,
        recurring_interval: "",
      });
      onExpenseAdded();
    } catch (err) {
      setError(err.message || "Error adding expense");
    } finally {
      setLoading(false);
    }
  };

  // Voice recognition
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Your browser does not support speech recognition!");
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.start();
    setListening(true);

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setForm((prev) => ({ ...prev, description: text }));
      setListening(false);
      recognition.stop();

      try {
        setLoading(true);
        const predictedCategory = await predictCategory(text);
        const amount = extractAmount(text);
        setForm((prev) => ({ ...prev, amount: amount.toString() }));
        // Auto-submit after voice input
        const expenseData = {
          ds: new Date().toISOString().slice(0, 10),
          amount: amount,
          description: text,
          category: predictedCategory,
          group_id: groupId || null,
        };
        await addExpense(expenseData);
        setMessage(`Added ${amount} to ${predictedCategory}`);
        setForm({
          ds: "",
          amount: "",
          description: "",
          is_recurring: false,
          recurring_interval: "",
        });
        onExpenseAdded();
      } catch (err) {
        setError(err.message || "Error adding expense");
      } finally {
        setLoading(false);
      }
    };

    recognition.onerror = (err) => {
      console.error("Speech recognition error", err);
      setError("Speech recognition failed. Try again.");
      setListening(false);
    };
  };

  const extractAmount = (text) => {
    const match = text.match(/\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
  };

  return (
    <div className={
      theme === "gradient"
        ? "bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 py-12 px-6 rounded-2xl shadow-xl text-white"
        : "bg-white dark:bg-gray-900 dark:text-white p-4 rounded shadow my-4"
    }>
      <h2 className="text-xl font-semibold mb-4">➕ Add New Expense</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

        {/* Date Input */}
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

        {/* Amount Input */}
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

        {/* Description Input */}
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

        {/* Voice Button */}
        <button
          type="button"
          onClick={startListening}
          className={`
                col-span-1 w-16 h-16 rounded-full shadow-lg transition-all duration-300 transform 
                hover:scale-105 active:scale-95 flex items-center justify-center 
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

        {/* Recurring Checkbox */}
        <div className="flex items-center space-x-2 pl-4 pt-2">
          <input
            id="is_recurring"
            type="checkbox"
            checked={form.is_recurring}
            onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
          />
          <label htmlFor="is_recurring" className="text-lg pl-1">Is this recurring?</label>
        </div>

        {/* Recurring Interval */}
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

        {/* Submit Button */}
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
