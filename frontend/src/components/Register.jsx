import React, { useState } from "react";
import { registerUser } from "../services/api";

const Register = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUser(form);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-900 dark:text-white p-6 mt-10 shadow rounded">
      <h2 className="text-xl font-bold mb-4">Register</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="username" onChange={handleChange} className="border w-full p-2" placeholder="Username" />
        <input name="password" type="password" onChange={handleChange} className="border w-full p-2" placeholder="Password" />
        {success && <p className="text-green-500">Registered! You can log in now.</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Register</button>
        <p className="text-sm text-center">
          Already have an account? <a href="/login" className="text-blue-600 hover:underline">Login</a>
        </p>
      </form>
    </div>
  );
};

export default Register;
