"use client";
import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import { userApi, authApi, User, RegisterRequest, canManageUser, getUserRoleRank, ROLE_RANK } from "@/lib/api";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import Loading from "@/components/ui/loading";
import { 
  Users, 
  UserPlus, 
  Search, 
  RefreshCw, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  MoreVertical,
  Settings,
  Lock,
  Unlock,
  Trash2,
  X,
  ChevronDown,
  CheckSquare,
  Square,
  Activity,
  UserCheck
} from "lucide-react";

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
    if (!formData.username || formData.username.length < 3) { toast.error("Username must be at least 3 characters long"); return; }
    if (!formData.name || formData.name.length < 3) { toast.error("Name must be at least 3 characters long"); return; }
    if (!formData.password || formData.password.length < 8) { toast.error("Password must be at least 8 characters long"); return; }
    if (!formData.mobileNumber || formData.mobileNumber.length !== 10) { toast.error("Mobile number must be exactly 10 digits"); return; }
    if (!formData.role) { toast.error("Please select a role"); return; }

    setCreatingUser(true);
    try {
      const userData: RegisterRequest = {
        name: formData.name,
        username: formData.username,
        password: formData.password,
        role: formData.role as "SUPERADMIN" | "ADMIN" | "SUPERVISOR" | "SURVEYOR",
        mobileNumber: formData.mobileNumber,
      };
      await authApi.register(userData);
      toast.success("User created successfully");
      setShowCreateModal(false);
      setFormData({ username: "", name: "", password: "", role: "ADMIN", mobileNumber: "", status: "ACTIVE" });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || "Failed to create user");
    } finally {
      setCreatingUser(false);
    }
  };

  const executeUpdate = async () => {
    if (!selectedUser || !currentUser) return;
    try {
      const updatePayload: any = { userId: selectedUser.userId };
      const roleChanged = formData.role !== (selectedUser.role || selectedUser.userRoleMaps?.[0]?.role?.roleName);
      if (formData.name && formData.name !== (selectedUser.name || "")) updatePayload.name = formData.name;
      if (formData.mobileNumber && formData.mobileNumber !== (selectedUser.mobileNumber || "")) updatePayload.mobileNumber = formData.mobileNumber;
      if (formData.password) updatePayload.password = formData.password;
      
      if (roleChanged && currentUser && getUserRoleRank(currentUser) > (ROLE_RANK[formData.role] || 0)) {
        await authApi.assignRole({
          userId: selectedUser.userId,
          role: formData.role as "SUPERADMIN" | "ADMIN" | "SUPERVISOR" | "SURVEYOR",
          reason: `Role changed by ${currentUser.username}`,
        });
      }
      
      if (updatePayload.name || updatePayload.mobileNumber || updatePayload.password) {
        await userApi.updateUser(updatePayload);
      }

      await fetchUsers();
      toast.success("User updated successfully");
      setShowEditModal(false);
      setShowEditConfirm(false);
      setShowUpdateConfirm(false);
      setSelectedUser(null);
      setUserToEdit(null);
      setFormData({ username: "", name: "", password: "", role: "ADMIN", mobileNumber: "", status: "ACTIVE" });
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.message || "Failed to update user");
    }
  };

  const handleDeactivate = async () => {
    if (!userToDeactivate) return;
    try {
      await userApi.updateUserStatus({ userId: userToDeactivate.userId, isActive: !userToDeactivate.isActive });
      toast.success(`User ${userToDeactivate.isActive ? "suspension" : "restoration"} complete`);
      setShowDeactivateConfirm(false);
      setUserToDeactivate(null);
      fetchUsers();
    } catch (error: any) {
      toast.error("Status update failure");
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await userApi.deleteUser({ userId: userToDelete, hardDelete: true });
      toast.success("User terminated successfully");
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error: any) {
      toast.error("Termination failed");
    }
  };

  const sortedUsers = users.filter((user) => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) || (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const role = user.role || user.userRoleMaps?.[0]?.role?.roleName || "";
    const matchesRole = !selectedRole || role === selectedRole;
    return matchesSearch && matchesRole;
  }).sort((a, b) => {
    const rankA = ROLE_RANK[a.role || a.userRoleMaps?.[0]?.role?.roleName || ""] || 0;
    const rankB = ROLE_RANK[b.role || b.userRoleMaps?.[0]?.role?.roleName || ""] || 0;
    if (rankA !== rankB) return rankB - rankA;
    return (a.name || a.username).localeCompare(b.name || b.username);
  });

  if (loading) return <ProtectedRoute requireWebPortalAccess><Loading fullScreen /></ProtectedRoute>;

  return (
    <ProtectedRoute requireWebPortalAccess>
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                 <Users className="w-6 h-6 text-blue-600" />
                 <h1 className="text-xl font-bold text-gray-900 tracking-tight">Staff Management</h1>
              </div>
              <p className="text-gray-500 text-sm">Manage administrative staff, field surveyors, and system access levels.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={!currentUser || getUserRoleRank(currentUser) < ROLE_RANK.ADMIN}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4" />
                Add New Staff Member
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                placeholder="Search by name or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
              />
            </div>
            
            <div className="relative min-w-[200px] w-full md:w-auto">
               <select
                 value={selectedRole}
                 onChange={(e) => setSelectedRole(e.target.value)}
                 className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all appearance-none cursor-pointer"
               >
                 <option value="">All Roles</option>
                 {["SUPERADMIN", "ADMIN", "SUPERVISOR", "SURVEYOR", "VIEWER"].map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
               </select>
               <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* User List Table */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">User Details</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">System Role</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Account Status</th>
                    <th className="px-6 py-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedUsers.map((user) => {
                    const role = user.role || user.userRoleMaps?.[0]?.role?.roleName || "N/A";
                    const isSelf = currentUser?.userId === user.userId;
                    const canManage = currentUser && canManageUser(currentUser, user);

                    return (
                      <tr key={user.userId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm bg-gray-100 text-gray-600 border border-gray-200`}>
                              {(user.name || user.username).charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                               <span className="text-sm font-semibold text-gray-900">{user.name || user.username} {isSelf && <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded ml-1.5 border border-blue-100 uppercase">You</span>}</span>
                               <span className="text-xs text-gray-500">@{user.username}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                              role === "SUPERADMIN" ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                              role === "ADMIN" ? "bg-blue-50 text-blue-700 border-blue-100" :
                              role === "SUPERVISOR" ? "bg-amber-50 text-amber-700 border-amber-100" :
                              "bg-gray-50 text-gray-700 border-gray-100"
                           }`}>
                             <Shield className="w-3 h-3" />
                             {role.replace('_', ' ')}
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-gray-300"}`}></div>
                              <span className={`text-xs font-medium ${user.isActive ? "text-emerald-700" : "text-gray-500"}`}>
                                {user.isActive ? "Active" : "Inactive"}
                              </span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => { setUserToEdit(user); setShowEditConfirm(true); }}
                                disabled={!canManage}
                                className={`p-2 rounded border transition-all ${canManage ? 'bg-white border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50' : 'text-gray-300 border-gray-100 cursor-not-allowed'}`}
                                title="Edit User"
                              >
                                 <Settings className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => { setUserToDeactivate(user); setShowDeactivateConfirm(true); }}
                                disabled={isSelf || !canManage}
                                className={`p-2 rounded border transition-all ${isSelf || !canManage ? 'text-gray-200 border-gray-100 cursor-not-allowed' : 'bg-white border-gray-200 text-gray-500 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50'}`}
                                title={user.isActive ? "Deactivate User" : "Activate User"}
                              >
                                 {user.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                              </button>
                              <button 
                                onClick={() => { setUserToDelete(user.userId); setShowDeleteConfirm(true); }}
                                disabled={isSelf || !canManage}
                                className={`p-2 rounded border transition-all ${isSelf || !canManage ? 'text-gray-200 border-gray-100 cursor-not-allowed' : 'bg-white border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50'}`}
                                title="Delete User"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowCreateModal(false)}></div>
            <div className="relative bg-white w-full max-w-lg rounded-lg border border-gray-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
               <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                     <div className="space-y-1">
                        <h3 className="text-lg font-bold text-gray-900">Add Staff Member</h3>
                        <p className="text-gray-500 text-xs">Register a new user to the system.</p>
                     </div>
                     <button onClick={() => setShowCreateModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded transition-all">
                        <X className="w-5 h-5" />
                     </button>
                  </div>

                  <form onSubmit={handleCreateUser} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">Username</label>
                          <input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" placeholder="e.g. john.doe" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">Full Name</label>
                          <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" placeholder="e.g. John Doe" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">Password</label>
                        <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" placeholder="Minimum 8 characters" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">User Role</label>
                          <div className="relative">
                            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all appearance-none cursor-pointer">
                               <option value="ADMIN">Administrator</option>
                               <option value="SUPERVISOR">Supervisor</option>
                               <option value="SURVEYOR">Field Surveyor</option>
                               <option value="VIEWER">Guest Viewer</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">Mobile Number</label>
                          <input type="text" maxLength={10} value={formData.mobileNumber} onChange={e => setFormData({...formData, mobileNumber: e.target.value.replace(/\D/g, "")})} className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" placeholder="10-digit number" />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 rounded-md font-semibold text-sm hover:bg-gray-50 transition-all">Cancel</button>
                        <button type="submit" disabled={creatingUser} className="flex-1 py-2 bg-blue-600 text-white rounded-md font-semibold text-sm hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50">
                           {creatingUser ? <Activity className="w-4 h-4 mx-auto animate-spin" /> : "Create User"}
                        </button>
                      </div>
                  </form>
               </div>
            </div>
          </div>
        )}

        {/* Status Change Confirmation */}
        {showDeactivateConfirm && userToDeactivate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowDeactivateConfirm(false)}></div>
            <div className="relative bg-white w-full max-w-sm rounded-lg border border-gray-200 shadow-xl p-6 text-center animate-in zoom-in-95 duration-200">
               <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 border border-amber-100">
                  {userToDeactivate.isActive ? <ShieldAlert className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
               </div>
               <h3 className="text-lg font-bold text-gray-900 mb-2">{userToDeactivate.isActive ? "Deactivate Account?" : "Activate Account?"}</h3>
               <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  Are you sure you want to change the status for <span className="text-blue-600 font-bold">@{userToDeactivate.username}</span>?
               </p>
               <div className="flex flex-col gap-2">
                  <button onClick={handleDeactivate} className="py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-semibold text-sm transition-all">Confirm Change</button>
                  <button onClick={() => setShowDeactivateConfirm(false)} className="py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-semibold text-sm transition-all">Cancel</button>
               </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}></div>
            <div className="relative bg-white w-full max-w-sm rounded-lg border border-red-100 shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
               <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                  <Trash2 className="w-8 h-8 text-red-600" />
               </div>
               <h3 className="text-lg font-bold text-gray-900 mb-2">Delete User Account?</h3>
               <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  This action is permanent and will remove <span className="text-red-600 font-bold">all access</span> for this user immediately.
               </p>
               <div className="flex flex-col gap-2">
                  <button onClick={handleDelete} className="py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold text-sm transition-all">Confirm Deletion</button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-semibold text-sm transition-all">Cancel</button>
               </div>
            </div>
          </div>
        )}

        {/* Edit Context Hub */}
        {showEditConfirm && userToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowEditConfirm(false)}></div>
            <div className="relative bg-white w-full max-w-sm rounded-lg border border-gray-200 shadow-xl p-6 text-center animate-in zoom-in-110 duration-200">
               <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 border border-blue-100">
                  <Settings className="w-8 h-8" />
               </div>
               <h3 className="text-lg font-bold text-gray-900 mb-2">Edit Staff Details?</h3>
               <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  Modify account settings and roles for <span className="font-bold text-gray-900">@{userToEdit.username}</span>.
               </p>
               <div className="flex flex-col gap-2">
                  <button onClick={() => {
                        setSelectedUser(userToEdit);
                        const roleName = userToEdit.role || userToEdit.userRoleMaps?.[0]?.role?.roleName || "";
                        setFormData({ username: userToEdit.username, name: userToEdit.name || "", password: "", role: roleName, mobileNumber: userToEdit.mobileNumber || "", status: userToEdit.isActive ? "ACTIVE" : "INACTIVE" });
                        setShowEditConfirm(false);
                        setShowEditModal(true);
                  }} className="py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-sm transition-all">Edit User Details</button>
                  <button onClick={() => { setShowEditConfirm(false); setUserToEdit(null); }} className="py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-semibold text-sm transition-all">Cancel</button>
               </div>
            </div>
          </div>
        )}

        {/* Update Confirmation */}
        {showUpdateConfirm && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowUpdateConfirm(false)}></div>
            <div className="relative bg-white w-full max-w-sm rounded-lg border border-emerald-100 shadow-xl p-6 text-center animate-in zoom-in-95 duration-200">
               <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 border border-emerald-100">
                  <UserCheck className="w-8 h-8" />
               </div>
               <h3 className="text-lg font-bold text-gray-900 mb-2">Save Changes?</h3>
               <p className="text-gray-500 text-sm mb-6">Confirm and apply the updated profile settings for <span className="font-bold text-gray-900">@{selectedUser.username}</span>.</p>
               <div className="flex flex-col gap-2">
                  <button onClick={executeUpdate} className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold text-sm transition-all">Save Changes</button>
                  <button onClick={() => setShowUpdateConfirm(false)} className="py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-semibold text-sm transition-all">Cancel</button>
               </div>
            </div>
          </div>
        )}

        {/* Update Form Modal */}
        {showEditModal && selectedUser && (
           <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
              <div className="relative bg-white w-full max-w-lg rounded-lg border border-gray-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-6 space-y-6">
                     <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                        <div className="space-y-1">
                           <h3 className="text-lg font-bold text-gray-900">Edit User Details</h3>
                           <p className="text-xs text-blue-600 font-medium">@{selectedUser.username}</p>
                        </div>
                        <button onClick={() => setShowEditModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded transition-all"><X className="w-5 h-5" /></button>
                     </div>

                     <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">Full Name</label>
                              <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">Mobile Number</label>
                              <input value={formData.mobileNumber} onChange={e => setFormData({...formData, mobileNumber: e.target.value.replace(/\D/g, "")})} className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">New Password</label>
                           <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" placeholder="Leave blank to keep current" />
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">Account Role</label>
                           <div className="relative">
                              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 outline-none appearance-none cursor-pointer">
                                 {["SUPERADMIN", "ADMIN", "SUPERVISOR", "SURVEYOR", "VIEWER"].map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                           </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-100">
                           <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 rounded-md font-semibold text-sm hover:bg-gray-50 transition-all">Discard</button>
                           <button type="button" onClick={() => setShowUpdateConfirm(true)} className="flex-1 py-2 bg-blue-600 text-white rounded-md font-semibold text-sm hover:bg-blue-700 shadow-sm transition-all">Save Changes</button>
                        </div>
                     </form>
                  </div>
              </div>
           </div>
        )}
      </MainLayout>
    </ProtectedRoute>
  );
};

export default UserManagementPage;
