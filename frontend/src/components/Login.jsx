import React, { useState } from "react";
import { loginUser } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = ({ theme }) => {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { token, user } = await loginUser(form);
      login(user, token);
      navigate("/")
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={
          theme === "gradient"
              ? "max-w-md mx-auto	bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 text-white p-6 mt-10 shadow rounded"
              : "max-w-md mx-auto bg-white dark:bg-gray-800 dark:text-white p-6 mt-10 shadow rounded"
          }>
      <h2 className="text-xl font-bold mb-4">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="username" onChange={handleChange} className={
          theme === "gradient"
              ? "border w-full p-2 bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 rounded-2xl shadow"
              : "border w-full p-2 dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600"
          } placeholder="Username" />
        <input name="password" type="password" onChange={handleChange} className={
          theme === "gradient"
              ? "border w-full p-2 bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 rounded-2xl shadow"
              : "border w-full p-2 dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600"
          } placeholder="Password" />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button className={
          theme === "gradient"
              ? "w-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-4 py-2 rounded shadow"
              : "w-full bg-blue-600 text-white px-4 py-2 rounded shadow"
        } type="submit">Login</button>
        <p className="text-sm text-center">
          Don't have an account? <a href="/register" className="text-blue-600 hover:underline">Register</a>
        </p>
      </form>
    </div>
  );
};

export default Login;
