"use client";
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Loading from "@/components/ui/loading";
import { 
  BarChart4, 
  MapPin, 
  ShieldCheck, 
  Plus,
  ArrowUpRight,
  Database,
  Search,
  ChevronRight,
  Navigation,
  Sparkles,
  Zap,
  Activity
} from "lucide-react";

export default function WardRateMasterPage() {
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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
               <Navigation className="w-6 h-6 text-blue-600" />
               <h1 className="text-xl font-bold text-gray-900 tracking-tight">Ward-wise Property Tax Rates</h1>
            </div>
            <p className="text-gray-500 text-sm">Manage and configure property tax rates for different wards based on location and property type.</p>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-wider text-xs">
            <Plus className="w-4 h-4" />
            Add New Rate
          </button>
        </div>

        {/* Rate Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { icon: MapPin, label: "Total Wards", value: "256 Wards", color: "blue" },
             { icon: BarChart4, label: "Average Rate", value: "Standard Rate", color: "blue" },
             { icon: Activity, label: "Status", value: "Active", color: "emerald" }
           ].map((item, i) => (
             <div key={i} className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                   <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                      item.color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                   }`}>
                      <item.icon className="w-5 h-5" />
                   </div>
                </div>
                <div>
                   <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider leading-none mb-2">{item.label}</h4>
                   <p className="text-2xl font-bold text-gray-900 leading-none">{item.value}</p>
                </div>
             </div>
           ))}
        </div>

        {/* Rate List Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-h-[400px] flex flex-col">
           <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                 <Database className="w-5 h-5 text-gray-400" />
                 <h3 className="text-sm font-bold text-gray-900">Ward Rates</h3>
              </div>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <input 
                   placeholder="Search..." 
                   className="bg-white border border-gray-300 rounded-md pl-9 pr-4 py-1.5 text-xs text-gray-700 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all w-64"
                 />
              </div>
           </div>

           <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-6 text-center">
              <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center text-gray-200">
                 <Zap className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                 <h3 className="text-xl font-bold text-gray-900">No rates found</h3>
                 <p className="text-gray-500 max-w-sm mx-auto text-sm">
                    Property tax rates for wards have not been set. Configure new rates to enable tax assessment.
                 </p>
              </div>
              <button className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-md font-semibold text-sm hover:bg-blue-700 shadow-sm transition-all">
                 <Plus className="w-4 h-4" />
                 Add Rate
                 <ChevronRight className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>
    </MainLayout>
  );
}
