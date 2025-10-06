import React, { useState, useEffect } from "react";
import { getUserGroups, deleteGroup } from "../services/api";

const DeleteGroupModal = ({ onClose, onGroupDeleted, theme }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await getUserGroups();
        setGroups(data);
      } catch (err) {
        setError("Failed to load groups.");
      }
    };
    loadGroups();
  }, []);

  const handleDelete = async () => {
    if (!selectedGroupId) {
      setError("Please select a group to delete.");
      return;
    }
    setLoading(true);
    try {
      await deleteGroup(selectedGroupId);
      onGroupDeleted(selectedGroupId);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to delete group.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={
        theme === "gradient"
          ? "bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 text-white p-6 rounded shadow-lg w-96"
          : "bg-white dark:bg-gray-800 text-black dark:text-white p-6 rounded shadow-lg w-96"
      }>
        <h2 className="text-lg font-semibold mb-2">Delete Group</h2>
        <label className="block mb-2 text-sm">Select a group to delete:</label>
        <select
          value={selectedGroupId}
          onChange={e => setSelectedGroupId(e.target.value)}
          className={
            theme === "gradient"
              ? "w-full appearance-none border border-blue-500 bg-gradient-to-r from-blue-900 via-gray-900 to-indigo-900 bg-gray-800 text-white px-4 py-2 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              : "w-full px-3 py-2 border dark:bg-gray-800 dark:text-white rounded"
          }
        >
          <option value="">-- Select Group --</option>
          {groups.map(group => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <div className="flex justify-end mt-4 space-x-2">
          <button
            onClick={onClose}
            className={
              theme === "gradient"
                ? "px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded"
                : "px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded"
            }
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteGroupModal;