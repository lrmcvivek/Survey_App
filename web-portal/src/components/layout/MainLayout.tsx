"use client";

import React, { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useAuth } from "@/features/auth/AuthContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#eef0f3] font-sans text-slate-900">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          sidebarOpen ? "lg:pl-64" : "lg:pl-20 pl-0"
        }`}
      >
        <Header onMenuClick={toggleSidebar} user={user} />

        <main className="flex-grow">
          <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>

        <footer className="py-8 px-8 text-center bg-white border-t border-gray-200 text-slate-500 text-xs font-medium tracking-normal">
          &copy; {new Date().getFullYear()} Property Tax Survey Management System. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
