import { Link, useLocation } from "wouter";
import { Activity, LayoutDashboard, History, Database, ShieldAlert, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: ShieldAlert, label: "Detection Scanner" },
  { href: "/dashboard", icon: LayoutDashboard, label: "Analytics Hub" },
  { href: "/history", icon: History, label: "Audit Log" },
  { href: "/models", icon: Database, label: "Model Fleet" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen bg-background text-foreground noise-bg font-sans selection:bg-primary/30 selection:text-primary">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col fixed inset-y-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-border bg-sidebar/50">
          <ShieldAlert className="w-6 h-6 text-primary mr-3" />
          <span className="font-mono font-bold tracking-widest text-lg text-primary uppercase">DEEPGUARD</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-sm text-sm font-medium transition-all duration-200 cursor-pointer group",
                    isActive 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                  )}
                >
                  <Icon className={cn("w-4 h-4 mr-3", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.label}
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="bg-muted/30 border border-border rounded-sm p-3 flex items-start space-x-3">
            <div className="mt-0.5">
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <div className="text-xs font-mono text-green-500 mb-1">SYSTEM NOMINAL</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">All models online</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pl-64 flex flex-col min-h-screen">
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
          <div className="flex items-center text-sm text-muted-foreground font-mono">
            <span className="text-primary mr-2">SYS_OP:</span>
            <span>{new Date().toISOString().split('T')[0]} / RUNNING_SECURE_ENV</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs font-mono text-primary">LIVE</span>
            </div>
          </div>
        </header>
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
