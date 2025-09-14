import React, { useEffect, useState } from "react";
import { fetchGroupSpendingSplit } from "../services/api";
import { PieChart, Pie, Tooltip, Cell, Legend } from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#f87171", "#6ee7b7"];

export const loadSpendingSplit = async (groupId, setData, setMessage) => {
  try {
    const data = await fetchGroupSpendingSplit(groupId);
    setData(data);
  } catch (err) {
    if (err.message.includes("Not enough data")) {
      setMessage("You need to add at least one expense to see Spending Split Chart.");
    } else {
      setMessage("Something went wrong. Please try again.");
    }
  }
};

const UserSpendingSplit = ({ groupId, theme }) => {
  const [data, setData] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!groupId) return;
    loadSpendingSplit(groupId, setData, setMessage)
  }, [groupId]);

  if (!groupId || data.length === 0) return null;

  return (
    <div className={
              theme === "gradient"
                ? "basis-1/3 bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 p-4 rounded shadow"
                : "basis-1/3 bg-white dark:bg-gray-800 p-4 rounded shadow"
            }>
      <h2 className={
              theme === "gradient"
                ? "text-lg font-bold mb-2 text-white"
                : "text-lg font-bold mb-2 text-gray-800 dark:text-white"
            }>
        👥 Per-User Spending Split
      </h2>
      <PieChart width={360} height={300}>
        <Pie
          data={data}
          dataKey="total"
          nameKey="user"
          outerRadius={100}
          fill="#8884d8"
          label
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </div>
  );
};

export default UserSpendingSplit;