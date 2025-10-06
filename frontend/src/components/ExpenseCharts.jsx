import React, { useState } from "react";
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";


// Reuse these colors for Pie slices
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#aa66cc", "#ff4444"];

// Weekly helper
function getISOWeek(date) {
  const tempDate = new Date(date.getTime());
  tempDate.setHours(0, 0, 0, 0);
  tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
  const yearStart = new Date(tempDate.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((tempDate - yearStart) / 86400000 + 1) / 7);
  return weekNo;
}

const ExpenseCharts = ({ data, monthlyBudget = 0, theme }) => {
  const [activeTab, setActiveTab] = useState("category");
  
  const exportAsImage = async () => {
    const chartDiv = document.getElementById(`chart-${activeTab}`);
    if (!chartDiv) return;
    const canvas = await html2canvas(chartDiv);
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `expense_${activeTab}_chart.png`;
    link.click();
  };
  
  const exportAsPDF = async () => {
    const chartDiv = document.getElementById(`chart-${activeTab}`);
    if (!chartDiv) return;
    const canvas = await html2canvas(chartDiv);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("landscape");
    pdf.addImage(imgData, "PNG", 10, 10, 280, 150);
    pdf.save(`expense_${activeTab}_chart.pdf`);
  };
  // Pie data: by category
  const categoryData = data.reduce((acc, curr) => {
    const category = curr.category?.trim().toLowerCase(); // normalize
    if (!category) return acc;

    const found = acc.find((e) => e.name === category);
    if (found) {
      found.value += curr.amount;
    } else {
      acc.push({ name: category, value: curr.amount });
    }
    return acc;
  }, []);


  // Line data: by month
  const monthlyData = data.reduce((acc, curr) => {
    const month = new Date(curr.ds).toLocaleString("default", { month: "short", year: "numeric" });
    const found = acc.find((e) => e.month === month);
    if (found) found.total += curr.amount;
    else acc.push({ month, total: curr.amount });
    return acc;
  }, []).sort((a, b) => new Date(`1 ${a.month}`) - new Date(`1 ${b.month}`));

  const budgetData = monthlyData.map((m) => ({ ...m, budget: monthlyBudget }));

  // Weekly data
  const weeklyData = data.reduce((acc, curr) => {
    const week = `${getISOWeek(new Date(curr.ds))} - ${new Date(curr.ds).getFullYear()}`;
    const found = acc.find((e) => e.week === week);
    if (found) found.total += curr.amount;
    else acc.push({ week, total: curr.amount });
    return acc;
  }, []).sort((a, b) => a.week.localeCompare(b.week));

  return (
    <div className={
          theme === "gradient"
              ? "bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 py-12 px-6 rounded-2xl shadow-xl"
              : "my-6 bg-white dark:bg-gray-800 dark:text-white shadow rounded p-4 dark:border-gray-600"
          }>
      <h2 className="text-xl font-bold mb-4">📊 Expense Insights</h2>

      {/* Tabs */}
      <div className="flex space-x-4 border-b pb-2 mb-4">
        {[
          { id: "category", label: "By Category" },
          { id: "monthly", label: "Monthly Trend" },
          { id: "weekly", label: "Weekly Trend" },
          { id: "budget", label: "Budget vs Actual" },
        ].map((tab) => (
          <button
            key={tab.id}
            className={
          theme === "gradient"
              ? `py-1 px-3 rounded-t-md ${activeTab === tab.id ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white" : "bg-gray-900 text-white"}`
              : `py-1 px-3 rounded-t-md ${activeTab === tab.id ? "bg-blue-600 text-white dark:bg-blue-700" : "bg-gray-100 text-gray-600"}`
          }
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex justify-end mb-4 gap-2">
        <button
          className={
          theme === "gradient"
              ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-3 py-1 rounded shadow"
              : "px-3 py-1 bg-green-500 text-white rounded dark:bg-blue-700 dark:hover:bg-blue-800"
          }
          onClick={exportAsImage}
        >
          📸 Export PNG
        </button>
        <button
          className={
          theme === "gradient"
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded shadow"
              : "px-3 py-1 bg-purple-500 text-white rounded dark:bg-blue-700 hover:bg-blue-800"
          }
          onClick={exportAsPDF}
        >
          📄 Export PDF
        </button>
      </div>


      {/* Chart panels */}
      <div id="chart-category">
        {activeTab === "category" && (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label={({ name, percent }) =>
                  `${name.charAt(0).toUpperCase() + name.slice(1)} (${(percent * 100).toFixed(1)}%)`
                }
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      <div id="chart-monthly">
        {activeTab === "monthly" && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <div id="chart-weekly">
        {activeTab === "weekly" && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#00C49F" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <div id="chart-budget">
        {activeTab === "budget" && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={budgetData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="budget" stroke="#FF6B6B" strokeWidth={2} />
              <Line type="monotone" dataKey="total" stroke="#00C49F" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default ExpenseCharts;
