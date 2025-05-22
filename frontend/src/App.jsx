import React, { useEffect, useState } from "react";
import { fetchForecast, fetchHistorical } from "./services/api";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { useTheme } from "./contexts/ThemeContext";


const App = () => {
  const { theme, cycleTheme } = useTheme();

  return (
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login theme={theme}/>} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
          </Routes>
        </AuthProvider>
      </Router>
  );
};

export default App;
