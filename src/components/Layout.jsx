import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowRightLeft,
  CalendarRange,
  Target,
  Wallet,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import SyncStatus from "@/components/SyncStatus";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard, end: true },
  { to: "/transactions", label: "Transactions", icon: ArrowRightLeft },
  { to: "/budget", label: "Budget annuel", icon: CalendarRange },
  { to: "/objectifs", label: "Objectifs", icon: Target },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();

  async function handleLogout() {
    await signOut();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center gap-2 font-heading font-semibold">
          <Wallet className="h-5 w-5" />
          Budget MG
        </div>
        <div className="flex items-center gap-3">
          <SyncStatus />
          <ThemeToggle />
          <button onClick={() => setOpen(true)} aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-primary text-primary-foreground flex flex-col transition-transform md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <p className="font-heading font-semibold leading-tight">Budget MG</p>
              <p className="text-xs text-primary-foreground/60">Ariary · 2026</p>
            </div>
          </div>
          <button className="md:hidden" onClick={() => setOpen(false)} aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="px-3 mt-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-foreground/15 text-primary-foreground"
                    : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-3 py-5 border-t border-primary-foreground/10">
          <div className="px-3 mb-3 flex items-center justify-between">
            <SyncStatus />
            <ThemeToggle />
          </div>
          <p className="px-3 text-xs text-primary-foreground/50 truncate mb-2">
            {user?.email}
          </p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
            Se déconnecter
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <main className="md:pl-64">
        <Outlet />
      </main>
    </div>
  );
}