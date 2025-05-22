import React from "react";
import { useTheme } from "../contexts/ThemeContext";

const ThemeToggle = () => {
  const { theme, cycleTheme } = useTheme();

  return (
    <button
      onClick={cycleTheme}
      className={
          theme === "gradient"
              ? "px-2 py-1 text-sm rounded bg-gradient-to-r from-indigo-500 to-blue-600 text-white  hover:opacity-90"
              : "px-2 py-1 text-sm rounded bg-gray-300 dark:bg-gray-700 hover:opacity-90"
          }
    >
      {theme === "light" && "🌞 Light"}
      {theme === "dark" && "🌚 Dark"}
      {theme === "gradient" && "🪼 Gradient"}
    </button>
  );
};

export default ThemeToggle;
