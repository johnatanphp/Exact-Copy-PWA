import { useGetMe } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { 
  Activity, 
  LayoutDashboard, 
  Package, 
  Tags, 
  Users,
  LogOut,
  User as UserIcon
} from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe();
  const logout = useLogout();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/login");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "vendedor", "viewer"] },
    { href: "/catalogo", label: "Catálogo", icon: Package, roles: ["admin", "vendedor", "viewer"] },
    { href: "/categorias", label: "Categorías", icon: Tags, roles: ["admin", "vendedor", "viewer"] },
    { href: "/usuarios", label: "Usuarios", icon: Users, roles: ["admin"] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-gray-50/50">
      {/* Sidebar */}
      <aside className="w-64 flex-col border-r bg-white flex shadow-sm z-10">
        <div className="p-6">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <Activity className="h-6 w-6" />
            DistriMed
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {visibleNavItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                location === item.href 
                  ? "bg-primary/10 text-primary" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="bg-primary/10 p-2 rounded-full text-primary">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize truncate">{user.role}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" 
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {logout.isPending ? "Cerrando..." : "Cerrar sesión"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
