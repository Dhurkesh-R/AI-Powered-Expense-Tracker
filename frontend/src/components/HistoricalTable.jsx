import React, { useState, useEffect } from "react";
import UpdateExpense from "./UpdateExpense";
import DeleteExpense from "./DeleteExpense";
import { getGroupExpenses } from "../services/api";

const HistoricalTable = ({ data, onExpenseUpdated, theme, groupId }) => {
  const historical = data
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [descModal, setDescModal] = useState({ show: false, text: "" });
  const [users, setUsers] = useState([]);

  const handleShowDescription = (text) => {
    setDescModal({ show: true, text });
  };

  const handleCloseDescription = () => {
    setDescModal({ show: false, text: "" });
  };


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
  useEffect(() => {
    if (!groupId) return;
    fetchUsers();
  }, [groupId]);


  const filteredExpenses = historical.filter((e) => {
    const term = searchTerm.toLowerCase();
    return (
      e.category.toLowerCase().includes(term) ||
      e.amount.toString().includes(term) ||
      e.ds.toLowerCase().includes(term) ||
      e.description?.toLowerCase().includes(term)
    );
  });


  return (
    <div className={
          theme === "gradient"
              ? "	bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 py-12 px-6 rounded-2xl shadow-xl overflow-x-auto"
              : "bg-white dark:bg-gray-900 dark:text-white p-4 rounded shadow overflow-x-auto border border-gray-300 dark:border-gray-600"
          }>
      <h2 className="text-xl font-semibold mb-2">📅Historical Data</h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by category, date, or amount..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={
          theme === "gradient"
              ? "w-full md:w-1/3 px-3 py-2 border border-gray-600 rounded bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 rounded-2xl shadow"
              : "w-full md:w-1/3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-black dark:text-white"
          }
        />
      </div>

      <table className="w-full text-left border-collapse">
        <thead className={
          theme === "gradient"
              ? "bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 "
              : "bg-gray-100 dark:bg-gray-800"
          }>
          <tr>
            <th className="px-4 py-3 border-b font-semibold">Date</th>
            <th className="px-4 py-3 border-b font-semibold">Amount</th>
            <th className="px-4 py-3 border-b font-semibold">Category</th>
            <th className="px-4 py-3 border-b font-semibold">Description</th>
            <th className="px-4 py-3 border-b font-semibold text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredExpenses.map((item, idx) => (
            <tr key={idx} className={
          theme === "gradient"
              ? idx % 2 === 0 ? "bg-gradient-to-br from-blue-800 via-gray-800 to-indigo-800 " : "bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900 "
              : idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"
          }>
              <td className="px-4 py-2 border-b">{item.ds}</td>
              <td className="px-4 py-2 border-b">₹{item.amount}</td>
              <td className="px-4 py-2 border-b">{item.category}</td>
              <td
                className="px-4 py-2 border-b cursor-pointer"
                onClick={() => handleShowDescription(item.description)}
                title={item.description}
              >
                {item.description.length > 30 ? `${item.description.slice(0, 30)}...` : item.description}
              </td>
              <td className="px-4 py-2 border-b text-center space-x-2">
                {!groupId && (
                  <>
                    <UpdateExpense expense={item} onUpdated={onExpenseUpdated} />
                    <DeleteExpense id={item.id} onDeleted={onExpenseUpdated} />
                  </>
                )}
                {groupId && (
                  <>
                    {item.is_authorised ? (
                      <>
                        <UpdateExpense expense={item} onUpdated={onExpenseUpdated} />
                        <DeleteExpense id={item.id} onDeleted={onExpenseUpdated} />
                      </>
                    ) : (
                      <span
                        title="Only the owner or admin can edit/delete this"
                        className="text-gray-500 dark:text-gray-400 text-sm flex items-center justify-center gap-1"
                      >
                        🔒 Not yours
                      </span>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {descModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className={
          theme === "gradient"
              ? "bg-gray-900 text-white p-6 rounded shadow-lg w-80"
              : "bg-white dark:bg-gray-800 text-black dark:text-white p-6 rounded shadow-lg w-80"
          }>
            <h3 className="text-lg font-semibold mb-2">📝 Full Description</h3>
            <p className="text-sm">{descModal.text}</p>
            <div className="flex justify-end mt-4">
              <button
                onClick={handleCloseDescription}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HistoricalTable;