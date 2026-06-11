import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Shield, BarChart3, History, Cpu, Upload, Home } from "lucide-react";

const navItems = [
  { href: "/analyze", label: "Analyze", icon: Upload },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/history", label: "History", icon: History },
  { href: "/models", label: "Models", icon: Cpu },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-56 bg-sidebar border-r border-sidebar-border flex flex-col fixed h-full z-10">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded bg-primary/20 border border-primary/40 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground tracking-wide">DEEPGUARD</div>
                <div className="text-[10px] text-muted-foreground tracking-widest uppercase">MLOps Platform</div>
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <Link href="/">
            <div className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all duration-150 cursor-pointer mb-1",
              location === "/"
                ? "bg-primary/15 text-primary border border-primary/25"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground border border-transparent"
            )}>
              <Home className="w-4 h-4 shrink-0" />
              <span className="font-medium">Home</span>
            </div>
          </Link>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = location.startsWith(href);
            return (
              <Link key={href} href={href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all duration-150 cursor-pointer",
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/25"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground border border-transparent"
                )}>
                  <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "")} />
                  <span className="font-medium">{label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-muted-foreground">All systems operational</span>
          </div>
          <div className="mt-1.5 text-[10px] text-muted-foreground/60 font-mono">v2.3.1 — 4 models active</div>
        </div>
      </aside>

      <main className="flex-1 ml-56 min-h-screen">
        {children}
      </main>
    </div>
  );
}
