import React, { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";

const EditSplitSummary = ({ summary, setSummary }) => {
  const { theme } = useTheme();
  const [showModal, setShowModal] = useState(false);

  // handle balance change
  const handleChange = (index, value) => {
    const updated = [...summary];
    updated[index].balance = Number(value);
    setSummary(updated);
  };

  const handleUpdate = async () => {
    try {
      // Here you’d call API to persist changes if needed
      console.log("Updated summary:", summary);
      setShowModal(false);
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  const inputClass =
    theme === "gradient"
      ? "w-full border px-2 py-1 rounded bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 text-white shadow"
      : "w-full border px-2 py-1 rounded dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600";

  const modalClass =
    theme === "gradient"
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
            <h2 className="text-lg font-bold mb-4">Edit Split Summary</h2>

            <ul className="text-sm space-y-2">
              {summary.map((user, index) => (
                <li
                  key={user.username}
                  className={
                    theme === "gradient"
                      ? "bg-gradient-to-r from-indigo-800 to-blue-800 rounded-md px-4 py-2 shadow-md"
                      : "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-800 rounded-md px-4 py-2 shadow-sm"
                  }
                >
                  <span className="font-semibold">{user.username}</span>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">
                      Balance
                    </label>
                    <input
                      type="number"
                      value={user.balance}
                      onChange={(e) => handleChange(index, e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className={
                  theme === "gradient"
                    ? "px-3 py-1 bg-gray-900 text-white rounded"
                    : "px-3 py-1 bg-gray-300 rounded"
                }
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className={
                  theme === "gradient"
                    ? "px-3 py-1 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded hover:bg-blue-700"
                    : "px-3 py-1 bg-blue-500 text-white rounded dark:bg-blue-700 dark:hover:bg-blue-800"
                }
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

export default EditSplitSummary;
