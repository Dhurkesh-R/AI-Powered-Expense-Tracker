const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const fetchWithRefresh = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    if (res.status === 401) {
      const refreshRes = await fetch(`${API_BASE}/refresh`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("refresh_token")}`,
        },
      });

      const refreshJson = await refreshRes.json();
      if (refreshJson.status === "success") {
        localStorage.setItem("token", refreshJson.token);
        options.headers["Authorization"] = `Bearer ${refreshJson.token}`;
        return await fetch(url, options);
      } else {
        throw new Error("Session expired. Please login again.");
      }
    }
    return res;
  } catch (err) {
    throw err;
  }
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

// 🔐 Auth
export const loginUser = async (credentials) => {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const json = await res.json();
  if (json.status !== "success") throw new Error(json.message);
  return json;
};

export const registerUser = async (credentials) => {
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const json = await res.json();
  if (json.status !== "success") throw new Error(json.message);
  return json;
};

// 📈 Forecast
export const fetchForecast = async () => {
  const res = await fetchWithRefresh(`${API_BASE}/predict`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch forecast data");
  }
  const json = await res.json();
  return json.forecast;
};

// 📊 Historical Data
export const fetchHistorical = async () => {
  const res = await fetchWithRefresh(`${API_BASE}/historical`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch historical data");
  }
  const json = await res.json();
  return json.historical;
};

// ➕ Add new expense
export const addExpense = async (expense) => {
  const res = await fetchWithRefresh(`${API_BASE}/add-expense`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(expense),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to add expense");
  }
  return res.json();
};

// 📝 Update existing expense
export const updateExpense = async (id, updatedExpense) => {
  const res = await fetchWithRefresh(`${API_BASE}/update-expense/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(updatedExpense),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to update expense");
  }
  return res.json();
};

// ❌ Delete expense
export const deleteExpense = async (id) => {
  const res = await fetchWithRefresh(`${API_BASE}/delete-expense/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to delete expense");
  }
  return res.json();
};

// 🧠 Category Predictor
export const predictCategory = async (description) => {
  const res = await fetchWithRefresh(`${BASE_URL}/predict-category`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ description }),
  });
  const json = await res.json();
  if (json.status !== "success") throw new Error(json.message);
  return json.category;
};

// 🧠 Smart Suggestions
export const getSuggestions = async () => {
  const res = await fetchWithRefresh(`${API_BASE}/suggestions`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to get suggestions");
  }
  return res.json().then((json) => json.suggestions);
};

// 
// 🚀 GROUP-RELATED ROUTES
//

// Get all groups for logged-in user
export const getUserGroups = async () => {
  const res = await fetchWithRefresh(`${API_BASE}/api/groups`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch groups");
  }
  return res.json().then((json) => json.groups);
};

// Create a new group
export const createGroup = async (name) => {
  const res = await fetchWithRefresh(`${API_BASE}/api/groups`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to create group");
  }
  return res.json();
};

// Invite user to group
export const inviteToGroup = async (groupId, username) => {
  const res = await fetchWithRefresh(`${API_BASE}/api/groups/${groupId}/invite`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to invite user to group");
  }
  return res.json();
};

// Delete a group
export const deleteGroup = async (groupId) => {
  const res = await fetchWithRefresh(`${API_BASE}/api/groups/${groupId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to delete group");
  }
  return res.json();
};

// Get expenses for a group
export const getGroupExpenses = async (groupId) => {
  const res = await fetchWithRefresh(`${API_BASE}/api/groups/${groupId}/expenses`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch group expenses");
  }
  return res.json();
};

// Get Group users
export const getGroupUsers = async (groupId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/api/group_users/${groupId}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to load group users");
  const data = await res.json();
  return data.users;
};

export const removeUser = async (groupId, userId) => {
  const res = await fetchWithRefresh(`${API_BASE}/api/remove_user`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ group_id: groupId, user_id: userId }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to remove user");
  }

  return res.json();
};

export const getCurrentUser = async () => {
  const res = await fetchWithRefresh(`${API_BASE}/api/current_user`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch user info");
  }

  return res.json().then((data) => data.user);
};

export const fetchAuditLog = async (groupId) => {
  const res = await fetchWithRefresh(`${API_BASE}/api/group/${groupId}/audit-log`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch Audit log");
  }

  return res.json();
};

export const fetchGroupSpendingSplit = async (groupId) => {
  const res = await fetchWithRefresh(`${API_BASE}/api/group/${groupId}/spending_split`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch group spending split");
  }

  return res.json();
};

export const getSplitSummary = async (groupId) => {
  const res = await fetchWithRefresh(`${API_BASE}/api/group/${groupId}/split-summary`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch split summary");
  }

  return res.json();
};

export const updateSplitSummary = async (groupId, summary) => {
  const res = await fetchWithRefresh(`${API_BASE}/api/group/${groupId}/split-summary`, {
    method: "PUT",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ summary }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to update split summary");
  }

  return res.json();
};

export const setBudget = async (category, limit) => {
  const res = await fetchWithRefresh(`${API_BASE}/budgets`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ category, limit }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to set budget");
  }

  return res.json();
};

export const fetchBudgets = async () => {
  const res = await fetchWithRefresh(`${API_BASE}/budgets`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch budgets");
  }

  return res.json().then((json) => json.budgets);
};

export const fetchNotifications = async () => {
  const res = await fetchWithRefresh(`${API_BASE}/notifications`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch notifications");
  }

  return res.json().then((json) => json.notifications);
};

 // For monthly budget
export const fetchMonthlyBudget = async () => {
  const res = await fetch(`${API_BASE}/budget`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return await res.json(); // return the whole object
};

export const setMonthlyBudget = async (limit) => {
  const res = await fetch(`${API_BASE}/budget`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ limit }),
  });
  return await res.json();
};

export const fetchEmail = async () => {
  const res = await fetch(`${API_BASE}/check-email`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return await res.json(); // return the whole object
};

export const registerEmail = async (email) => {
  const res = await fetch(`${API_BASE}/register-email`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ email }),
  });
  return await res.json();
};