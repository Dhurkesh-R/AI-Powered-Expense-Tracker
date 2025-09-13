import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Helper to format date as "DD MMM" (e.g., "20 May")
const formatDate = (str) => {
  const d = new Date(str);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

const ForecastChart = ({ data, theme }) => {
  return (
    <div className={
      theme === "gradient"
        ? "bg-gradient-to-r from-blue-900/80 via-gray-900/80 to-indigo-900/80 border border-blue-700 rounded-xl px-8 py-6 shadow-lg mb-6 transition-all duration-300 text-white"
        : "bg-white dark:bg-gray-900 dark:text-white p-4 rounded shadow"
    }>
      <h2 className="text-lg font-semibold mb-2">Forecast</h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <XAxis
            dataKey="ds"
            tickFormatter={formatDate}
            minTickGap={20}
            tick={{ fill: theme === "gradient" || theme === "dark" ? "#fff" : "#222", fontSize: 12 }}
          />
          <YAxis
            domain={[0, 'auto']}
            tick={{ fill: theme === "gradient" || theme === "dark" ? "#fff" : "#222", fontSize: 12 }}
          />
          <Tooltip
            labelFormatter={formatDate}
            contentStyle={{
              background: theme === "gradient" || theme === "dark" ? "#222" : "#fff",
              color: theme === "gradient" || theme === "dark" ? "#fff" : "#222",
              borderRadius: "8px",
              border: "none"
            }}
          />
          <Area type="monotone" dataKey="yhat" stroke="#3b82f6" fill="#93c5fd" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ForecastChart;