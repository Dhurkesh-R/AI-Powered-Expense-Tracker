import React, { useState, useEffect } from "react";
import { inviteToGroup, getGroupUsers, removeUser, getCurrentUser } from "../services/api";

const UsersModal = ({ groupId, onClose, theme }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const handleRemove = async (userIdToRemove) => {
    const confirm = window.confirm("Are you sure you want to remove this user?");
    if (!confirm) return;

    try {
      const res = await removeUser(groupId, userIdToRemove);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userIdToRemove));
        setMessage("User removed successfully.");
      } else {
        setMessage(res.error || "Failed to remove user");
      }
    } catch (err) {
      setMessage("Failed to remove user");
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const users = await getGroupUsers(groupId);
        setUsers(users);
      } catch (err) {
        setMessage("Failed to load users");
      }
      setLoading(false);
    };
    fetchUsers();
  }, [groupId, inviteOpen, message]);

  const handleInvite = async () => {
    setInviteLoading(true);
    setMessage("");
    try {
      await inviteToGroup(groupId, username);
      setMessage("User invited successfully!");
      setUsername("");
      setInviteOpen(false);
    } catch (err) {
      setMessage(err.message);
    }
    setInviteLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={
          theme === "gradient"
            ? "bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 text-white p-0 rounded-lg shadow-lg w-[380px] max-w-full"
            : "bg-white dark:bg-gray-900 text-black dark:text-white p-0 rounded-lg shadow-lg w-[380px] max-w-full"
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Group Members</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 text-xl font-bold"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* User List */}
        <div className="px-6 py-4 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="text-center text-gray-400">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center text-gray-400">No users in this group.</div>
          ) : (
            <ul className="space-y-3">
              {users.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between bg-black/10 dark:bg-white/5 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold uppercase">
                      {user.username[0]}
                    </div>
                    <span className="font-medium">{user.username}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        user.role === "admin" ? "bg-green-600" : "bg-gray-500"
                      } text-white`}
                    >
                      {user.role}
                    </span>
                      
                    {!user.is_authorised_user && (
                      <button
                        onClick={() => handleRemove(user.id)}
                        className="text-red-500 hover:underline text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Invite User Toggle */}
        <div className="px-6 py-3 border-t border-gray-700 flex flex-col gap-2">
          {!inviteOpen ? (
            <button
              onClick={() => {
                setInviteOpen(true);
                setMessage("");
              }}
              className={
                theme === "gradient"
                  ? "w-full py-2 rounded bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold hover:opacity-90"
                  : "w-full py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
              }
            >
              + Invite User
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={
                  theme === "gradient"
                    ? "w-full px-3 py-2 border bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 text-white rounded"
                    : "w-full px-3 py-2 border dark:bg-gray-800 dark:text-white rounded"
                }
                disabled={inviteLoading}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setInviteOpen(false)}
                  className={
                    theme === "gradient"
                      ? "px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded"
                      : "px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded"
                  }
                  disabled={inviteLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  disabled={inviteLoading || !username}
                >
                  {inviteLoading ? "Inviting..." : "Invite"}
                </button>
              </div>
            </div>
          )}
          {message && (
            <div className="text-sm mt-1 text-center text-green-400 dark:text-green-300">{message}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersModal;