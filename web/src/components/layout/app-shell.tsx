"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  Clock,
  Trophy,
  Settings,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/planner", label: "Planner", icon: CalendarDays },
  { href: "/focus", label: "Focus", icon: Clock },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/progression", label: "Progression", icon: Trophy },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-[var(--background)]">
        <div className="w-[220px] border-r border-[var(--border)] bg-[var(--sidebar)]" />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full
          border-r border-[var(--border)] bg-[var(--sidebar)]
          transition-[width] duration-200 ease-in-out
          flex flex-col
          ${collapsed ? "w-[64px]" : "w-[220px]"}
        `}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--border)]">
          <span className="text-lg">🚀</span>
          {!collapsed && (
            <span className="text-[15px] font-extrabold tracking-wide text-[var(--text-primary)]">
              ASCEND
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          <div className="px-3 py-2">
            {!collapsed && (
              <span className="text-[11px] font-bold tracking-[1px] text-[var(--text-muted)] uppercase">
                Navigate
              </span>
            )}
          </div>

          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-3 px-3 py-[9px] rounded-[10px]
                  text-[13px] font-semibold
                  transition-colors duration-150
                  ${
                    isActive
                      ? "bg-[var(--primary-soft)] border border-[var(--primary-muted)] text-[var(--text-primary)] font-bold"
                      : "border border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                  }
                `}
                title={collapsed ? label : undefined}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Data actions */}
        <div className="px-2 py-3 border-t border-[var(--border)] space-y-1">
          {!collapsed && (
            <span className="px-3 py-1 text-[11px] font-bold tracking-[1px] text-[var(--text-muted)] uppercase">
              Data
            </span>
          )}
          <button
            className="flex items-center gap-3 px-3 py-2 w-full rounded-[10px] text-[13px] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
            title="Export Data"
            onClick={async () => {
              const { downloadExport } = await import("@/lib/data-io");
              await downloadExport();
            }}
          >
            <Download size={16} />
            {!collapsed && <span>Export</span>}
          </button>
          <label
            className="flex items-center gap-3 px-3 py-2 w-full rounded-[10px] text-[13px] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Import Data"
          >
            <Upload size={16} />
            {!collapsed && <span>Import</span>}
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const { importData } = await import("@/lib/data-io");
                const result = await importData(file);
                alert(result.message);
                if (result.success) window.location.reload();
              }}
            />
          </label>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-10 border-t border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* Main content */}
      <main
        className={`
          flex-1 min-h-screen overflow-auto
          transition-[margin-left] duration-200 ease-in-out
          ${collapsed ? "ml-[64px]" : "ml-[220px]"}
        `}
      >
        {children}
      </main>
    </div>
  );
}
