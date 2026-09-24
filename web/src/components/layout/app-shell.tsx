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
  History,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/planner", label: "Planner", icon: CalendarDays },
  { href: "/focus", label: "Focus", icon: Clock },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/history", label: "History", icon: History },
  { href: "/progression", label: "Progression", icon: Trophy },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Bottom tab bar shows only the 5 most important items on mobile
const MOBILE_TAB_ITEMS = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/planner", label: "Plan", icon: CalendarDays },
  { href: "/focus", label: "Focus", icon: Clock },
  { href: "/progression", label: "Level", icon: Trophy },
  { href: "/settings", label: "More", icon: Menu },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-[var(--background)]">
        <div className="hidden md:block w-[220px] border-r border-[var(--border)] bg-[var(--sidebar)]" />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* ═══ Desktop Sidebar (hidden on mobile) ═══ */}
      <aside
        className={`
          hidden md:flex
          fixed top-0 left-0 z-40 h-full
          border-r border-[var(--border)] bg-[var(--sidebar)]
          transition-[width] duration-200 ease-in-out
          flex-col
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
            const active = isActive(href);

            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-3 px-3 py-[9px] rounded-[10px]
                  text-[13px] font-semibold
                  transition-colors duration-150
                  ${
                    active
                      ? "bg-[var(--primary-soft)] border border-[var(--primary-muted)] text-[var(--text-primary)] font-bold"
                      : "border border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                  }
                `}
                title={collapsed ? label : undefined}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
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

      {/* ═══ Mobile Full-Screen Menu Overlay ═══ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-[var(--background)] flex flex-col">
          {/* Menu Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <span className="text-lg">🚀</span>
              <span className="text-[15px] font-extrabold tracking-wide text-[var(--text-primary)]">
                ASCEND
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-[10px] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            >
              <X size={22} />
            </button>
          </div>

          {/* Full Nav List */}
          <nav className="flex-1 px-4 py-5 space-y-1 overflow-auto">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    flex items-center gap-4 px-4 py-3.5 rounded-[12px]
                    text-[15px] font-semibold
                    transition-colors duration-150
                    ${
                      active
                        ? "bg-[var(--primary-soft)] border border-[var(--primary-muted)] text-[var(--text-primary)] font-bold"
                        : "border border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                    }
                  `}
                >
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Data Actions in Mobile Menu */}
          <div className="px-4 py-4 border-t border-[var(--border)] space-y-1">
            <span className="px-4 py-1 text-[11px] font-bold tracking-[1px] text-[var(--text-muted)] uppercase">
              Data
            </span>
            <button
              className="flex items-center gap-4 px-4 py-3 w-full rounded-[12px] text-[15px] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
              onClick={async () => {
                const { downloadExport } = await import("@/lib/data-io");
                await downloadExport();
                setMobileMenuOpen(false);
              }}
            >
              <Download size={18} />
              <span>Export Data</span>
            </button>
            <label
              className="flex items-center gap-4 px-4 py-3 w-full rounded-[12px] text-[15px] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <Upload size={18} />
              <span>Import Data</span>
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
        </div>
      )}

      {/* ═══ Main Content ═══ */}
      <main
        className={`
          flex-1 min-h-screen overflow-auto
          transition-[margin-left] duration-200 ease-in-out
          pb-[72px] md:pb-0
          md:${collapsed ? "ml-[64px]" : "ml-[220px]"}
          ${collapsed ? "md:ml-[64px]" : "md:ml-[220px]"}
        `}
      >
        {children}
      </main>

      {/* ═══ Mobile Bottom Tab Bar (hidden on desktop) ═══ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[var(--sidebar)] border-t border-[var(--border)] safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {MOBILE_TAB_ITEMS.map(({ href, label, icon: Icon }) => {
            // "More" button opens the full menu instead of navigating
            if (label === "More") {
              return (
                <button
                  key="more"
                  onClick={() => setMobileMenuOpen(true)}
                  className={`
                    flex flex-col items-center justify-center gap-0.5 flex-1 h-full
                    text-[10px] font-semibold transition-colors
                    ${mobileMenuOpen
                      ? "text-[var(--primary)]"
                      : "text-[var(--text-muted)]"
                    }
                  `}
                >
                  <Menu size={20} strokeWidth={1.8} />
                  <span>{label}</span>
                </button>
              );
            }

            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex flex-col items-center justify-center gap-0.5 flex-1 h-full
                  text-[10px] font-semibold transition-colors
                  ${
                    active
                      ? "text-[var(--primary)]"
                      : "text-[var(--text-muted)]"
                  }
                `}
              >
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
