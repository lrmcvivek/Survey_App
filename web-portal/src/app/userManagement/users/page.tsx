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
        <div className="min-h-screen bg-[#0B0F19] md:p-8">
          <div className="max-w-[1600px] mx-auto space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800/50 pb-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-400">
                      <ShieldCheck className="w-6 h-6" />
                   </div>
                   <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">User Directory</h1>
                </div>
                <p className="text-slate-500 text-sm font-medium italic">Manage system access protocols and administrative hierarchies</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  disabled={!currentUser || getUserRoleRank(currentUser) < ROLE_RANK.ADMIN}
                  className="flex items-center gap-2 px-6 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-900/30 hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-[10px]"
                >
                  <UserPlus className="w-4 h-4" />
                  Register User
                </button>
              </div>
            </div>

            {/* Filter Matrix */}
            <div className="bg-[#161B26] border border-slate-800 rounded-[2.5rem] p-4 shadow-2xl flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-400 transition-colors" />
                <input
                  placeholder="Identity Search (Name, Username)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800/50 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                />
              </div>
              
              <div className="relative min-w-[200px] w-full md:w-auto">
                 <select
                   value={selectedRole}
                   onChange={(e) => setSelectedRole(e.target.value)}
                   className="w-full bg-[#161B26] border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-400 outline-none focus:ring-4 focus:ring-blue-500/10 h-full appearance-none cursor-pointer uppercase tracking-widest text-[10px]"
                 >
                   <option value="">All Tiers</option>
                   {["SUPERADMIN", "ADMIN", "SUPERVISOR", "SURVEYOR", "VIEWER"].map(r => <option key={r} value={r} className="bg-slate-900">{r.replace('_', ' ')}</option>)}
                 </select>
                 <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
              </div>
            </div>

            {/* User List Table */}
            <div className="bg-[#161B26] border border-slate-800/50 rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/30">
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Identity Metadata</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Authorization Tier</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Security Status</th>
                      <th className="px-8 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Protocols</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {sortedUsers.map((user) => {
                      const role = user.role || user.userRoleMaps?.[0]?.role?.roleName || "N/A";
                      const isSelf = currentUser?.userId === user.userId;
                      const canManage = currentUser && canManageUser(currentUser, user);

                      return (
                        <tr key={user.userId} className="group hover:bg-blue-500/[0.02] transition-colors">
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border border-slate-700/50 ${
                                role === "SUPERADMIN" ? "bg-indigo-500/10 text-indigo-400" :
                                role === "ADMIN" ? "bg-blue-500/10 text-blue-400" :
                                role === "SUPERVISOR" ? "bg-amber-500/10 text-amber-400" :
                                "bg-slate-500/10 text-slate-400"
                              }`}>
                                {(user.name || user.username).charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-sm font-black text-slate-200">{user.name || user.username} {isSelf && <span className="text-[9px] px-1.5 py-0.5 bg-blue-600/20 text-blue-400 rounded-md ml-2 border border-blue-500/20">ME</span>}</span>
                                 <span className="text-[15px] font-bold text-slate-600 font-mono tracking-tight">@{user.username}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-[0.1em] italic ${
                                role === "SUPERADMIN" ? "bg-indigo-500/5 text-indigo-400 border-indigo-500/20" :
                                role === "ADMIN" ? "bg-blue-500/5 text-blue-400 border-blue-500/20" :
                                role === "SUPERVISOR" ? "bg-amber-500/5 text-amber-400 border-amber-500/20" :
                                "bg-slate-500/5 text-slate-400 border-slate-500/20"
                             }`}>
                               <Shield className="w-3 h-3" />
                               {role.replace('_', ' ')}
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-3">
                                <div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-700"}`}></div>
                                <span className={`text-[11px] font-black uppercase tracking-widest italic ${user.isActive ? "text-emerald-400" : "text-slate-600"}`}>
                                  {user.isActive ? "Operational" : "Suspended"}
                                </span>
                             </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => { setUserToEdit(user); setShowEditConfirm(true); }}
                                  disabled={!canManage}
                                  className={`p-3 rounded-2xl transition-all border ${canManage ? 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10' : 'text-slate-800 border-slate-800/50 cursor-not-allowed'}`}
                                >
                                   <Settings className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => { setUserToDeactivate(user); setShowDeactivateConfirm(true); }}
                                  disabled={isSelf || !canManage}
                                  className={`p-3 rounded-2xl transition-all border ${isSelf || !canManage ? 'text-slate-800 border-slate-800/50 cursor-not-allowed' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10'}`}
                                >
                                   {user.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                </button>
                                <button 
                                  onClick={() => { setUserToDelete(user.userId); setShowDeleteConfirm(true); }}
                                  disabled={isSelf || !canManage}
                                  className={`p-3 rounded-2xl transition-all border ${isSelf || !canManage ? 'text-slate-800 border-slate-800/50 cursor-not-allowed' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-red-400 hover:bg-red-400/10'}`}
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
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowCreateModal(false)}></div>
            <div className="relative bg-[#161B26] w-full max-w-lg rounded-[2.5rem] border border-slate-800 border-t-blue-600 border-t-4 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
               <div className="p-10 space-y-8">
                  <div className="flex items-center justify-between">
                     <div className="space-y-1">
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">Create Identity</h3>
                        <p className="text-slate-500 text-sm font-medium italic">Provisioning new system node</p>
                     </div>
                     <button onClick={() => setShowCreateModal(false)} className="p-3 bg-slate-800/50 text-slate-500 hover:text-white rounded-2xl transition-all">
                        <X className="w-6 h-6" />
                     </button>
                  </div>

                  <form onSubmit={handleCreateUser} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Username</label>
                          <input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-mono" placeholder="un.unique" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Display Name</label>
                          <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner" placeholder="John Doe" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Access Cipher (Password)</label>
                        <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="••••••••" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Authorization</label>
                          <div className="relative">
                            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 h-full appearance-none cursor-pointer uppercase tracking-widest text-[10px]">
                               <option value="ADMIN">Administrator</option>
                               <option value="SUPERVISOR">Supervisor</option>
                               <option value="SURVEYOR">Field Surveyor</option>
                               <option value="VIEWER">Guest Viewer</option>
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Contact String</label>
                          <input type="text" maxLength={10} value={formData.mobileNumber} onChange={e => setFormData({...formData, mobileNumber: e.target.value.replace(/\D/g, "")})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-mono" placeholder="9876543210" />
                        </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-4 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-all active:scale-95">Discard</button>
                        <button type="submit" disabled={creatingUser} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 shadow-xl shadow-blue-900/40 transition-all active:scale-95 disabled:opacity-50">
                           {creatingUser ? <Activity className="w-4 h-4 mx-auto animate-spin" /> : "Authorize Node"}
                        </button>
                      </div>
                  </form>
               </div>
            </div>
          </div>
        )}

        {/* Status Change Modal (Deactivate) */}
        {showDeactivateConfirm && userToDeactivate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowDeactivateConfirm(false)}></div>
            <div className="relative bg-[#161B26] w-full max-w-sm rounded-[2.5rem] border border-slate-800 border-t-amber-600 border-t-4 shadow-2xl p-10 text-center animate-in zoom-in-95 duration-200">
               <div className="w-20 h-20 bg-amber-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-amber-500 border border-amber-500/20">
                  {userToDeactivate.isActive ? <ShieldAlert className="w-10 h-10" /> : <ShieldCheck className="w-10 h-10" />}
               </div>
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tight mb-2">{userToDeactivate.isActive ? "Suspend Access?" : "Restore Access?"}</h3>
               <p className="text-slate-500 text-sm font-medium italic mb-10 leading-relaxed">
                  Modify system privileges for <span className="text-blue-400 font-bold">@{userToDeactivate.username}</span>. This node will be {userToDeactivate.isActive ? "restrained" : "restored"}.
               </p>
               <div className="flex flex-col gap-3">
                  <button onClick={handleDeactivate} className="py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-amber-900/20 transition-all active:scale-95">Execute Protocol</button>
                  <button onClick={() => setShowDeactivateConfirm(false)} className="py-4 bg-slate-800 text-slate-400 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all">Abort</button>
               </div>
            </div>
          </div>
        )}

        {/* Termination Modal */}
        {showDeleteConfirm && userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowDeleteConfirm(false)}></div>
            <div className="relative bg-[#161B26] w-full max-w-sm rounded-[2.5rem] border border-red-900 border-t-red-600 border-t-4 shadow-2xl p-10 text-center animate-in zoom-in-95 duration-200">
               <div className="w-24 h-24 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-600/20">
                  <Trash2 className="w-12 h-12 text-red-500" />
               </div>
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tight mb-4">Hard Delete Node?</h3>
               <p className="text-slate-500 text-sm font-medium italic mb-10 leading-relaxed">
                  Terminal command issued for identity destruction. All session logs and access keys will be <span className="text-red-500 font-black">PERMANENTLY VOIDED</span>.
               </p>
               <div className="flex flex-col gap-3">
                  <button onClick={handleDelete} className="py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-red-900/40 transition-all active:scale-95">Verify Termination</button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="py-4 bg-slate-800 text-slate-400 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all">Safe Abort</button>
               </div>
            </div>
          </div>
        )}

        {/* Edit Resource Confirm Hub */}
        {showEditConfirm && userToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowEditConfirm(false)}></div>
            <div className="relative bg-[#161B26] w-full max-w-sm rounded-[2.5rem] border border-blue-900/50 border-t-blue-600 border-t-4 shadow-2xl p-10 text-center animate-in zoom-in-110 duration-200">
               <div className="w-20 h-20 bg-blue-600/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-blue-400 border border-blue-400/20">
                  <Settings className="w-10 h-10" />
               </div>
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tight mb-2">Configure Resource?</h3>
               <p className="text-slate-500 text-sm font-medium italic mb-10 leading-relaxed">
                  Modifying topographical settings for <span className="text-white font-bold">@{userToEdit.username}</span>.
               </p>
               <div className="flex flex-col gap-3">
                  <button onClick={() => {
                        setSelectedUser(userToEdit);
                        const roleName = userToEdit.role || userToEdit.userRoleMaps?.[0]?.role?.roleName || "";
                        setFormData({ username: userToEdit.username, name: userToEdit.name || "", password: "", role: roleName, mobileNumber: userToEdit.mobileNumber || "", status: userToEdit.isActive ? "ACTIVE" : "INACTIVE" });
                        setShowEditConfirm(false);
                        setShowEditModal(true);
                  }} className="py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-900/40 transition-all active:scale-95">Open Config Hub</button>
                  <button onClick={() => { setShowEditConfirm(false); setUserToEdit(null); }} className="py-4 bg-slate-800 text-slate-400 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all">Decline Edit</button>
               </div>
            </div>
          </div>
        )}

        {/* Update Logic Confirm */}
        {showUpdateConfirm && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowUpdateConfirm(false)}></div>
            <div className="relative bg-[#161B26] w-full max-w-sm rounded-[2.5rem] border border-emerald-900 border-t-emerald-600 border-t-4 shadow-2xl p-10 text-center animate-in zoom-in-95 duration-200">
               <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-emerald-400 border border-emerald-400/20">
                  <UserCheck className="w-10 h-10" />
               </div>
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tight mb-2">Commit Logic?</h3>
               <p className="text-slate-500 text-sm font-medium italic mb-10">Sync current topographical changes to the central registry for <span className="text-white font-bold">@{selectedUser.username}</span>.</p>
               <div className="flex flex-col gap-3">
                  <button onClick={executeUpdate} className="py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-900/20 transition-all active:scale-95">Commit Changes</button>
                  <button onClick={() => setShowUpdateConfirm(false)} className="py-4 bg-slate-800 text-slate-400 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all">Safe Abort</button>
               </div>
            </div>
          </div>
        )}

        {/* Main Edit Modal (Content rendered inside to keep structure clean) */}
        {showEditModal && selectedUser && (
           <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowEditModal(false)}></div>
              <div className="relative bg-[#161B26] w-full max-w-lg rounded-[2.5rem] border border-slate-800 border-t-blue-600 border-t-4 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-10 space-y-8">
                     <div className="flex items-center justify-between">
                        <div className="space-y-1">
                           <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">Config Node</h3>
                           <p className="text-sm font-medium italic text-blue-400">@{selectedUser.username}</p>
                        </div>
                        <button onClick={() => setShowEditModal(false)} className="p-3 bg-slate-800/50 text-slate-500 hover:text-white rounded-2xl transition-all"><X className="w-6 h-6" /></button>
                     </div>

                     <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Assigned Name</label>
                              <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Link String</label>
                              <input value={formData.mobileNumber} onChange={e => setFormData({...formData, mobileNumber: e.target.value.replace(/\D/g, "")})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-mono" />
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Override Cipher (New Password)</label>
                           <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="•••••••• (Zero for No Change)" />
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Authorization Matrix</label>
                           <div className="relative">
                              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none cursor-pointer uppercase tracking-widest text-[10px]">
                                 {["SUPERADMIN", "ADMIN", "SUPERVISOR", "SURVEYOR", "VIEWER"].map(r => <option key={r} value={r} className="bg-slate-900">{r.replace('_', ' ')}</option>)}
                              </select>
                              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                           </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                           <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-4 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-all active:scale-95">Discard</button>
                           <button type="button" onClick={() => setShowUpdateConfirm(true)} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 shadow-xl shadow-blue-900/40 transition-all active:scale-95">Flush Engine</button>
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
