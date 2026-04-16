"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import { useAuth } from "@/features/auth/AuthContext";
import Loading from "@/components/ui/loading";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

const Dashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState<string>("");

  const {
    data: stats,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: reportsApi.getDashboardStats,
  });

  const {
    data: recentActivity,
    isLoading: activityLoading,
    error: activityError,
  } = useQuery({
    queryKey: ["recentActivity", activityFilter],
    queryFn: () => reportsApi.getRecentActivity(activityFilter),
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading || statsLoading) {
    return (
      <ProtectedRoute>
        <Loading fullScreen />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6 max-w-[1600px] mx-auto">
          {/* Top Section: Welcome & Summary */}
          <div className="py-2">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              Welcome, <span className="text-blue-600">{user?.name || user?.username}</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Property Tax Management System Dashboard</p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-black">
             <StatCard 
               label="Total Users" 
               value={stats?.totalUsers ?? 0} 
               subTitle="Active personnel"
               icon={<UsersIcon className="w-4 h-4" />} 
               color="blue"
               delay=""
             />
             <StatCard 
               label="Active Wards" 
               value={stats?.activeWards ?? 0} 
               subTitle="Surveyed areas"
               icon={<WardsIcon className="w-4 h-4" />} 
               color="emerald"
               delay=""
             />
             <StatCard 
               label="Pending QC" 
               value="124" 
               subTitle="Verification required"
               icon={<CheckIcon className="w-4 h-4" />} 
               color="amber"
               delay=""
             />
             <StatCard 
               label="Completed" 
               value={stats?.qcCompleted ?? 0} 
               subTitle="Finalized surveys"
               icon={<ReportsIcon className="w-4 h-4" />} 
               color="purple"
               delay=""
             />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Content Area: Actions & Charts Grid */}
            <div className="lg:col-span-8 space-y-6">
               <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                    Quick Actions
                  </h2>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {hasRole(["SUPERADMIN", "ADMIN"]) && (
                   <ActionCard
                     title="User Management"
                     subtitle="Manage staff accounts and roles"
                     href="/userManagement/users"
                     icon={<UsersIcon color="#2563eb" />}
                   />
                 )}
                 {hasRole(["SUPERADMIN", "ADMIN", "SUPERVISOR"]) && (
                   <ActionCard
                     title="Ward Management"
                     subtitle="View and manage ward distributions"
                     href="/masters/ward"
                     icon={<WardsIcon color="#059669" />}
                   />
                 )}
                 {hasRole(["SUPERADMIN", "ADMIN", "SUPERVISOR"]) && (
                   <ActionCard
                     title="Quality Control"
                     subtitle="Review and verify survey submissions"
                     href="/qc"
                     icon={<CheckIcon color="#7c3aed" />}
                   />
                 )}
                 <ActionCard
                   title="Reports & Analytics"
                   subtitle="Generate data exports and reports"
                   href="/reports"
                   icon={<ReportsIcon color="#d97706" />}
                 />
               </div>

               {/* Survey Coverage Visualization */}
               <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 min-h-[300px] flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-900 px-1 border-l-4 border-blue-600">Weekly Survey Trend</h3>
                    <p className="text-gray-500 text-xs mt-1">Number of surveys submitted per day</p>
                  </div>
                  <div className="flex-1 flex items-end gap-2 pt-4 pb-2">
                     {[40, 65, 45, 90, 55, 75, 60].map((h, i) => (
                       <div key={i} className="flex-1 group relative">
                          <div 
                            style={{ height: `${h}%` }} 
                            className={`w-full rounded-sm transition-all duration-300 ${i === 3 ? 'bg-blue-600' : 'bg-gray-100 group-hover:bg-gray-200'}`}
                          ></div>
                          <div className="text-[10px] mt-2 text-center text-gray-500 font-medium">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Right Sidebar: Activity Feed */}
            <div className="lg:col-span-4 h-full">
               <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-sm font-bold text-gray-900">Recent Activity</h2>
                    <div className="bg-white border border-gray-200 p-0.5 rounded flex">
                       <button className="px-2 py-0.5 text-[9px] font-bold text-blue-600 bg-gray-50 rounded-sm">RECENT</button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 max-h-[500px] custom-scrollbar space-y-4">
                    {activityLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="flex animate-pulse gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
                            <div className="flex-1 space-y-2 py-1"><div className="h-2.5 bg-gray-100 rounded w-3/4"></div><div className="h-2 bg-gray-100 rounded w-1/2"></div></div>
                          </div>
                        ))}
                      </div>
                    ) : activityError ? (
                      <div className="text-center py-6 text-gray-400 text-xs">Activity log currently unavailable</div>
                    ) : (
                      recentActivity?.logs?.map((log: any, idx: number) => (
                        <div key={log.actionId} className="flex gap-3">
                          <div className="relative">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${log.action.includes('UPDATE') ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                              {log.action.includes('UPDATE') ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>}
                            </div>
                            {idx !== (recentActivity?.logs?.length - 1) && <div className="absolute top-10 bottom-[-16px] left-1/2 w-px bg-gray-100 -translate-x-1/2"></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-700 leading-tight">
                              <span className="font-bold text-gray-900">{log.user?.name || log.user?.username}</span>
                              <span className="text-gray-500 mx-1">•</span>
                              <span>{log.action.toLowerCase().replace(/_/g, ' ')}</span>
                            </p>
                            <span className="text-[9px] font-medium text-gray-400 uppercase tracking-widest">{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="p-3 bg-gray-50 border-t border-gray-100">
                    <button className="w-full py-2 text-[10px] font-bold text-gray-500 hover:text-blue-600 uppercase tracking-widest bg-white border border-gray-200 rounded transition-all">View All Activity</button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

/* --- Functional UI Sub-components --- */

const StatCard: React.FC<{
  label: string;
  value: string | number;
  subTitle: string;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'amber' | 'purple';
  delay: string;
}> = ({ label, value, subTitle, icon, color }) => {
  return (
    <div className={`bg-white rounded-lg p-5 shadow-sm border border-gray-200 flex items-center gap-4 group transition-all duration-200`}>
      <div className={`w-10 h-10 rounded-md flex items-center justify-center border border-gray-100 bg-gray-50 text-blue-600`}>
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold text-gray-900 tracking-tight">{value}</div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</div>
        <div className="text-[10px] text-gray-500 font-medium">{subTitle}</div>
      </div>
    </div>
  );
};

const ActionCard: React.FC<{
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode | ((props: { color: string }) => React.ReactNode);
}> = ({ title, subtitle, href, icon }) => (
  <Link href={href}>
    <div className="group bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:border-blue-600/30 hover:bg-blue-50/10 transition-all duration-200 flex items-start justify-between min-h-[100px]">
       <div className="space-y-1">
          <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{title}</h3>
          <p className="text-xs text-gray-500 font-medium">{subtitle}</p>
       </div>
       <div className="p-2.5 bg-gray-50 rounded group-hover:bg-blue-50 transition-colors">
          {typeof icon === 'function' ? (icon as Function)({ color: '#2563eb' }) : icon}
       </div>
    </div>
  </Link>
);

/* Minimal Icons */
const UsersIcon = ({ className = "w-6 h-6", color = "currentColor" }: any) => (
  <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/></svg>
);
const WardsIcon = ({ className = "w-6 h-6", color = "currentColor" }: any) => (
  <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
);
const CheckIcon = ({ className = "w-6 h-6", color = "currentColor" }: any) => (
  <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
);
const ReportsIcon = ({ className = "w-6 h-6", color = "currentColor" }: any) => (
  <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
);

export default Dashboard;
