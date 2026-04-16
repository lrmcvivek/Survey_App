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
          <div className="mb-2 py-4">
            <h1 className="text-3xl md:text-4xl font-black text-slate-400 leading-tight">
              Good Day, <span className="text-blue-600">{user?.name || user?.username}</span>!
            </h1>
            <p className="text-slate-400 font-medium mt-1">Here's what's happening with the survey today.</p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-black">
             <StatCard 
               label="Total Users" 
               value={stats?.totalUsers ?? 0} 
               subTitle="Active Staff"
               icon={<UsersIcon className="w-5 h-5" />} 
               color="blue"
               delay="delay-100"
             />
             <StatCard 
               label="Active Wards" 
               value={stats?.activeWards ?? 0} 
               subTitle="Operational Areas"
               icon={<WardsIcon className="w-5 h-5" />} 
               color="emerald"
               delay="delay-200"
             />
             <StatCard 
               label="Pending QC" 
               value="124" 
               subTitle="Action Required"
               icon={<CheckIcon className="w-5 h-5" />} 
               color="amber"
               delay="delay-300"
             />
             <StatCard 
               label="Completed" 
               value={stats?.qcCompleted ?? 0} 
               subTitle="Finalized Surveys"
               icon={<ReportsIcon className="w-5 h-5" />} 
               color="purple"
               delay="delay-400"
             />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Main Content Area: Actions & Charts Grid */}
            <div className="lg:col-span-8 space-y-6">
               <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-black text-slate-400 px-4 py-2 flex items-center gap-3">
                    <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                    Management Console
                  </h2>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 {hasRole(["SUPERADMIN", "ADMIN"]) && (
                   <ActionCard
                     title="User Directory"
                     subtitle="Staff oversight & roles"
                     href="/userManagement/users"
                     icon={<UsersIcon color="#3b82f6" />}
                   />
                 )}
                 {hasRole(["SUPERADMIN", "ADMIN", "SUPERVISOR"]) && (
                   <ActionCard
                     title="Ward Intelligence"
                     subtitle="Real-time coverage analytics"
                     href="/masters/ward"
                     icon={<WardsIcon color="#22c55e" />}
                   />
                 )}
                 {hasRole(["SUPERADMIN", "ADMIN", "SUPERVISOR"]) && (
                   <ActionCard
                     title="QC Queue"
                     subtitle="Verification workflows"
                     href="/qc"
                     icon={<CheckIcon color="#a855f7" />}
                   />
                 )}
                 <ActionCard
                   title="Data Studio"
                   subtitle="Insightful exports & reporting"
                   href="/reports"
                   icon={<ReportsIcon color="#f59e0b" />}
                 />
               </div>

               {/* Survey Coverage Visualization Placeholder */}
               <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 min-h-[300px] flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Weekly Coverage Trend</h3>
                    <p className="text-slate-400 text-sm">Number of surveys submitted per day</p>
                  </div>
                  <div className="flex-1 flex items-end gap-3 pt-10 pb-4 h-40">
                     {[40, 65, 45, 90, 55, 75, 60].map((h, i) => (
                       <div key={i} className="flex-1 group relative">
                          <div 
                            style={{ height: `${h}%` }} 
                            className={`w-full rounded-t-xl transition-all duration-500 group-hover:bg-blue-600 ${i === 3 ? 'bg-blue-500' : 'bg-slate-100 hover:bg-slate-200'}`}
                          ></div>
                          <div className="text-[10px] mt-2 text-center text-slate-400 font-bold">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Right Sidebar: Activity & Feed */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-50/50 rounded-[2rem] p-1 border border-slate-100/50 h-full">
                <div className="bg-white rounded-[1.8rem] shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col h-full ring-1 ring-slate-100">
                  <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <h2 className="text-lg font-black text-slate-800">Live Feed</h2>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                       <button className="px-3 py-1 text-[10px] font-bold text-blue-600 bg-white shadow-sm rounded-lg transition-all">RECENT</button>
                       <button className="px-3 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-all">ALERTS</button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 max-h-[600px] custom-scrollbar space-y-8">
                    {activityLoading ? (
                      <div className="space-y-6">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="flex animate-pulse gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-full px-2"></div>
                            <div className="flex-1 space-y-2 py-1"><div className="h-3 bg-slate-100 rounded w-3/4"></div><div className="h-2 bg-slate-100 rounded w-1/2"></div></div>
                          </div>
                        ))}
                      </div>
                    ) : activityError ? (
                      <div className="text-center py-10 opacity-50 italic text-slate-400">Activity sync paused...</div>
                    ) : (
                      recentActivity?.logs?.map((log: any, idx: number) => (
                        <div key={log.actionId} className="flex gap-4 group">
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center shadow-md transition-transform group-hover:scale-110 ${log.action.includes('UPDATE') ? 'bg-amber-100/80 text-amber-600' : 'bg-blue-100/80 text-blue-600'}`}>
                              {log.action.includes('UPDATE') ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>}
                            </div>
                            {idx !== (recentActivity?.logs?.length - 1) && <div className="absolute top-12 bottom-[-32px] left-1/2 w-px bg-slate-100 -translate-x-1/2"></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-600 leading-tight">
                              <span className="font-extrabold text-slate-800">{log.user?.name || log.user?.username}</span>
                              <span className="text-slate-400 mx-1">•</span>
                              <span className="font-medium">{log.action.toLowerCase().replace(/_/g, ' ')}</span>
                            </p>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="p-4 bg-slate-50/50">
                    <button className="w-full py-3 text-xs font-black text-slate-500 hover:text-blue-600 uppercase tracking-widest border border-dashed border-slate-200 rounded-xl transition-all">Archive Activity</button>
                  </div>
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
}> = ({ label, value, subTitle, icon, color, delay }) => {
  const themes = {
    blue: "text-blue-600 bg-blue-50 border-blue-200",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-200",
    amber: "text-amber-600 bg-amber-50 border-amber-200",
    purple: "text-purple-600 bg-purple-50 border-purple-200"
  };

  return (
    <div className={`bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center gap-5 group hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 ${delay}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110 ${themes[color]}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-black text-slate-800 tracking-tight">{value}</div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{label}</div>
        <div className="text-xs text-slate-400 opacity-60 font-medium">{subTitle}</div>
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
    <div className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 flex items-start justify-between min-h-[120px]">
       <div className="space-y-1">
          <h3 className="text-lg font-extrabold text-slate-800 transition-colors group-hover:text-blue-600">{title}</h3>
          <p className="text-sm text-slate-400 font-medium">{subtitle}</p>
       </div>
       <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
          {typeof icon === 'function' ? (icon as Function)({ color: '#3b82f6' }) : icon}
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
