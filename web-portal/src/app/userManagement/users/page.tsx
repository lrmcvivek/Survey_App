"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import { userApi, authApi, User, RegisterRequest, canManageUser, getUserRoleRank, ROLE_RANK } from "@/lib/api";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import Loading from "@/components/ui/loading";

const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    password: "",
    role: "ADMIN",
    mobileNumber: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userApi.getUsers();
      setUsers(response.users);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation
    if (!formData.username || formData.username.length < 3) {
      toast.error("Username must be at least 3 characters long");
      return;
    }

    if (!formData.name || formData.name.length < 3) {
      toast.error("Name must be at least 3 characters long");
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (!formData.mobileNumber || formData.mobileNumber.length !== 10) {
      toast.error("Mobile number must be exactly 10 digits");
      return;
    }

    if (!formData.role) {
      toast.error("Please select a role");
      return;
    }

    setCreatingUser(true);
    try {
      // Prepare the data according to RegisterRequest interface
      const userData: RegisterRequest = {
        name: formData.name,
        username: formData.username,
        password: formData.password,
        role: formData.role as
          | "SUPERADMIN"
          | "ADMIN"
          | "SUPERVISOR"
          | "SURVEYOR",
        mobileNumber: formData.mobileNumber,
      };

      await authApi.register(userData);
      toast.success("User created successfully");
      setShowCreateModal(false);
      setFormData({
        username: "",
        name: "",
        password: "",
        role: "ADMIN",
        mobileNumber: "",
        status: "ACTIVE",
      });
      fetchUsers();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to create user";
      toast.error(errorMessage);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    // Input validation
    if (!formData.name || formData.name.length < 3) {
      toast.error("Name must be at least 3 characters long");
      return;
    }
    if (!formData.mobileNumber || formData.mobileNumber.length !== 10) {
      toast.error("Mobile number must be exactly 10 digits");
      return;
    }
    if (formData.password && formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    // Check role change permission
    const currentRoleRank = ROLE_RANK[selectedUser.role || selectedUser.userRoleMaps?.[0]?.role?.roleName || ""] || 0;
    const newRoleRank = ROLE_RANK[formData.role] || 0;
    
    if (currentUser && newRoleRank >= currentUserRank(currentUser)) {
      toast.error(`Cannot assign ${formData.role} role. You can only assign roles lower than your own.`);
      return;
    }

    // Show Update Confirmation modal before updating
    setShowUpdateConfirm(true);
  };

  const executeUpdate = async () => {
    if (!selectedUser || !currentUser) return;
    
    const currentRoleRank = ROLE_RANK[selectedUser.role || selectedUser.userRoleMaps?.[0]?.role?.roleName || ""] || 0;
    const newRoleRank = ROLE_RANK[formData.role] || 0;
    
    try {
      const updatePayload: any = { userId: selectedUser.userId };
      const roleChanged = formData.role !== (selectedUser.role || selectedUser.userRoleMaps?.[0]?.role?.roleName);
      if (formData.name && formData.name !== (selectedUser.name || "")) {
        updatePayload.name = formData.name;
      }
      if (
        formData.mobileNumber &&
        formData.mobileNumber !== (selectedUser.mobileNumber || "")
      ) {
        updatePayload.mobileNumber = formData.mobileNumber;
      }
      if (formData.password) {
        updatePayload.password = formData.password;
      }
      
      // Handle role change
      if (roleChanged && currentUser && getUserRoleRank(currentUser) > newRoleRank) {
        // Use assignRole API to change the role
        await authApi.assignRole({
          userId: selectedUser.userId,
          role: formData.role as "SUPERADMIN" | "ADMIN" | "SUPERVISOR" | "SURVEYOR",
          reason: `Role changed by ${currentUser.username}`,
        });
      }
      
      // Only send update if something actually changed (excluding role which is handled separately)
      if (
        !updatePayload.name &&
        !updatePayload.mobileNumber &&
        !updatePayload.password &&
        !roleChanged
      ) {
        toast("No changes detected.");
        return;
      }
      
      // Update user name, mobile number, and/or password (if there are changes)
      if (updatePayload.name || updatePayload.mobileNumber || updatePayload.password) {
        const updateRes = await userApi.updateUser(updatePayload);
        if (updateRes?.error) throw new Error(updateRes.error);
      }

      await fetchUsers(); // Ensure UI is updated before closing modal
      toast.success("User updated successfully");
      setShowEditModal(false);
      setShowEditConfirm(false);
      setSelectedUser(null);
      setUserToEdit(null);
      setFormData({
        username: "",
        name: "",
        password: "",
        role: "ADMIN",
        mobileNumber: "",
        status: "ACTIVE",
      });
    } catch (error: any) {
      let errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        "Failed to update user";
      toast.error(errorMessage);
      // Do NOT close modals or reset form here, so user can try again
    }
  };

  // Helper to get current user rank
  const currentUserRank = (user: typeof currentUser) => {
    if (!user) return 0;
    return getUserRoleRank(user);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await userApi.deleteUser({ userId, hardDelete: true });
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete user");
    }
  };

  const handleDeactivateUser = async (user: User) => {
    try {
      await userApi.updateUserStatus({
        userId: user.userId,
        isActive: !user.isActive,
      });
      toast.success(`User ${user.isActive ? "deactivated" : "activated"} successfully`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update user status");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const userRole = user.role || user.userRoleMaps?.[0]?.role?.roleName || "";
    const matchesRole = !selectedRole || userRole === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Sort users by role hierarchy (highest to lowest), then by name
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const roleA = a.role || a.userRoleMaps?.[0]?.role?.roleName || "";
    const roleB = b.role || b.userRoleMaps?.[0]?.role?.roleName || "";
    const rankA = ROLE_RANK[roleA] || 0;
    const rankB = ROLE_RANK[roleB] || 0;
    
    // First sort by role rank (descending)
    if (rankA !== rankB) {
      return rankB - rankA;
    }
    
    // Then sort by name (ascending)
    const nameA = a.name || a.username;
    const nameB = b.name || b.username;
    return nameA.localeCompare(nameB);
  });

  if (loading) {
    return (
      <ProtectedRoute requireWebPortalAccess>
        <Loading fullScreen />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireWebPortalAccess>
      <MainLayout>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white-900">
              User Management
            </h1>
          </div>

          {/* Controls */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-black text-white"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              >
                <option value="">All Roles</option>
                <option value="SUPERADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="SURVEYOR">Surveyor</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={!currentUser || getUserRoleRank(currentUser) < ROLE_RANK.ADMIN}
                className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  !currentUser || getUserRoleRank(currentUser) < ROLE_RANK.ADMIN
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                title={!currentUser || getUserRoleRank(currentUser) < ROLE_RANK.ADMIN ? "Only Admin can create users" : "Add user"}
              >
                Add User
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedUsers.map((user) => {
                  const userRole =
                    user.role ||
                    user.userRoleMaps?.[0]?.role?.roleName ||
                    "N/A";
                  return (
                    <tr key={user.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || user.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userRole === "SUPERADMIN"
                              ? "bg-purple-100 text-purple-800"
                              : userRole === "ADMIN"
                              ? "bg-blue-100 text-blue-800"
                              : userRole === "SUPERVISOR"
                              ? "bg-orange-100 text-orange-800"
                              : userRole === "SURVEYOR"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {userRole}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(() => {
                          const canManage = currentUser && canManageUser(currentUser, user);
                          const userRoleName = user.role || user.userRoleMaps?.[0]?.role?.roleName || "";
                          
                          return (
                            <div className="flex items-center space-x-2">
                              {/* Edit Button */}
                              <button
                                onClick={() => {
                                  setUserToEdit(user);
                                  setShowEditConfirm(true);
                                }}
                                disabled={!canManage}
                                className={`p-2 rounded-lg transition ${
                                  canManage
                                    ? "text-blue-600 hover:bg-blue-50"
                                    : "text-gray-300 cursor-not-allowed"
                                }`}
                                title={!canManage ? `Cannot edit users with ${userRoleName} role or higher` : "Edit user"}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              
                              {/* Delete Button */}
                              <button
                                onClick={() => {
                                  setUserToDelete(user.userId);
                                  setShowDeleteConfirm(true);
                                }}
                                disabled={!canManage}
                                className={`p-2 rounded-lg transition ${
                                  canManage
                                    ? "text-red-600 hover:bg-red-50"
                                    : "text-gray-300 cursor-not-allowed"
                                }`}
                                title={!canManage ? `Cannot delete users with ${userRoleName} role or higher` : "Delete user"}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                              
                              {/* Deactivate/Activate Button */}
                              <button
                                onClick={() => {
                                  setUserToDeactivate(user);
                                  setShowDeactivateConfirm(true);
                                }}
                                disabled={currentUser?.userId === user.userId || !canManage}
                                className={`p-2 rounded-lg transition ${
                                  currentUser?.userId === user.userId || !canManage
                                    ? "text-gray-300 cursor-not-allowed"
                                    : user.isActive
                                    ? "text-orange-600 hover:bg-orange-50"
                                    : "text-green-600 hover:bg-green-50"
                                }`}
                                title={
                                  currentUser?.userId === user.userId
                                    ? "Cannot deactivate your own account"
                                    : !canManage
                                    ? `Cannot manage users with ${userRoleName} role or higher`
                                    : user.isActive ? "Deactivate" : "Activate"
                                }
                              >
                                {user.isActive ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Create User Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Create New User
                  </h3>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Username
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Enter username"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Enter name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <input
                        type="password"
                        placeholder="Enter password"
                        required
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Role
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({ ...formData, role: e.target.value })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      >
                        {currentUser && getUserRoleRank(currentUser) > ROLE_RANK.SUPERADMIN ? (
                          <>
                            <option value="SUPERADMIN">Super Admin</option>
                            <option value="ADMIN">Admin</option>
                            <option value="SUPERVISOR">Supervisor</option>
                            <option value="SURVEYOR">Surveyor</option>
                            <option value="VIEWER">Viewer</option>
                          </>
                        ) : (
                          <>
                            <option value="ADMIN">Admin</option>
                            <option value="SUPERVISOR">Supervisor</option>
                            <option value="SURVEYOR">Surveyor</option>
                            <option value="VIEWER">Viewer</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Mobile Number
                      </label>
                      <input
                        type="text"
                        placeholder="Enter mobile number"
                        pattern="[0-9]{10}"
                        maxLength={10}
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        value={formData.mobileNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            mobileNumber: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 10),
                          })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={creatingUser}
                        className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          creatingUser
                            ? "bg-blue-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {creatingUser ? "Creating..." : "Create User"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Edit User Modal */}
          {showEditModal && selectedUser && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Edit User
                  </h3>
                  <form onSubmit={handleEditUser} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Username
                      </label>
                      <input
                        type="text"
                        disabled
                        placeholder="Enter username"
                        value={formData.username}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Role
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({ ...formData, role: e.target.value })
                        }
                        disabled={!currentUser || getUserRoleRank(currentUser) <= ROLE_RANK[formData.role]}
                        className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          !currentUser || getUserRoleRank(currentUser) <= ROLE_RANK[formData.role]
                            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                            : "bg-white text-gray-900"
                        }`}
                        title={!currentUser || getUserRoleRank(currentUser) <= ROLE_RANK[formData.role] 
                          ? `Cannot assign ${formData.role} role or higher` 
                          : "Change user role"}
                      >
                        {currentUser && getUserRoleRank(currentUser) > ROLE_RANK.SUPERADMIN ? (
                          <>
                            <option value="SUPERADMIN">Super Admin</option>
                            <option value="ADMIN">Admin</option>
                            <option value="SUPERVISOR">Supervisor</option>
                            <option value="SURVEYOR">Surveyor</option>
                            <option value="VIEWER">Viewer</option>
                          </>
                        ) : (
                          <>
                            <option value="ADMIN">Admin</option>
                            <option value="SUPERVISOR">Supervisor</option>
                            <option value="SURVEYOR">Surveyor</option>
                            <option value="VIEWER">Viewer</option>
                          </>
                        )}
                      </select>
                      {(!currentUser || getUserRoleRank(currentUser) <= ROLE_RANK[formData.role]) && (
                        <p className="text-xs text-orange-600 mt-1">
                          ⚠️ You can only assign roles lower than your own
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Mobile Number
                      </label>
                      <input
                        type="text"
                        placeholder="Enter mobile number"
                        pattern="[0-9]{10}"
                        maxLength={10}
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        value={formData.mobileNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            mobileNumber: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 10),
                          })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Password (leave blank to keep unchanged)
                      </label>
                      <input
                        type="password"
                        placeholder="Enter new password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowEditModal(false)}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // Validate before showing confirmation
                          if (!formData.name || formData.name.length < 3) {
                            toast.error("Name must be at least 3 characters long");
                            return;
                          }
                          if (!formData.mobileNumber || formData.mobileNumber.length !== 10) {
                            toast.error("Mobile number must be exactly 10 digits");
                            return;
                          }
                          if (formData.password && formData.password.length < 8) {
                            toast.error("Password must be at least 8 characters long");
                            return;
                          }
                          setShowUpdateConfirm(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Update User
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Edit Confirmation Modal */}
          {showEditConfirm && userToEdit && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
              <div className="relative mx-auto p-6 border w-96 shadow-lg rounded-lg bg-white">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Edit User</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    You are about to edit user <strong>{userToEdit.name || userToEdit.username}</strong>. 
                    Click "Continue" to proceed with editing user details.
                  </p>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => {
                        setShowEditConfirm(false);
                        setUserToEdit(null);
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(userToEdit);
                        const userRoleName = userToEdit.role || userToEdit.userRoleMaps?.[0]?.role?.roleName || "";
                        setFormData({
                          username: userToEdit.username,
                          name: userToEdit.name || "",
                          password: "",
                          role: userRoleName,
                          mobileNumber: userToEdit.mobileNumber || "",
                          status: userToEdit.isActive ? "ACTIVE" : "INACTIVE",
                        });
                        setShowEditConfirm(false);
                        setUserToEdit(null);
                        setShowEditModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Update Confirmation Modal */}
          {showUpdateConfirm && selectedUser && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
              <div className="relative mx-auto p-6 border w-96 shadow-lg rounded-lg bg-white">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Update User</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Are you sure you want to update user <strong>{selectedUser.name || selectedUser.username}</strong>? This action will modify the user details.
                  </p>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => {
                        setShowUpdateConfirm(false);
                        // Keep the form open with current values
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        executeUpdate();
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Proceed
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && userToDelete && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
              <div className="relative mx-auto p-6 border w-96 shadow-lg rounded-lg bg-white">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Delete User</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Are you sure you want to delete this user? This action cannot be undone and will permanently remove the user from the system.
                  </p>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteUser(userToDelete);
                        setShowDeleteConfirm(false);
                        setUserToDelete(null);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Deactivate/Activate Confirmation Modal */}
          {showDeactivateConfirm && userToDeactivate && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
              <div className="relative mx-auto p-6 border w-96 shadow-lg rounded-lg bg-white">
                <div className="text-center">
                  <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
                    userToDeactivate.isActive ? 'bg-orange-100' : 'bg-green-100'
                  }`}>
                    <svg className={`h-6 w-6 ${
                      userToDeactivate.isActive ? 'text-orange-600' : 'text-green-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {userToDeactivate.isActive ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {userToDeactivate.isActive ? "Deactivate" : "Activate"} User
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Are you sure you want to {userToDeactivate.isActive ? "deactivate" : "activate"} this user?
                  </p>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => {
                        setShowDeactivateConfirm(false);
                        setUserToDeactivate(null);
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        handleDeactivateUser(userToDeactivate);
                        setShowDeactivateConfirm(false);
                        setUserToDeactivate(null);
                      }}
                      className={`px-4 py-2 text-white rounded-md hover:bg-opacity-90 ${
                        userToDeactivate.isActive 
                          ? "bg-orange-600 hover:bg-orange-700" 
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {userToDeactivate.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default UserManagementPage;
