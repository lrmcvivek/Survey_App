"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
  children?: NavItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user, hasRole, logout } = useAuth();

  const navigation: NavItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"
          />
        </svg>
      ),
      roles: ["SUPERADMIN", "ADMIN","SUPERVISOR"],
    },
    {
      name: "General Masters",
      href: "#",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
      ),
      roles: ["SUPERADMIN", "ADMIN"],
      children: [
        {
          name: "ULB Master",
          href: "/masters/ulb",
          roles: ["SUPERADMIN", "ADMIN"],
          icon: (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          ),
        },
        {
          name: "Zone Master",
          href: "/masters/zone",
          roles: ["SUPERADMIN", "ADMIN"],
          icon: (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          ),
        },
        {
          name: "Ward Master",
          href: "/masters/ward",
          roles: ["SUPERADMIN", "ADMIN"],
          icon: (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          ),
        },
        {
          name: "Mohalla Master",
          href: "/masters/mohalla",
          roles: ["SUPERADMIN", "ADMIN"],
          icon: (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          ),
        },
        {
          name: "Home Links",
          href: "/masters/home-links",
          roles: ["SUPERADMIN", "ADMIN"],
          icon: (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          ),
        },
        {
          name: "Vendor Ward Allotment",
          href: "/masters/vendor-ward-allotment",
          roles: ["SUPERADMIN", "ADMIN"],
          icon: (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          ),
        },
        {
          name: "Discount Policy",
          href: "/masters/discount-policy",
          roles: ["SUPERADMIN", "ADMIN"],
          icon: (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          ),
        },
        {
          name: "Tax Applicability",
          href: "/masters/tax-applicability",
          roles: ["SUPERADMIN", "ADMIN"],
          icon: (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          ),
        },
      ],
    },
    {
      name: "Tax Masters",
      href: "#",
      roles: ["SUPERADMIN", "ADMIN"],
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6"
          />
        </svg>
      ),
      children: [
        {
          name: "Assessment Year",
          href: "/taxmasters/assessmentYear",
          roles: ["SUPERADMIN", "ADMIN"],
          icon: (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6"
              />
            </svg>
          ),
        },
        {
          name: "Financial Year",
          href: "/taxmasters/financialYear",
          roles: ["SUPERADMIN", "ADMIN"],
          icon: (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6"
              />
            </svg>
          ),
        },
        {
          name: "Ward Rate",
          href: "/taxmasters/wardRate",
          roles: ["SUPERADMIN", "ADMIN"],
          icon: (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6"
              />
            </svg>
          ),
        },
        {
          name: "Building Age wise Discount",
          href: "/taxmasters/BADiscount",
          roles: ["SUPERADMIN", "ADMIN"],
          icon: (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6"
              />
            </svg>
          ),
        },
        {
          name: "Tax Lab",
          href: "/taxmasters/taxLab",
          roles: ["SUPERADMIN", "ADMIN"],
          icon: (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6"
              />
            </svg>
          ),
        },
        {
          name: "Surcharge",
          href: "/taxmasters/surcharge",
          roles: ["SUPERADMIN", "ADMIN"],
          icon: (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6"
              />
            </svg>
          ),
        },
      ],
    },
    {
      name: "LRMC MIS Reports",
      href: "#",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h18v18H3V3z"
          />
        </svg>
      ),
      roles: ["SUPERADMIN", "ADMIN","SUPERVISOR"],
      children: [
        {
          name: "Property List",
          href: "/mis-reports/property-list",
          roles: ["SUPERADMIN", "ADMIN","SUPERVISOR"],
          icon: (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          ),
        },
        {
          name: "Search by GISID",
          href: "/mis-reports/search-by-gisid",
          roles: ["SUPERADMIN", "ADMIN","SUPERVISOR"],
          icon: (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          ),
        },
      ],
    },
    {
      name: "User Management",
      href: "#",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      roles: ["SUPERADMIN", "ADMIN"],
      children: [
        {
          name: "Users",
          href: "/userManagement/users",
          roles: ["SUPERADMIN", "ADMIN"],
          icon: (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          ),
        },
        {
          name: "User Assignment",
          href: "/userManagement/user-assignment",
          roles: ["SUPERADMIN", "ADMIN"],
          icon: (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2a4 4 0 018 0v2m-4-4a4 4 0 100-8 4 4 0 000 8z"
              />
            </svg>
          ),
        },
        {
          name: "User Assignment Mangement",
          href: "/userManagement/user-assignment-management",
          roles: ["SUPERADMIN", "ADMIN"],
          icon: (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2a4 4 0 018 0v2m-4-4a4 4 0 100-8 4 4 0 000 8z"
              />
            </svg>
          ),
        },
      ],
    },
    {
      name: "QC Management",
      href: "#",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      roles: ["SUPERADMIN", "ADMIN","SUPERVISOR"],
      children: [
        {
          name: "QC Dashboard",
          href: "/qc/dashboard",
          roles: ["SUPERADMIN", "ADMIN","SUPERVISOR"],
          icon: (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
/>
            </svg>
          )
        },
        {
          name: "QC Edit",
          href: "/qc/edit",
          roles: ["SUPERADMIN", "ADMIN","SUPERVISOR"],
          icon: (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
              />
            </svg>
          )
        }
      ]
    },
    {
      name: "Survey Management",
      href: "/surveys",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      roles: ["SUPERADMIN", "ADMIN"],
    },
    {
      name: "Reports & Analytics",
      href: "/reports",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      roles: ["SUPERADMIN", "ADMIN"],
    },
    {
      name: "Financial Year Closing",
      href: "/financial-year-closing",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3"
          />
        </svg>
      ),
      roles: ["SUPERADMIN", "ADMIN"],
    },
  ];

  const filteredNavigation = navigation.filter((item) => hasRole(item.roles));

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <>
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 bg-gray-900">
            <h1 className="text-xl font-semibold text-white">LRMC PTMS</h1>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white lg:hidden"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1">
            {filteredNavigation.map((item) =>
              item.children ? (
                <SidebarSubMenu
                  key={item.name}
                  item={item}
                  pathname={pathname}
                  onClose={onClose}
                />
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              )
            )}
          </nav>

          <div className="mt-auto p-2">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-red-700 hover:text-white"
            >
              <svg
                className="mr-3 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
};

function SidebarSubMenu({
  item,
  pathname,
  onClose,
}: {
  item: NavItem;
  pathname: string;
  onClose: () => void;
}) {
  return (
    <div className="relative group">
      <div
        className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
          item.children?.some((child) => pathname.startsWith(child.href))
            ? "bg-gray-900 text-white"
            : "text-gray-300 hover:bg-gray-700 hover:text-white"
        }`}
        tabIndex={0}
      >
        <span className="mr-3">{item.icon}</span>
        {item.name}
        <svg
          className={`ml-auto h-4 w-4 transition-transform`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
      <div className="absolute left-full top-0 z-50 min-w-[180px] bg-gray-900 shadow-lg rounded-md opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto transition-opacity duration-200">
        <div className="py-2">
          {item.children?.map((child) => (
            <Link
              key={child.name}
              href={child.href}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  onClose();
                }
              }}
              className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                pathname.startsWith(child.href)
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              {child.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
