// DeleteExpense.jsx
import React from "react";
import { deleteExpense } from "../services/api";

const DeleteExpense = ({ id, onDeleted }) => {
  const handleDelete = async () => {
    try {
      await deleteExpense(id);
      onDeleted();  // Refresh the table
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  return (
    <button
      className="ml-2 text-red-500 hover:text-red-700"
      onClick={handleDelete}
      title="Delete"
    >
      ❌
    </button>
  );
};

export default DeleteExpense;
