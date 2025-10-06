import React, { useState } from 'react'
import GroupSelector from './GroupSelector'
import CreateGroupModal from './CreateGroupModal'
import UsersModal from './UsersModal'
import { HiUserAdd, HiPlusCircle, HiUserRemove, HiUsers } from "react-icons/hi";
import DeleteGroupModal from './DeleteGroupModal';

const GroupOptions = ({ selectedGroup, setSelectedGroup, theme, user }) => {
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showDeleteGroup, setShowDeleteGroup] = useState(false);

  return (
    <div className={
      theme === "gradient"
        ? "flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-blue-900/80 via-gray-900/80 to-indigo-900/80 border border-blue-700 rounded-xl px-8 py-6 shadow-lg mb-6 transition-all duration-300 text-white"
        : "flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-900 dark:text-white px-8 py-6 mb-6 border border-gray-300 dark:border-gray-600"
    }>
      <div className="flex-1">
        <GroupSelector
          selectedGroup={selectedGroup}
          setSelectedGroup={setSelectedGroup}
          theme={theme}
        />
      </div>
      <div className="flex gap-3 items-center">
        <button
          onClick={() => setShowCreateGroup(true)}
          className={
            theme === "gradient"
              ? "flex items-center gap-2 text-sm font-semibold px-4 py-2 mt-3 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              : "flex items-center gap-2 text-sm font-semibold px-4 py-2 mt-3 bg-blue-500 dark:bg-blue-800 text-white rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          }>
          <HiPlusCircle className="text-lg" />
          Create Group
        </button>
        {!selectedGroup && (
          <button
            onClick={() => setShowDeleteGroup(true)}
            className={
              theme === "gradient"
                ? "flex items-center gap-2 text-sm font-semibold px-4 py-2 mt-3 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400"
                : "flex items-center gap-2 text-sm font-semibold px-4 py-2 mt-3 bg-red-500 dark:bg-red-800 text-white rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            }
          >
            <HiUserRemove className="text-lg" />
            Delete Group
          </button>
        )}
        {selectedGroup && (
          <button
            onClick={() => setShowUsers(true)}
            className={
              theme === "gradient"
                ? "flex items-center gap-2 text-sm font-semibold px-4 py-2 mt-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400"
                : "flex items-center gap-2 text-sm font-semibold px-4 py-2 mt-3 bg-blue-600 text-white rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            }
          >
            <HiUsers className="text-lg" />
            Users
          </button>
        )}
      </div>
      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={() => window.location.reload()} // refresh to see new group
          theme={theme}
        />
      )}
      {showDeleteGroup && (
        <DeleteGroupModal
          onClose={() => setShowDeleteGroup(false)}
          onGroupDeleted={() => window.location.reload()} // refresh to see new group
          theme={theme}
        />
      )}
      {showUsers && (
        <UsersModal
          groupId={selectedGroup}
          currentUser={user} // from logged-in user
          onClose={() => window.location.reload()}
          theme={theme}
        />
      )}
    </div>
  )
}

export default GroupOptions
