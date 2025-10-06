import React, { useEffect, useState } from "react";
import { fetchAuditLog } from "../services/api";
import { useTheme } from "../contexts/ThemeContext";

const AuditLogPanel = ({ groupId }) => {
  const [logs, setLogs] = useState([]);
  const { theme } = useTheme();

  useEffect(() => {
    if (!groupId) return;
    fetchAuditLog(groupId).then(setLogs).catch(console.error);
  }, [groupId]);

  return (
    <div className={
      theme === "gradient"
        ? "bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 p-6 rounded-2xl shadow-xl mt-6 text-white"
        : "bg-white dark:bg-gray-900 p-4 rounded shadow mt-6 border border-gray-300 dark:border-gray-600"
    }>
      <h3 className={
        theme === "gradient"
          ? "text-lg font-semibold mb-3 text-white"
          : "text-lg font-semibold mb-3 text-gray-700 dark:text-white"
      }>
        🕓 Expense Audit Log
      </h3>
      <ul className="text-sm space-y-2">
        {logs.map((log, i) => (
          <li
            key={i}
            className={
              theme === "gradient"
                ? "bg-gradient-to-r from-indigo-800 to-blue-800 rounded-md px-4 py-2 shadow-md"
                : "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-800 rounded-md px-4 py-2 shadow-sm"
            }
          >
            <span className={
              theme === "gradient"
                ? " font-semibold text-blue-200"
                : "font-semibold text-blue-800 dark:text-blue-200"
            }>{log.user}</span>{" "}
            <span className={
              theme === "gradient"
                ? "text-white"
                : "text-black dark:text-white"
            }>{log.action}</span>{" "}
            <span className={
              theme === "gradient"
                ? "italic text-blue-100"
                : "italic text-blue-800 dark:text-blue-100"
            }>description:</span>{" "}
            <span className={
              theme === "gradient"
                ? "text-white"
                : "text-black dark:text-white"
            }>{log.description}</span>,{" "}
            <span className={
              theme === "gradient"
                ? "text-blue-200"
                : "italic text-blue-800 dark:text-blue-100"
            }>amount:</span>{" "}
            <span className={
              theme === "gradient"
                ? "text-green-300"
                : "text-green-800 dark:text-green-300"
            }>₹{log.amount}</span>{" "}
            <span className={
              theme === "gradient"
                ? "italic text-blue-100"
                : "italic text-blue-800 dark:text-blue-100"
            }>on</span>{" "}
            <span className={
              theme === "gradient"
                ? "text-gray-200"
                : "text-gray-800 dark:text-gray-200"
            }>
              {new Date(log.date).toLocaleDateString()}
            </span>{" "}
            <span className={
              theme === "gradient"
                ? "italic text-blue-100"
                : "italic text-blue-800 dark:text-blue-100"
            }>at</span>{" "}
            <span className={
              theme === "gradient"
                ? "text-gray-200"
                : "text-gray-800 dark:text-gray-200"
            }>
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AuditLogPanel;
