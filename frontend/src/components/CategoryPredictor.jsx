import React, { useState } from "react";
import { predictCategory } from "../services/api";

const CategoryPredictor = () => {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const result = await predictCategory(description);
      setCategory(result);
    } catch (err) {
      setError("Failed to predict category.");
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow my-4">
      <h2 className="text-xl font-semibold mb-2">🧠 Predict Expense Category</h2>
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-center gap-4">
        <input
          type="text"
          className="flex-1 border p-2 rounded w-full"
          placeholder="e.g. Dinner at KFC"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Predict
        </button>
      </form>
      {category && (
        <p className="mt-4 text-green-700">📂 Predicted Category: <strong>{category}</strong></p>
      )}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
};

export default CategoryPredictor;
