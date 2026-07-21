import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Coins, Menu, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { navItems } from "@/lib/navigation";
import SyncStatus from "@/components/SyncStatus";
import ThemeToggle from "@/components/ThemeToggle";
import BottomNav from "@/components/BottomNav";

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();

  async function handleLogout() {
    await signOut();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* En-tête mobile : liseré émeraude → or en signature de marque. */}
      <div className="md:hidden sticky top-0 z-30">
        <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-accent text-accent-foreground flex items-center justify-center">
              <Coins className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <span className="font-heading font-semibold tracking-tight">Kasaina</span>
          </div>
          <div className="flex items-center gap-3">
            <SyncStatus />
            <ThemeToggle />
            <button
              onClick={() => setOpen(true)}
              aria-label="Menu"
              className="touch-target -m-1.5 p-1.5 rounded-lg hover:bg-primary-foreground/10"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="h-[3px] bg-gradient-to-r from-accent via-primary to-accent" />
      </div>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center">
              <Coins className="h-4.5 w-4.5" strokeWidth={2.25} />
            </span>
            <div>
              <p className="font-heading font-semibold leading-tight tracking-tight">Kasaina</p>
              <p className="text-xs text-sidebar-foreground/50">budget · {new Date().getFullYear()}</p>
            </div>
          </div>
          <button className="md:hidden touch-target" onClick={() => setOpen(false)} aria-label="Fermer">
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
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-sidebar-primary transition-opacity",
                      isActive ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <item.icon className="h-4 w-4" strokeWidth={2} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-3 py-5 border-t border-sidebar-border">
          <div className="px-3 mb-3 flex items-center justify-between">
            <SyncStatus />
            <ThemeToggle />
          </div>
          <p className="px-3 text-xs text-sidebar-foreground/45 truncate mb-2">
            {user?.email}
          </p>
          <p className="px-3 text-[10px] text-sidebar-foreground/35 mb-2">
            © {new Date().getFullYear()} Kasaina
          </p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors"
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

      <main className="md:pl-64 pb-24 md:pb-0">
        <Outlet />
        <p className="px-4 md:px-6 py-4 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Kasaina. Tous droits réservés.
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
