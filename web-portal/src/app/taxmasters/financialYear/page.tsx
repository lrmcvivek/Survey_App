"use client";
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Loading from "@/components/ui/loading";
import { 
  Briefcase, 
  Wallet, 
  ShieldCheck, 
  Plus,
  ArrowRight,
  Database,
  Search,
  ChevronRight,
  TrendingUp,
  LineChart,
  Zap,
  RotateCcw
} from "lucide-react";

export default function FinancialYearMasterPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Loading fullScreen />;

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#0B0F19] p-4 md:p-8">
        <div className="max-w-[1400px] mx-auto space-y-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800/50 pb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-emerald-600/10 rounded-xl flex items-center justify-center text-emerald-400 font-black italic">
                    <Wallet className="w-6 h-6" />
                 </div>
                 <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Financial <span className="text-emerald-500">Epochs</span></h1>
              </div>
              <p className="text-slate-500 text-sm font-medium italic">Define fiscal boundaries and revenue recognition windows</p>
            </div>
            
            <button className="flex items-center gap-2 px-6 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-900/30 hover:bg-emerald-500 transition-all active:scale-95 uppercase tracking-widest text-[10px]">
              <Plus className="w-4 h-4" />
              Open New Epoch
            </button>
          </div>

          {/* Epoch Bento */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             {[
               { icon: TrendingUp, label: "Revenue Target", value: "₹450Cr+", color: "emerald" },
               { icon: LineChart, label: "Growth Vector", value: "+22%", color: "blue" },
               { icon: ShieldCheck, label: "Audit Status", value: "CLEARED", color: "indigo" },
               { icon: RotateCcw, label: "Sync Latency", value: "1.2ms", color: "amber" }
             ].map((item, i) => (
               <div key={i} className="bg-[#161B26] border border-slate-800 p-6 rounded-[2rem] space-y-4 group hover:border-emerald-500/50 transition-all cursor-default">
                  <div className={`w-10 h-10 bg-${item.color}-500/10 rounded-xl flex items-center justify-center text-${item.color}-400`}>
                     <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                     <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1 shadow-sm">{item.label}</h4>
                     <p className="text-2xl font-black text-white leading-none tracking-tight">{item.value}</p>
                  </div>
               </div>
             ))}
          </div>

          {/* Registry Control */}
          <div className="bg-[#161B26] border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden relative min-h-[500px] flex flex-col">
             <div className="p-10 border-b border-slate-800/50 flex items-center justify-between relative z-10 bg-slate-800/20">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-emerald-400 border border-slate-800 group-hover:rotate-12 transition-transform">
                      <Briefcase className="w-5 h-5" />
                   </div>
                   <h3 className="text-lg font-black text-white italic uppercase tracking-tight">Epochal Catalog</h3>
                </div>
                <div className="relative group">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 group-focus-within:text-emerald-400 transition-colors" />
                   <input 
                     placeholder="Query Epochs..." 
                     className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-[10px] font-black text-slate-400 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono uppercase tracking-widest w-48"
                   />
                </div>
             </div>

             <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-8 text-center relative z-10">
                <div className="relative group/zap">
                   <div className="absolute inset-0 bg-emerald-500/10 blur-[100px] rounded-full group-hover/zap:bg-emerald-500/20 transition-all duration-1000"></div>
                   <div className="w-24 h-24 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto text-emerald-500/30 group-hover/zap:text-emerald-500 transition-colors duration-500 shadow-2xl">
                      <Zap className="w-12 h-12" />
                   </div>
                </div>
                <div className="space-y-3">
                   <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Financial Engine Idle</h3>
                   <p className="text-slate-500 max-w-sm mx-auto font-medium italic leading-relaxed">
                      No fiscal cycles have been recorded in the central repository. Initialize an epoch to activate regional financial synchronization.
                   </p>
                </div>
                <button className="flex items-center gap-3 px-12 py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-emerald-500 shadow-2xl shadow-emerald-900/40 transition-all active:scale-95 group">
                   <Plus className="w-4 h-4" />
                   Provision Fiscal Epoch
                   <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
