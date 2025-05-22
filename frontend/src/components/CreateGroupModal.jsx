import React, { useState } from "react";
import { createGroup } from "../services/api";

const CreateGroupModal = ({ onClose, onGroupCreated, theme }) => {
  const [name, setName] = useState("");
  const [error, setError] = useState(null);

  const handleCreate = async () => {
    try {
      const group = await createGroup(name);
      onGroupCreated(group);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={
          theme === "gradient"
              ? "bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 text-white p-6 rounded shadow-lg w-96"
              : "bg-white dark:bg-gray-900 text-black dark:text-white p-6 rounded shadow-lg w-96"
          }>
        <h2 className="text-lg font-semibold mb-2">Create New Group</h2>
        <input
          type="text"
          placeholder="Group Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={
          theme === "gradient"
              ? "w-full px-3 py-2 border bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 text-white rounded"
              : "w-full px-3 py-2 border dark:bg-gray-800 dark:text-white rounded"
          }
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <div className="flex justify-end mt-4 space-x-2">
          <button onClick={onClose} className={
          theme === "gradient"
              ? "px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded"
              : "px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded"
          }>Cancel</button>
          <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create</button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;