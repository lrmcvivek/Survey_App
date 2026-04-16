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
      SUPERADMIN: "Super Administrator",
      ADMIN: "Administrator",
      SUPERVISOR: "Supervisor",
      SURVEYOR: "Surveyor",
    };
    return roleMap[role] || role;
  };

  if (isLoading) return <Loading fullScreen />;

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="min-h-screen bg-gray-50 text-gray-900">
          <div className="max-w-[1200px] mx-auto space-y-8 pb-20 px-4 md:px-0">
            {/* Header / Identity Hub */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md border ${profile?.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                    {profile?.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  User <span className="text-blue-600">Profile</span>
                </h1>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-red-700 flex items-center gap-4">
                <XCircle className="w-6 h-6 shrink-0" />
                <p className="text-sm font-semibold">Error: {error}</p>
              </div>
            )}

            {profile && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Identity Card */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-10 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    
                    <div className="relative z-10 space-y-8 flex flex-col items-center">
                      <div className="w-32 h-32 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm p-1">
                         <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-4xl font-bold text-blue-600">
                            {profile.name?.charAt(0) || profile.username.charAt(0)}
                         </div>
                      </div>
                      
                      <div className="text-center space-y-1">
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{profile.name || "Unknown User"}</h2>
                        <p className="text-sm font-semibold text-gray-500">@{profile.username}</p>
                      </div>

                      <div className="w-full space-y-3 pt-4">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-4">
                           <Shield className="w-5 h-5 text-gray-400" />
                           <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Role</span>
                              <span className="text-sm font-semibold text-gray-900">{getRoleDisplayName(profile.role || "")}</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Data Bento */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white border border-gray-200 rounded-xl p-8 flex items-start gap-6 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                        <Mail className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Username</p>
                        <p className="text-lg font-semibold text-gray-900 tracking-tight">{profile.username}</p>
                      </div>
                   </div>

                   <div className="bg-white border border-gray-200 rounded-xl p-8 flex items-start gap-6 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                        <Phone className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mobile Number</p>
                        <p className="text-lg font-semibold text-gray-900 tracking-tight">{profile.mobileNumber || "N/A"}</p>
                      </div>
                   </div>

                   <div className="bg-white border border-gray-200 rounded-xl p-8 flex items-start gap-6 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                        <Calendar className="w-6 h-6 text-amber-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Member Since</p>
                        <p className="text-lg font-semibold text-gray-900 tracking-tight">
                          {new Date(profile.createdAt || "").toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                   </div>

                   <div className="bg-white border border-gray-200 rounded-xl p-8 flex items-start gap-6 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                        <Layers className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Department</p>
                        <p className="text-lg font-semibold text-gray-900 tracking-tight">Main Office</p>
                      </div>
                   </div>

                   <div className="md:col-span-2 bg-blue-50 border border-blue-100 rounded-xl p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="space-y-2 text-center md:text-left">
                        <h3 className="text-xl font-bold text-blue-900 tracking-tight">Account Settings</h3>
                        <p className="text-blue-700 font-medium text-sm">Manage your account credentials and system preferences</p>
                      </div>
                      <button className="whitespace-nowrap px-6 py-3 bg-white text-blue-600 font-bold border border-blue-200 rounded-lg shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-all active:scale-95">
                         Update Settings
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
