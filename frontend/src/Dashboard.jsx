import React, { useEffect, useState, useCallback } from "react";
import ForecastChart from "./components/ForecastChart";
import HistoricalTable from "./components/HistoricalTable";
import BudgetAlert from "./components/BudgetAlert";
import { fetchForecast, fetchHistorical, getGroupExpenses, fetchNotifications, fetchMonthlyBudget } from "./services/api";
import { useAuth } from "./contexts/AuthContext";
import AddExpenseForm from "./components/AddExpenseForm";
import EmptyState from "./components/EmptyState";
import ExpenseCharts from "./components/ExpenseCharts";
import SummaryCards from "./components/SummaryCards";
import SmartSuggestions from "./components/SmartSuggestions";
import ThemeToggle from "./components/ThemeToggle";
import GroupOptions from "./components/GroupOptions";
import { useTheme } from "./contexts/ThemeContext";
import AuditLogPanel from "./components/AuditLogPanel";
import UserSpendingSplit from "./components/UserSpendingSplit";
import SplitSuggestionCard from "./components/SplitSuggestionCard";
import CategoryBudgetManager from './components/CategoryBudgetManager';
import MonthlyBudgetManager from "./components/MonthlyBudgetManager";


const Dashboard = () => {
  const [forecast, setForecast] = useState([]);
  const [historical, setHistorical] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { user, logout } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState(""); // "" = personal
  const { theme, cycleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [uniqueCategories, setUniqueCategories] = useState([]);
  const [monthlyBudget, setMonthlyBudgetState] = useState(0);

  // Fetch monthly budget from backend
  const getBudget = useCallback(async () => {
    try {
      const data = await fetchMonthlyBudget();
      setMonthlyBudgetState(data.limit || 0);
    } catch (error) {
      console.error("Error fetching monthly budget:", error);
    }
  }, []);

  useEffect(() => {
    getBudget();
  }, [getBudget]);

  useEffect(() => { const loadNotifications = async () => {
    try { 
      const data = await fetchNotifications();
      data.notifications.forEach((note) => {
        toast.info(note); 
      }); 
    } catch (err) {
      console.error("Notification fetch failed", err);
    } 
  };
    loadNotifications(); 
    // Poll every 1 min (optional) 
    const interval = setInterval(loadNotifications, 60000); 
    return () => clearInterval(interval); 
  }, []);


  useEffect(() => {
    if (historical && historical.length > 0) {
      // Get an array of all categories from the historical data
      const allCategories = historical.map(item => item.category);
      
      // Use a Set to filter for unique values and convert back to an array
      const unique = [...new Set(allCategories)];
      
      setUniqueCategories(unique);
    }
  }, [historical]);

  const triggerReload = () => {
    setReloadKey((k) => k + 1); // increment key -> remount chart
  };


  const loadForecast = async () => {
    try {
      const forecastData = await fetchForecast();
      setForecast(forecastData);
    } catch (err) {
      if (err.message.includes("Not enough data")) {
        setMessage("You need to add at least one expense to see forecasts.");
      } else {
        setMessage("Something went wrong. Please try again.");
      }
    }
  };

  const loadHistorical = async () => {
    try {
      const historicalData = selectedGroup
        ? await getGroupExpenses(selectedGroup)
        : await fetchHistorical();
      setHistorical(historicalData);
    } catch (err) {
      setError(err.message || "Failed to load data.");
    }
  };

  useEffect(() => {
    loadForecast();
    loadHistorical();
  }, [selectedGroup]);

  return (
    <div className={
      theme === "gradient"
          ? "min-h-screen bg-gray-900 text-white"
          : "min-h-screen bg-gray-100 dark:bg-gray-900 dark:text-white"
    }>
      <div className={
        theme === "gradient"
          ? "flex justify-between items-center bg-gradient-to-br from-indigo-900 via-gray-900 to-indigo-900 text-white px-6 py-4 shadow"
          : "flex justify-between items-center bg-white dark:bg-gray-900 dark:text-white px-6 py-4 shadow"
      }>
        <h1 className="text-2xl font-bold text-blue-600">💸 Expense Dashboard</h1>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-4">
          <span className="text-sm">👤 {user}</span>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
          >
            Logout
          </button>
          <ThemeToggle />
        </div>

        {/* Hamburger for mobile */}
        <button
          className="md:hidden flex items-center px-2 py-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Open menu"
        >
          <svg className={
              theme === "gradient"
                ? "w-6 h-6 text-white" 
                : "w-6 h-6 text-black dark:text-white" 
            } fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className={
          (theme === "gradient"
            ? "bg-gradient-to-br from-indigo-700 via-gray-700 to-indigo-700"
            : "bg-white dark:bg-gray-900 dark:text-white")
          + " md:hidden flex flex-col justify-end px-6 py-4 gap-3 shadow"
        }>
          <span className="text-sm">👤 {user}</span>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
          >
            Logout
          </button>
          <ThemeToggle />
        </div>
      )}

      <div className="p-4 max-w-6xl mx-auto space-y-6">
        {/* Group selection and actions */}
        <GroupOptions
          selectedGroup={selectedGroup}
          setSelectedGroup={setSelectedGroup}
          theme={theme}
          user={user}
        />

        {/* Summary cards */}
        <SummaryCards expenses={historical} theme={theme}/>

        {/* Forecast section */}
        {forecast.length === 0 ? (
          <EmptyState
            icon="📊"
            title="No Forecast Yet"
            subtitle="Add some expenses to see your spending trends!"
            theme={theme}
          />
        ) : (
          <ForecastChart data={forecast} theme={theme}/>
        )}

        <MonthlyBudgetManager theme={theme} historicalData={historical} />

        <CategoryBudgetManager
          theme={theme}
          categories={uniqueCategories} // You'll need to derive this from your expense data
          historicalData={historical} // Pass the historical data to calculate spending
        />

        {/* Budget alert */}
        <BudgetAlert data={historical} budget={monthlyBudget} theme={theme}/>

        {/* Error and historical data */}
        {error && <p className="text-red-500">{error}</p>}
        {historical.length === 0 ? (
          <EmptyState
            icon="📃"
            title="No History Yet"
            subtitle="Add some expenses to see Historical Table!"
            theme={theme}
          />
        ) : (
          <>
            <HistoricalTable data={historical} onExpenseUpdated={loadHistorical} theme={theme} groupId={selectedGroup}/>
            <ExpenseCharts data={historical} monthlyBudget={monthlyBudget} theme={theme}/>
            {selectedGroup && <AuditLogPanel groupId={selectedGroup} />}
            <SmartSuggestions theme={theme} className="mb-10"/>
            <div className="flex w-full gap-4 items-stretch"> 
              {selectedGroup && (
                <UserSpendingSplit
                  key={reloadKey}
                  groupId={selectedGroup}
                  theme={theme}
                />
              )}
              {selectedGroup && (
                <SplitSuggestionCard
                  groupId={selectedGroup}
                  theme={theme}
                  onUpdated={triggerReload}
                />
              )}
            </div>
            
          </>
        )}
        <AddExpenseForm onExpenseAdded={loadHistorical} groupId={selectedGroup} theme={theme}/>
      </div>
    </div>
  );
};

export default Dashboard;