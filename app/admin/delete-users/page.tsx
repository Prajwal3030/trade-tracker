"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getAllRegisteredUsers, deleteAllUserCredentials, type UserCredentials } from "@/lib/userCredentials";
import { useRouter } from "next/navigation";

export default function DeleteUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserCredentials[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }

    if (user) {
      loadUsers();
    }
  }, [user, loading, router]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const allUsers = await getAllRegisteredUsers();
      setUsers(allUsers);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load users");
      console.error("Error loading users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Are you sure you want to delete ALL ${users.length} user credentials? This action cannot be undone!`)) {
      return;
    }

    if (!confirm("This will delete all usernames and email records. Are you absolutely sure?")) {
      return;
    }

    try {
      setIsDeleting(true);
      setError("");
      setSuccess("");
      
      // Use API route instead of client-side function
      const response = await fetch("/api/admin/delete-all-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user credentials");
      }

      setSuccess(data.message || `Successfully deleted ${data.deletedCount} user credentials.`);
      setUsers([]);
    } catch (err: any) {
      setError(err.message || "Failed to delete user credentials");
      console.error("Error deleting users:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111827]">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Delete All User Credentials</h1>
          <p className="text-gray-400">Warning: This will permanently delete all user credentials from the database.</p>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
            {success}
          </div>
        )}

        <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Current Users</h2>
              <p className="text-gray-400 text-sm">
                {users.length} user{users.length !== 1 ? "s" : ""} found in database
              </p>
            </div>
            <button
              onClick={loadUsers}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>

          {users.length > 0 && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm font-medium mb-2">⚠️ Warning</p>
              <p className="text-gray-300 text-sm">
                Deleting all user credentials will remove all usernames and email records. 
                Users will need to set up their credentials again. This action cannot be undone.
              </p>
            </div>
          )}

          <button
            onClick={handleDeleteAll}
            disabled={isDeleting || users.length === 0}
            className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {isDeleting ? "Deleting..." : `Delete All ${users.length} User Credentials`}
          </button>
        </div>

        {users.length > 0 && (
          <div className="bg-gray-800/50 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      User ID
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {users.map((user) => (
                    <tr key={user.userId} className="hover:bg-gray-800/30">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono text-xs">
                        {user.userId.substring(0, 20)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {users.length === 0 && !isLoading && (
          <div className="bg-gray-800/50 rounded-lg p-8 text-center">
            <p className="text-gray-400">No user credentials found in the database.</p>
          </div>
        )}
      </div>
    </div>
  );
}

