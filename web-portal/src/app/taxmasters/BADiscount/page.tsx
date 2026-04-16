"use client";
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Loading from "@/components/ui/loading";
import { 
  History, 
  TrendingDown, 
  ShieldCheck, 
  Plus,
  ArrowDownRight,
  Database,
  Search,
  ChevronRight,
  Clock,
  Home,
  Zap,
  LayoutGrid
} from "lucide-react";

export default function BADiscountMasterPage() {
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
               <History className="w-6 h-6 text-blue-600" />
               <h1 className="text-xl font-bold text-gray-900 tracking-tight">Property Ageing Discount</h1>
            </div>
            <p className="text-gray-500 text-sm">Manage valuation depreciation rules based on the age of structural improvements.</p>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 transition-all text-sm">
            <Plus className="w-4 h-4" />
            Add New Discount Rule
          </button>
        </div>

        {/* Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {[
             { icon: Clock, label: "Max Age bracket", value: "40+ Years", color: "blue" },
             { icon: TrendingDown, label: "Depreciation rate", value: "35%", color: "blue" },
             { icon: ShieldCheck, label: "Status", value: "Active", color: "emerald" }
           ].map((item, i) => (
             <div key={i} className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm space-y-3">
                <div className={`w-8 h-8 bg-gray-50 rounded flex items-center justify-center text-blue-600`}>
                   <item.icon className="w-4 h-4" />
                </div>
                <div>
                   <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{item.label}</h4>
                   <p className="text-lg font-bold text-gray-900 leading-none">{item.value}</p>
                </div>
             </div>
           ))}
        </div>

        {/* List Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col min-h-[400px]">
           <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                 <h3 className="text-sm font-bold text-gray-800">Depreciation Schedule</h3>
              </div>
              <div className="relative group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                 <input 
                   placeholder="Search age brackets..." 
                   className="bg-white border border-gray-300 rounded pl-9 pr-3 py-1.5 text-xs text-gray-700 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all w-48"
                 />
              </div>
           </div>

           <div className="flex-1 flex flex-col items-center justify-center p-16 space-y-6 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                 <Home className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                 <h3 className="text-lg font-bold text-gray-900">No rules configured</h3>
                 <p className="text-gray-500 max-w-sm mx-auto text-sm">
                   Structural depreciation rules have not been configured. Define age brackets to enable automated discounts.
                 </p>
              </div>
              <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-md font-semibold text-sm hover:bg-blue-700 shadow-sm transition-all">
                 <Plus className="w-4 h-4" />
                 Add Rule
              </button>
           </div>
        </div>
      </div>
    </MainLayout>
  );
}
