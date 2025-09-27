import React, { useEffect, useState } from "react";
import { fetchRules, addRule, deleteRule } from "../services/api";

const RulesManager = ({ theme }) => {
  const [rules, setRules] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);
  
  const loadRules = async () => {
    const data = await fetchRules();
    if (data.status === "success") {
      setRules(data.rules);
    } else {
      setError(data.message || "Failed to fetch rules");
    }
  };
  
  const handleAddRule = async () => {
    const data = await addRule(keyword, category);
    if (data.status === "success") {
      setMessage(data.message);
      setKeyword("");
      setCategory("");
      loadRules();
    } else {
      setError(data.message || "Failed to add rule");
    }
  };
  
  const handleDeleteRule = async (id) => {
    setLoading(true)
    const data = await deleteRule(id);
    if (data.status === "success") {
      setRules(rules.filter((r) => r.id !== id));
      setLoading(false)
    } else {
      setError(data.message || "Failed to delete rule");
      setLoading(false)
    }
  };

  return (
    <div
      className={
        theme === "gradient"
          ? "bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 py-12 px-6 rounded-2xl shadow-xl text-white"
          : "bg-white dark:bg-gray-900 dark:text-white p-4 rounded shadow my-4"
      }
    >
      <h2 className="text-xl font-semibold mb-4">⚙️ Manage Rules</h2>

      {/* Add Rule Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input
          type="text"
          placeholder="Keyword (e.g. Pizza)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className={
            theme === "gradient"
              ? "border p-2 rounded w-full bg-gray-800 text-white border-gray-600 bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 py-3 px-6 shadow"
              : "border p-2 rounded w-full dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
          }
        />
        <input
          type="text"
          placeholder="Category (e.g. Food)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={
            theme === "gradient"
              ? "border p-2 rounded w-full bg-gray-800 text-white border-gray-600 bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 py-3 px-6 shadow"
              : "border p-2 rounded w-full dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
          }
        />
        <button
          onClick={handleAddRule}
          disabled={loading}
          className={
            theme === "gradient"
              ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-4 py-2 rounded shadow"
              : "bg-blue-600 text-white py-2 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          }
        >
          {loading ? "Saving..." : "Add Rule"}
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-2">
        {rules.length > 0 ? (
          rules.map((r) => (
            <div
              key={r.id}
              className={
                theme === "gradient"
                  ? "flex justify-between items-center border border-gray-600 p-3 rounded-xl bg-gray-800 bg-opacity-40"
                  : "flex justify-between items-center border border-gray-300 dark:border-gray-600 p-3 rounded"
              }
            >
              <span>
                <b>{r.keyword}</b> → {r.category}
              </span>
              <button
                onClick={handleDeleteRule}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-400">No rules yet</p>
        )}
      </div>

      {/* Messages */}
      {message && <p className="text-green-400 mt-3">{message}</p>}
      {error && <p className="text-red-400 mt-3">{error}</p>}
    </div>
  );
};

export default RulesManager;