"use client";

import React, { useState } from "react";
import { useAuth, AuthUser } from "@/features/auth/AuthContext";
import { Menu, X, Bell, User as UserIcon, LogOut, ChevronDown, Monitor } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
  user: AuthUser | null;
}

const Header: React.FC<HeaderProps> = ({ user, onMenuClick }) => {
  const { logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      SUPERADMIN: "Executive Protocol",
      ADMIN: "Regional Admin",
      SUPERVISOR: "Field Supervisor",
      SURVEYOR: "Spatial Analyst",
    };
    return roleMap[role] || role;
  };

  return (
    <header className="sticky top-0 bg-[#0F172A]/80 backdrop-blur-md z-[40] border-b border-slate-800/50 h-16 shrink-0">
      <div className="h-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-full">
          {/* Left side - Menu Toggle & Title */}
          <div className="flex items-center gap-4">
            <button
              id="mobile-menu-toggle"
              onClick={onMenuClick}
              className="p-2 -ml-2 text-slate-400 hover:text-white lg:hidden transition-all active:scale-90"
              aria-label="Toggle Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
               <Monitor className="w-4 h-4 text-blue-500 hidden md:block" />
               <h1 className="text-sm md:text-xl font-black text-slate-100 uppercase tracking-tighter italic truncate max-w-[180px] sm:max-w-none">
                 Property Tax <span className="text-blue-500">Survey</span> Registry
               </h1>
            </div>
          </div>

          {/* Right side - User menu & Tools */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:flex items-center gap-4 mr-2 border-r border-slate-800 pr-4">
               <button className="p-2 text-slate-500 hover:text-slate-300 transition-colors relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
               </button>
            </div>

            {/* Profile Context */}
            <div className="relative">
              <button
                id="user-menu-button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-1 rounded-2xl bg-slate-800/20 border border-slate-800/50 hover:border-slate-700 transition-all active:scale-95 group"
              >
                <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10 shrink-0">
                  <span className="text-white text-xs font-black uppercase italic">
                    {user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
                  </span>
                </div>
                <div className="hidden md:flex flex-col items-start pr-2">
                  <p className="text-[11px] font-black text-white leading-none mb-0.5 uppercase tracking-tight">
                    {user?.name || user?.username}
                  </p>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em] italic">
                    {getRoleDisplayName(user?.role || "")}
                  </p>
                </div>
                <ChevronDown className={`hidden md:block w-3 h-3 text-slate-600 transition-transform duration-300 mr-1 ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Enhanced Context Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-[#161B26] border border-slate-800 rounded-2xl shadow-2xl py-3 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-5 py-3 border-b border-slate-800/50 mb-2">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Identity</p>
                    <p className="text-sm font-black text-white truncate italic">
                      {user?.name || user?.username}
                    </p>
                  </div>

                  <a
                    href="/profile"
                    className="flex items-center px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-blue-600/10 transition-all group"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <UserIcon className="mr-3 h-3.5 w-3.5 group-hover:text-blue-400" />
                    Personnel Profile
                  </a>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-5 py-3 text-[11px] font-black uppercase tracking-widest text-red-400 hover:bg-red-400/10 transition-all group"
                  >
                    <LogOut className="mr-3 h-3.5 w-3.5" />
                    Terminate Session
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}
    </header>
  );
};

export default Header;
