"use client";
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Loading from "@/components/ui/loading";
import { Users as UsersIcon, ShieldCheck as ShieldIcon, Construction } from "lucide-react";

export default function VendorWardAllotmentPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <MainLayout>
      <div className="min-h-[70vh] bg-gray-50 flex flex-col items-center justify-center p-6 rounded-xl border border-gray-200 mt-6 mx-6">
        <UsersIcon className="w-16 h-16 text-gray-300 mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Vendor Ward Allotment</h1>
        <p className="text-gray-500 font-medium">This module is under construction</p>
      </div>
    </MainLayout>
  );
}
