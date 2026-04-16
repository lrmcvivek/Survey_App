"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import { userApi, User } from "@/lib/api";
import toast from "react-hot-toast";
import Loading from "@/components/ui/loading";

import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Shield, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Settings,
  Camera,
  Layers,
  Fingerprint
} from "lucide-react";

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const profileData = await userApi.getProfile();
        setProfile(profileData);
        setError(null);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error || err.message || "Failed to fetch profile";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      SUPERADMIN: "Executive Protocol",
      ADMIN: "Regional Administrator",
      SUPERVISOR: "Field Coordinator",
      SURVEYOR: "Spatial Analyst",
    };
    return roleMap[role] || role;
  };

  if (isLoading) return <Loading fullScreen />;

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="min-h-screen bg-[#0B0F19] text-slate-300">
          <div className="max-w-[1200px] mx-auto space-y-8 pb-20 px-4 md:px-0">
            {/* Header / Identity Hub */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border italic ${profile?.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                    {profile?.isActive ? "Active" : "Suspended"}
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter italic uppercase">
                  Personnel <span className="text-blue-600">Registry</span>
                </h1>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[2rem] text-red-400 flex items-center gap-4 animate-shake">
                <XCircle className="w-6 h-6 shrink-0" />
                <p className="text-sm font-bold uppercase tracking-wide">Sync Conflict: {error}</p>
              </div>
            )}

            {profile && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Identity Card */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-[#161B26] border border-slate-800 rounded-[2.5rem] p-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-600/10 transition-all duration-700"></div>
                    
                    <div className="relative z-10 space-y-8 flex flex-col items-center">
                      <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-900/40 p-1">
                         <div className="w-full h-full rounded-[2.2rem] bg-[#161B26] flex items-center justify-center text-4xl font-black text-white italic">
                            {profile.name?.charAt(0) || profile.username.charAt(0)}
                         </div>
                      </div>
                      
                      <div className="text-center space-y-1">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">{profile.name || "UNIDENTIFIED PERSONNEL"}</h2>
                        <p className="text-sm font-black text-blue-500 uppercase tracking-widest">@{profile.username}</p>
                      </div>

                      <div className="w-full space-y-3 pt-4">
                        <div className="p-4 bg-slate-800/20 rounded-2xl border border-slate-700/30 flex items-center gap-4">
                           <Shield className="w-5 h-5 text-slate-500" />
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">Access Protocol</span>
                              <span className="text-sm font-bold text-slate-200">{getRoleDisplayName(profile.role || "")}</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Data Bento */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-[#161B26] border border-slate-800 rounded-[2.5rem] p-8 flex items-start gap-6 hover:border-slate-700 transition-colors">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700/50">
                        <Mail className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest italic">Communication as</p>
                        <p className="text-lg font-bold text-white tracking-tight">{profile.username}</p>
                      </div>
                   </div>

                   <div className="bg-[#161B26] border border-slate-800 rounded-[2.5rem] p-8 flex items-start gap-6 hover:border-slate-700 transition-colors">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700/50">
                        <Phone className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest italic">Mobile Number</p>
                        <p className="text-lg font-bold text-white tracking-tight">{profile.mobileNumber || "SECURE_OFFLINE"}</p>
                      </div>
                   </div>

                   <div className="bg-[#161B26] border border-slate-800 rounded-[2.5rem] p-8 flex items-start gap-6 hover:border-slate-700 transition-colors">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700/50">
                        <Calendar className="w-6 h-6 text-amber-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest italic">Member Since</p>
                        <p className="text-lg font-bold text-white tracking-tight">
                          {new Date(profile.createdAt || "").toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                   </div>

                   <div className="bg-[#161B26] border border-slate-800 rounded-[2.5rem] p-8 flex items-start gap-6 hover:border-slate-700 transition-colors group">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700/50">
                        <Layers className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest italic">Services From</p>
                        <p className="text-lg font-bold text-white tracking-tight">Main Headquarters</p>
                      </div>
                   </div>

                   <div className="md:col-span-2 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="space-y-2 text-center md:text-left">
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Security Protocol Management</h3>
                        <p className="text-slate-500 font-medium text-sm italic">Adjust authentication cycles and system permissions</p>
                      </div>
                      <button className="whitespace-nowrap px-10 py-4 bg-white text-black font-black rounded-2xl shadow-2xl hover:bg-slate-100 transition-all uppercase tracking-widest text-xs active:scale-95">
                         Update Credentials
                      </button>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default ProfilePage;
