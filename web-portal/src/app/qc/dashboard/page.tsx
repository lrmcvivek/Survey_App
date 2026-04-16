"use client";
import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import toast from "react-hot-toast";
import MainLayout from "@/components/layout/MainLayout";
import Loading from "@/components/ui/loading";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  TrendingUp, 
  Users,
  Search,
  ArrowUpRight,
  MoreVertical,
  Layers,
  Activity,
  ShieldCheck,
  Zap
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const Q_STATUS_COLORS: Record<string, string> = {
  APPROVED: "#10b981", // Emerald 500
  REJECTED: "#ef4444", // Red 500
  DUPLICATE: "#f59e42", // Amber 500
  NEEDS_REVISION: "#3b82f6", // Blue 500
  PENDING: "#94a3b8", // Slate 400
};

interface QCStats {
  statusCounts: { qcStatus: string; _count: { qcRecordId: number } }[];
  levelCounts: { qcLevel: number; _count: { qcRecordId: number } }[];
  totalSurveys: number;
  pendingCount: number;
}

interface QCRecord {
  qcRecordId: string;
  surveyUniqueCode: string;
  qcLevel: number;
  qcStatus: string;
  remarks?: string;
  reviewedAt: string;
  reviewer?: {
    userId: string;
    username: string;
    name?: string;
  };
}

const QCDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<QCStats | null>(null);
  const [recentActions, setRecentActions] = useState<QCRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchStats(), fetchRecentActions()]);
    } catch (e) {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/qc/stats", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error: any) {
      toast.error("Failed to fetch QC stats");
    }
  };

  const fetchRecentActions = async () => {
    try {
      const response = await fetch("/api/qc/property-list?take=5", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const records: QCRecord[] = (data || [])
          .map((s: any) =>
            s.qcRecords && s.qcRecords[0]
              ? {
                  ...s.qcRecords[0],
                  reviewer: s.qcRecords[0].reviewer || undefined,
                }
              : null
          )
          .filter(Boolean);
        setRecentActions(records);
      }
    } catch (error: any) {
      toast.error("Failed to fetch recent QC actions");
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requireWebPortalAccess>
        <Loading fullScreen />
      </ProtectedRoute>
    );
  }

  const approvedCount = stats?.statusCounts?.find((s) => s.qcStatus === "APPROVED")?._count.qcRecordId ?? 0;
  const rejectedCount = stats?.statusCounts?.find((s) => s.qcStatus === "REJECTED")?._count.qcRecordId ?? 0;

  return (
    <ProtectedRoute requireWebPortalAccess>
      <MainLayout>
        <div className="min-h-screen bg-[#0B0F19] p-4 md:p-8">
          <div className="max-w-[1600px] mx-auto space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800/50 pb-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-400">
                      <ShieldCheck className="w-6 h-6" />
                   </div>
                   <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase italic">Audit Console</h1>
                </div>
                <p className="text-slate-500 font-medium italic flex items-center gap-2">
                  System integrity validation and compliance tracking
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-6 py-4 bg-[#161B26] text-slate-300 font-black rounded-2xl border border-slate-800 hover:bg-slate-800 transition-all uppercase tracking-widest text-[10px] active:scale-95 shadow-xl shadow-black/20">
                  <Search className="w-4 h-4 text-blue-400" />
                  Lookup
                </button>
                <button className="flex items-center gap-2 px-6 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-900/40 hover:bg-blue-500 transition-all uppercase tracking-widest text-[10px] active:scale-95">
                  <Zap className="w-4 h-4" />
                  Audit Queue
                </button>
              </div>
            </div>

            {/* Stat Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                label="Pipeline Volume" 
                value={stats?.totalSurveys ?? 0}
                icon={<FileText className="w-6 h-6" />}
                color="blue"
                trend="+12% weekly"
              />
              <StatCard 
                label="Awaiting Audit" 
                value={stats?.pendingCount ?? 0}
                icon={<Clock className="w-6 h-6" />}
                color="amber"
                trend="Priority"
              />
              <StatCard 
                label="Verified Passing" 
                value={approvedCount}
                icon={<CheckCircle2 className="w-6 h-6" />}
                color="emerald"
                trend="94% Accuracy"
              />
              <StatCard 
                label="Rejected Entry" 
                value={rejectedCount}
                icon={<XCircle className="w-6 h-6" />}
                color="red"
                trend="Down 3%"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Visual Trends */}
                <div className="bg-[#161B26] p-8 rounded-[2.5rem] border border-slate-800/50 shadow-2xl">
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">Verification Trends</h3>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 italic">Cross-Tier analysis</p>
                      </div>
                    </div>
                    <button className="p-3 bg-slate-800/30 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors">
                      <MoreVertical className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>

                  <div className="h-[320px] w-full">
                    {stats?.levelCounts && stats.levelCounts.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.levelCounts} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.2} />
                            </linearGradient>
                          </defs>
                          <XAxis 
                            dataKey="qcLevel" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#475569', fontWeight: 800, fontSize: 10 }}
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#475569', fontWeight: 800, fontSize: 10 }}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderRadius: '1.25rem', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)' }}
                            cursor={{ fill: '#ffffff05' }}
                          />
                          <Bar 
                            dataKey="_count.qcRecordId" 
                            fill="url(#barGradient)" 
                            radius={[8, 8, 4, 4]} 
                            barSize={48}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full opacity-10">
                        <Layers className="w-16 h-16 mb-4 text-white" />
                        <p className="font-black uppercase tracking-widest text-xs">No Tier Data</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Audit Table */}
                <div className="bg-[#161B26] border border-slate-800/50 rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <div className="p-8 border-b border-slate-800/50 flex items-center justify-between bg-slate-800/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-900 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-800">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">Recent Audits</h3>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 italic">Real-time integrity logging</p>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600/10 text-blue-400 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-blue-600/20 transition-all group">
                      Full Log
                      <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900/30">
                          <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Identity</th>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Status</th>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Tier</th>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Lead Reviewer</th>
                          <th className="px-8 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {recentActions.map((rec) => (
                          <tr key={rec.qcRecordId} className="group hover:bg-blue-500/[0.02] transition-colors">
                            <td className="px-8 py-6">
                              <span className="font-bold text-slate-300 font-mono text-xs tracking-tight">#{rec.surveyUniqueCode}</span>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: Q_STATUS_COLORS[rec.qcStatus], boxShadow: `0 0 10px ${Q_STATUS_COLORS[rec.qcStatus]}80` }}></span>
                                <span className="text-[10px] font-black uppercase tracking-widest italic" style={{ color: Q_STATUS_COLORS[rec.qcStatus] }}>
                                  {rec.qcStatus.replace('_', ' ')}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className="px-3 py-1 bg-slate-800 text-slate-400 text-[10px] font-black rounded-lg border border-slate-700 uppercase tracking-widest italic">L-{rec.qcLevel}</span>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-black text-blue-400">
                                  {(rec.reviewer?.name || rec.reviewer?.username || "A").slice(0, 1).toUpperCase()}
                                </div>
                                <span className="text-xs font-bold text-slate-400">{rec.reviewer?.name || rec.reviewer?.username || "System Agent"}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right text-[10px] font-bold text-slate-600 italic">
                               {new Date(rec.reviewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(rec.reviewedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Compliance Mix */}
                <div className="bg-[#161B26] p-8 rounded-[2.5rem] border border-slate-800/50 shadow-2xl flex flex-col">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white tracking-tight">Compliance Mix</h3>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 italic">Outcome ratio</p>
                    </div>
                  </div>

                  <div className="flex-1 min-h-[280px] relative flex items-center justify-center mb-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats?.statusCounts}
                          dataKey="_count.qcRecordId"
                          nameKey="qcStatus"
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={10}
                        >
                          {stats?.statusCounts?.map((entry) => (
                            <Cell
                              key={`cell-${entry.qcStatus}`}
                              fill={Q_STATUS_COLORS[entry.qcStatus]}
                              stroke="0"
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <span className="text-3xl font-black text-white leading-none">
                          {stats?.totalSurveys ? Math.round((approvedCount / stats.totalSurveys) * 100) : 0}%
                       </span>
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">Compliance</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                     {stats?.statusCounts?.map((s) => (
                        <div key={s.qcStatus} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800/30">
                           <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full" style={{ background: Q_STATUS_COLORS[s.qcStatus] }}></div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.qcStatus.replace('_', ' ')}</span>
                           </div>
                           <span className="text-sm font-black text-white">{s._count.qcRecordId}</span>
                        </div>
                     ))}
                  </div>
                </div>

                {/* Team Insights CTA */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-900 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                   <Users className="absolute -bottom-6 -right-6 w-40 h-40 text-white/5 group-hover:scale-110 transition-transform duration-700" />
                   <div className="relative space-y-4">
                      <h3 className="text-2xl font-black text-white tracking-tight italic">Team Insights</h3>
                      <p className="text-blue-100/60 text-sm font-medium leading-relaxed italic">Visualize auditing throughput and individual surveyor efficiency metrics.</p>
                      <button className="w-full py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/10 text-white font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 flex items-center justify-center gap-2">
                         Leaderboard
                         <ArrowUpRight className="w-4 h-4" />
                      </button>
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

/* Reusable Stat Card */
const StatCard: React.FC<{
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'amber' | 'red';
  trend?: string;
}> = ({ label, value, icon, color, trend }) => {
  const themes = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  return (
    <div className="bg-[#161B26] p-7 rounded-[2.5rem] border border-slate-800/50 shadow-xl group hover:border-slate-700 transition-all duration-500">
      <div className="flex items-start justify-between mb-8">
        <div className={`p-4 rounded-2xl border transition-all duration-500 group-hover:scale-110 ${themes[color]}`}>
          {icon}
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic mb-1 block">{label}</span>
          <span className="text-3xl font-black text-white tracking-tighter">{value}</span>
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-2 pt-4 border-t border-slate-800/50">
          <TrendingUp className={`w-4 h-4 ${color === 'red' ? 'rotate-180 text-red-500' : 'text-emerald-500'}`} />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{trend}</span>
        </div>
      )}
    </div>
  );
};

export default QCDashboardPage;
