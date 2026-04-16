"use client";
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Loading from "@/components/ui/loading";
import { 
  FlaskConical, 
  Layers, 
  ShieldAlert, 
  Activity,
  Plus,
  Target,
  Database,
  Search,
  ChevronRight,
  Sparkles,
  Zap,
  BarChart3
} from "lucide-react";

export default function TaxLabMasterPage() {
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
                    <FlaskConical className="w-6 h-6" />
                 </div>
                 <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Tax Laboratory</h1>
              </div>
              <p className="text-slate-500 text-sm font-medium italic">Advanced assessment modeling and slab configuration engine</p>
            </div>
            
            <button className="flex items-center gap-2 px-6 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-900/30 hover:bg-emerald-500 transition-all active:scale-95 uppercase tracking-widest text-[10px]">
              <Plus className="w-4 h-4" />
              Calibrate Slab
            </button>
          </div>

          {/* Lab Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             {[
               { icon: Layers, label: "Defined Slabs", value: "12", color: "blue" },
               { icon: Target, label: "Precision Rate", value: "99.8%", color: "emerald" },
               { icon: Activity, label: "Simulation Node", value: "ACTIVE", color: "amber" },
               { icon: BarChart3, label: "Revenue Delta", value: "+14%", color: "indigo" }
             ].map((item, i) => (
               <div key={i} className="bg-[#161B26] border border-slate-800 p-6 rounded-[2rem] space-y-4 group hover:border-blue-500/50 transition-all">
                  <div className={`w-10 h-10 bg-${item.color}-500/10 rounded-xl flex items-center justify-center text-${item.color}-400`}>
                     <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                     <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-2">{item.label}</h4>
                     <p className="text-2xl font-black text-white leading-none">{item.value}</p>
                  </div>
               </div>
             ))}
          </div>

          {/* Matrix Area */}
          <div className="bg-[#161B26] border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden relative group">
             {/* Dynamic background element */}
             <div className="absolute top-0 right-0 p-32 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                <FlaskConical className="w-64 h-64 text-white" />
             </div>

             <div className="p-8 border-b border-slate-800/50 flex items-center justify-between bg-white/[0.01] relative z-10">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-emerald-400">
                      <Database className="w-5 h-5" />
                   </div>
                   <h3 className="text-lg font-black text-white italic uppercase tracking-tight">Slab Matrix Registry</h3>
                </div>
                <div className="flex items-center gap-3">
                   <div className="relative group/search">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 group-focus-within/search:text-emerald-400 transition-colors" />
                      <input 
                        placeholder="Filter Matrix..." 
                        className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-[10px] font-black text-slate-400 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono uppercase tracking-widest w-48"
                      />
                   </div>
                   <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                      <Sparkles className="w-4 h-4" />
                   </div>
                </div>
             </div>

             <div className="p-20 flex flex-col items-center justify-center space-y-8 text-center relative z-10 min-h-[500px]">
                <div className="relative">
                   <div className="absolute inset-0 bg-emerald-500/10 blur-[80px] rounded-full"></div>
                   <Zap className="w-24 h-24 text-emerald-500/20 relative z-10 animate-bounce transition-all duration-[2s]" />
                </div>
                <div className="space-y-3">
                   <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Laboratory Idle</h3>
                   <p className="text-slate-500 max-w-md mx-auto font-medium italic">
                     No active assessment slabs detected in current spatial buffer. Calibrate the slab matrix to enable regional taxation logic.
                   </p>
                </div>
                <div className="flex gap-4">
                   <button className="flex items-center gap-3 px-10 py-5 bg-emerald-600 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-500 shadow-2xl shadow-emerald-900/40 transition-all active:scale-95 group">
                      <Plus className="w-4 h-4" />
                      Calibrate Matrix
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                   </button>
                   <button className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-slate-500 border border-slate-800 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-all">
                      <Activity className="w-4 h-4" />
                      Run Simulation
                   </button>
                </div>
             </div>
          </div>

          <div className="flex items-center justify-center gap-10 opacity-30">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 italic">ML Optimized</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 italic">E2E Secure</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 italic">High Density</span>
             </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
