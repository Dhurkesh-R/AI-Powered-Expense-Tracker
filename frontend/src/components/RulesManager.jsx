import React, { useEffect, useState } from "react";
import { fetchRules, addRule, deleteRule } from "../services/api";

const RulesManager = ({ theme }) => {
  const [rules, setRules] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false); 
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  // NEW STATE: Tracks whether the rule list is expanded (default: true)
  const [isRulesListOpen, setIsRulesListOpen] = useState(true);

  useEffect(() => {
    loadRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const clearMessages = () => {
    setMessage("");
    setError("");
  };
  
  const loadRules = async () => {
    setLoading(true);
    clearMessages();
    try {
      const data = await fetchRules();
      if (data.status === "success") {
        setRules(data.rules);
      } else {
        setError(data.message || "Failed to fetch rules");
      }
    } catch (err) {
        setError("Network error while fetching rules.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddRule = async () => {
    if (!keyword || !category) {
        setError("Both Keyword and Category fields are required.");
        return;
    }
    
    setLoading(true);
    clearMessages();
    
    try {
        const data = await addRule(keyword, category);
        if (data.status === "success") {
            setMessage(data.message);
            setKeyword("");
            setCategory("");
            // After adding a new rule, ensure the list is open to show the result
            setIsRulesListOpen(true); 
            loadRules(); 
        } else {
            setError(data.message || "Failed to add rule");
        }
    } catch (err) {
        setError("Network error while adding rule.");
    } finally {
        setLoading(false);
    }
  };
  
  const handleDeleteRule = async (id) => {
    setLoading(true);
    clearMessages();

    try {
        const data = await deleteRule(id);
        if (data.status === "success") {
            setMessage("Rule deleted successfully.");
            setRules(rules.filter((r) => r.id !== id));
        } else {
            setError(data.message || "Failed to delete rule");
        }
    } catch (err) {
        setError("Network error while deleting rule.");
    } finally {
        setLoading(false);
    }
  };

  // Function to toggle the collapse state
  const toggleRulesList = () => {
    setIsRulesListOpen(prev => !prev);
  };

  return (
    <div
      className={
        theme === "gradient"
          ? "bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 py-6 px-6 rounded-2xl shadow-xl text-white" // Reduced padding slightly
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
          onChange={(e) => { setKeyword(e.target.value); clearMessages(); }}
          disabled={loading}
          className={
            theme === "gradient"
              ? "border p-2 rounded w-full bg-gray-800 text-white border border-gray-600 bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 py-3 px-6 rounded-xl shadow"
              : "border p-2 rounded w-full dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600"
          }
        />
        <input
          type="text"
          placeholder="Category (e.g. Food)"
          value={category}
          onChange={(e) => { setCategory(e.target.value); clearMessages(); }}
          disabled={loading}
          className={
            theme === "gradient"
              ? "border p-2 rounded w-full bg-gray-800 text-white border border-gray-600 bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 py-3 px-6 rounded-xl shadow"
              : "border p-2 rounded w-full dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600"
          }
        />
        <button
          onClick={handleAddRule}
          disabled={loading || !keyword || !category}
          className={`
              theme === "gradient"
                ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-4 py-2 rounded shadow"
                : "bg-blue-600 text-white py-2 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          `}
        >
          {loading ? "Saving..." : "Add Rule"}
        </button>
      </div>

      {/* Collapse Toggle Header */}
      <div className="flex justify-between items-center py-2 mt-4 cursor-pointer" onClick={toggleRulesList}>
        <h3 className="text-lg font-medium select-none">
          Category Rules ({rules.length})
        </h3>
        <button
          type="button"
          aria-expanded={isRulesListOpen}
          aria-controls="rules-list-container"
          className="text-lg transition-transform duration-300 text-blue-400 hover:text-blue-300"
        >
          {isRulesListOpen ? '▲' : '▼'}
        </button>
      </div>
      
      {/* Rules List (Conditionally Rendered) */}
      <div 
        id="rules-list-container"
        className={`transition-all duration-500 ease-in-out overflow-hidden ${isRulesListOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="space-y-2 pt-2">
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
                  onClick={() => handleDeleteRule(r.id)} 
                  disabled={loading}
                  className={`
                      text-red-500 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                      ${loading ? 'text-gray-500' : ''}
                  `}
                >
                  Delete
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-400 pt-2">
              {loading ? "Loading rules..." : "No rules yet"}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      {message && <p className="text-green-400 mt-3">{message}</p>}
      {error && <p className="text-red-400 mt-3">{error}</p>}
    </div>
  );
};

export default RulesManager;
