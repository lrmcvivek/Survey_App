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
        <div className="min-h-full">
          <div className="max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                      <ShieldCheck className="w-6 h-6" />
                   </div>
                   <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">QC Dashboard</h1>
                </div>
                <p className="text-gray-500 font-medium flex items-center gap-2">
                  Quality control statistics and validation monitoring
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 font-bold rounded-lg border border-gray-200 hover:bg-gray-50 transition-all text-sm active:scale-95 shadow-sm">
                  <Search className="w-4 h-4 text-blue-500" />
                  Search
                </button>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-all text-sm active:scale-95">
                  <Zap className="w-4 h-4" />
                  QC Queue
                </button>
              </div>
            </div>

            {/* Stat Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                label="Total Surveys" 
                value={stats?.totalSurveys ?? 0}
                icon={<FileText className="w-6 h-6" />}
                color="blue"
                trend="Overall"
              />
              <StatCard 
                label="Pending Review" 
                value={stats?.pendingCount ?? 0}
                icon={<Clock className="w-6 h-6" />}
                color="amber"
                trend="Awaiting action"
              />
              <StatCard 
                label="Approved" 
                value={approvedCount}
                icon={<CheckCircle2 className="w-6 h-6" />}
                color="emerald"
                trend="Verified"
              />
              <StatCard 
                label="Rejected" 
                value={rejectedCount}
                icon={<XCircle className="w-6 h-6" />}
                color="red"
                trend="Requires review"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Visual Trends */}
                <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 tracking-tight">QC Levels Breakdown</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Records by level</p>
                      </div>
                    </div>
                    <button className="p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>

                  <div className="h-[300px] w-full">
                    {stats?.levelCounts && stats.levelCounts.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.levelCounts} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                          <XAxis 
                            dataKey="qcLevel" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontWeight: 600, fontSize: 12 }}
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontWeight: 600, fontSize: 12 }}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#f8fafc' }}
                          />
                          <Bar 
                            dataKey="_count.qcRecordId" 
                            fill="#3b82f6" 
                            radius={[6, 6, 0, 0]} 
                            barSize={40}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-300">
                        <Layers className="w-12 h-12 mb-4" />
                        <p className="font-bold uppercase tracking-wider text-sm">No Tier Data</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Audit Table */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center border border-gray-200">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 tracking-tight">Recent QC History</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">LATEST VERIFICATIONS</p>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg text-xs hover:bg-blue-100 transition-all group">
                      View All
                      <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Survey ID</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Level</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reviewer</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recentActions.map((rec) => (
                          <tr key={rec.qcRecordId} className="group hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-bold text-gray-900 text-sm">#{rec.surveyUniqueCode}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ background: Q_STATUS_COLORS[rec.qcStatus] }}></span>
                                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: Q_STATUS_COLORS[rec.qcStatus] }}>
                                  {rec.qcStatus.replace('_', ' ')}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-md border border-gray-200 uppercase">L-{rec.qcLevel}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-gray-700">{rec.reviewer?.name || rec.reviewer?.username || "N/A"}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right text-xs font-semibold text-gray-500">
                               {new Date(rec.reviewedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
                <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 tracking-tight">Status Distribution</h3>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">QC outcome breakdown</p>
                    </div>
                  </div>

                  <div className="flex-1 min-h-[250px] relative flex items-center justify-center mb-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats?.statusCounts}
                          dataKey="_count.qcRecordId"
                          nameKey="qcStatus"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                        >
                          {stats?.statusCounts?.map((entry) => (
                            <Cell
                              key={`cell-${entry.qcStatus}`}
                              fill={Q_STATUS_COLORS[entry.qcStatus]}
                              stroke="0"
                            />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <span className="text-2xl font-bold text-gray-900 leading-none">
                          {stats?.totalSurveys ? Math.round((approvedCount / stats.totalSurveys) * 100) : 0}%
                       </span>
                       <span className="text-xs font-bold text-gray-500 uppercase mt-1">Approval</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                     {stats?.statusCounts?.map((s) => (
                        <div key={s.qcStatus} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                           <div className="flex items-center gap-3">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: Q_STATUS_COLORS[s.qcStatus] }}></div>
                              <span className="text-xs font-bold text-gray-700 uppercase">{s.qcStatus.replace('_', ' ')}</span>
                           </div>
                           <span className="text-sm font-bold text-gray-900">{s._count.qcRecordId}</span>
                        </div>
                     ))}
                  </div>
                </div>

                {/* Team Insights CTA */}
                <div className="bg-blue-600 p-8 rounded-xl shadow-md relative overflow-hidden group">
                   <Users className="absolute -bottom-6 -right-6 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-500" />
                   <div className="relative space-y-4">
                      <h3 className="text-xl font-bold text-white tracking-tight">Reviewer Summary</h3>
                      <p className="text-blue-100 text-sm font-medium leading-relaxed">View auditing activity and surveyor performance records.</p>
                      <button className="w-full py-3 bg-white hover:bg-gray-50 rounded-lg text-blue-700 font-bold uppercase tracking-wider text-xs transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm">
                         View Report
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
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    red: 'text-red-600 bg-red-50 border-red-100',
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm group hover:border-blue-300 transition-all duration-300">
      <div className="flex items-start justify-between mb-6">
        <div className={`p-3 rounded-xl border transition-all duration-300 group-hover:scale-110 ${themes[color]}`}>
          {icon}
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{label}</span>
          <span className="text-2xl font-bold text-gray-900 tracking-tight">{value}</span>
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
          <TrendingUp className={`w-4 h-4 ${color === 'red' ? 'rotate-180 text-red-500' : 'text-emerald-500'}`} />
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{trend}</span>
        </div>
      )}
    </div>
  );
};

export default QCDashboardPage;
