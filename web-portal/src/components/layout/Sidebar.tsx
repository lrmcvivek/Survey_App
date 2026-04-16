"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
  children?: NavItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const pathname = usePathname();
  const { user, hasRole, logout } = useAuth();

  const navigation: NavItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      roles: ["SUPERADMIN", "ADMIN", "SUPERVISOR"],
    },
    {
      name: "General Masters",
      href: "#",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      roles: ["SUPERADMIN", "ADMIN"],
      children: [
        { name: "ULB Master", href: "/masters/ulb", roles: ["SUPERADMIN", "ADMIN"], icon: <div className="w-2 h-2 rounded-full bg-current" /> },
        { name: "Zone Master", href: "/masters/zone", roles: ["SUPERADMIN", "ADMIN"], icon: <div className="w-2 h-2 rounded-full bg-current" /> },
        { name: "Ward Master", href: "/masters/ward", roles: ["SUPERADMIN", "ADMIN"], icon: <div className="w-2 h-2 rounded-full bg-current" /> },
        { name: "Mohalla Master", href: "/masters/mohalla", roles: ["SUPERADMIN", "ADMIN"], icon: <div className="w-2 h-2 rounded-full bg-current" /> },
        { name: "Vendor Ward Allotment", href: "/masters/vendor-ward-allotment", roles: ["SUPERADMIN", "ADMIN"], icon: <div className="w-2 h-2 rounded-full bg-current" /> },
        { name: "Tax Applicability", href: "/masters/tax-applicability", roles: ["SUPERADMIN", "ADMIN"], icon: <div className="w-2 h-2 rounded-full bg-current" /> },
      ],
    },
    {
      name: "LRMC MIS Reports",
      href: "#",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 00-4-4H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      roles: ["SUPERADMIN", "ADMIN", "SUPERVISOR"],
      children: [
        { name: "Property List", href: "/mis-reports/property-list", roles: ["SUPERADMIN", "ADMIN", "SUPERVISOR"], icon: <div className="w-2 h-2 rounded-full bg-current" /> },
        { name: "Search by GISID", href: "/mis-reports/search-by-gisid", roles: ["SUPERADMIN", "ADMIN", "SUPERVISOR"], icon: <div className="w-2 h-2 rounded-full bg-current" /> },
      ],
    },
    {
      name: "User Management",
      href: "#",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      roles: ["SUPERADMIN", "ADMIN"],
      children: [
        { name: "Users", href: "/userManagement/users", roles: ["SUPERADMIN", "ADMIN"], icon: <div className="w-2 h-2 rounded-full bg-current text-[15px]" /> },
        { name: "User Assignment", href: "/userManagement/user-assignment", roles: ["SUPERADMIN", "ADMIN"], icon: <div className="w-2 h-2 rounded-full bg-current" /> },
        { name: "User Assignment Mangement", href: "/userManagement/user-assignment-management", roles: ["SUPERADMIN", "ADMIN"], icon: <div className="w-2 h-2 rounded-full bg-current" /> },
      ],
    },
    {
      name: "QC Management",
      href: "#",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      roles: ["SUPERADMIN", "ADMIN", "SUPERVISOR"],
      children: [
        { name: "QC Dashboard", href: "/qc/dashboard", roles: ["SUPERADMIN", "ADMIN", "SUPERVISOR"], icon: <div className="w-2 h-2 rounded-full bg-current" /> },
        { name: "QC Edit", href: "/qc/edit", roles: ["SUPERADMIN", "ADMIN", "SUPERVISOR"], icon: <div className="w-2 h-2 rounded-full bg-current" /> },
      ],
    },
    {
      name: "Survey Management",
      href: "#",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      roles: ["SUPERADMIN", "ADMIN"],
      children: [
        { name: "Manage Surveys", href: "/surveys", roles: ["SUPERADMIN", "ADMIN"], icon: <div className="w-2 h-2 rounded-full bg-current" /> },
        { name: "Add New ID", href: "/surveys/add-new-id", roles: ["SUPERADMIN", "ADMIN"], icon: <div className="w-2 h-2 rounded-full bg-current" /> },
      ],
    },
  ];

  const filteredNavigation = navigation.filter((item) => hasRole(item.roles));

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isParentActive = (item: NavItem) => {
    return (item.children?.some((child) => pathname.startsWith(child.href))) || false;
  };

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out ${
          isOpen ? "w-64 translate-x-0" : "w-20 translate-x-0 lg:translate-x-0 lg:w-20 shadow-sm"
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header Area */}
          <div className={`flex items-center ${isOpen ? "justify-between px-6" : "justify-center px-2"} h-16 border-b border-gray-100 shrink-0`}>
            {isOpen ? (
              <>
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="flex items-center justify-center w-8 h-8 shrink-0 rounded bg-blue-600 shadow-sm">
                    <span className="text-white font-bold text-sm">PT</span>
                  </div>
                  <h1 className="text-base font-bold text-gray-900 tracking-tight truncate">PTMS Portal</h1>
                </div>
                <button
                  onClick={onToggle}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
              </>
            ) : (
              <button
                onClick={onToggle}
                className="w-10 h-10 flex items-center justify-center rounded bg-gray-50 text-gray-500 hover:bg-gray-100 transition-all border border-gray-200"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar overflow-x-hidden">
            <div className="space-y-1">
              {filteredNavigation.map((item) =>
                item.children ? (
                  <SidebarSubMenu
                    key={item.name}
                    item={item}
                    pathname={pathname}
                    onClose={onToggle}
                    isActive={isParentActive(item)}
                    isSidebarOpen={isOpen}
                  />
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center ${isOpen ? "px-3" : "justify-center"} py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      isActive(item.href)
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    title={!isOpen ? item.name : ""}
                  >
                    <span className={`${isOpen ? "mr-3" : ""} transition-colors ${isActive(item.href) ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}>
                      {item.icon}
                    </span>
                    {isOpen && <span className="truncate">{item.name}</span>}
                  </Link>
                )
              )}
            </div>
          </div>

          {/* User Section at Bottom */}
          <div className="p-3 mt-auto border-t border-gray-100 bg-gray-50/50 shrink-0">
            {isOpen ? (
              <div className="flex items-center p-2 rounded-md bg-white border border-gray-200 shadow-sm">
                <div className="w-8 h-8 shrink-0 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
                </div>
                <div className="ml-3 overflow-hidden">
                  <p className="text-xs font-bold text-gray-900 truncate">{user?.name || user?.username}</p>
                  <p className="text-[10px] uppercase font-semibold text-gray-400 truncate tracking-wide">{user?.role}</p>
                </div>
                <button
                  onClick={() => logout()}
                  className="ml-auto p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                  title="Logout"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold border border-gray-300">
                  {user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onToggle}
      />
    </>
  );
};

function SidebarSubMenu({
  item,
  pathname,
  onClose,
  isActive,
  isSidebarOpen,
}: {
  item: NavItem;
  pathname: string;
  onClose: () => void;
  isActive: boolean;
  isSidebarOpen: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(isActive);

  // Auto-close submenus when sidebar collapses
  React.useEffect(() => {
    if (!isSidebarOpen) setIsOpen(false);
  }, [isSidebarOpen]);

  if (!isSidebarOpen) {
    return (
    <div className="group relative flex justify-center py-2 text-gray-500 hover:text-gray-900 cursor-pointer rounded-md hover:bg-gray-50" title={item.name}>
        <span className={`${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}>
          {item.icon}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
          isActive
            ? "bg-gray-50 text-gray-900"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <span className={`mr-3 transition-colors ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}>
          {item.icon}
        </span>
        <span className="truncate">{item.name}</span>
        <svg
          className={`ml-auto h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="ml-7 space-y-1 border-l border-gray-200 pl-2 mt-1">
          {item.children?.map((child) => (
            <Link
              key={child.name}
              href={child.href}
              className={`flex items-center px-4 py-1.5 text-xs font-medium rounded transition-colors ${
                pathname === child.href
                  ? "text-blue-600 bg-blue-50/50"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Sidebar;
