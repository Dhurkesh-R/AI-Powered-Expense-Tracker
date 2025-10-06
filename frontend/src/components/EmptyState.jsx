import React from "react";

const EmptyState = ({ icon, title, subtitle, theme}) => {
  return (
    <div className={
          theme === "gradient"
              ? "text-center	bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 py-12 px-6 rounded-xl shadow"
              : "text-center py-10 px-4 text-gray-600 border border-gray-200 rounded-lg shadow-sm bg-white dark:bg-gray-900 dark:text-white"
          }>
      <div className="text-4xl mb-4">{icon}</div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2">{subtitle}</p>
    </div>
  );
};

export default EmptyState;
