import { useEffect } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",    icon: "📊", roles: ["admin", "vendedor", "viewer"] },
  { href: "/catalogo",   label: "Catálogo",      icon: "🧬", roles: ["admin", "vendedor", "viewer"] },
  { href: "/categorias", label: "Categorías",    icon: "🏷️", roles: ["admin", "vendedor", "viewer"] },
  { href: "/usuarios",   label: "Usuarios",      icon: "👥", roles: ["admin"] },
];

const roleLabel: Record<string, string> = {
  admin: "Superadmin",
  vendedor: "Vendedor",
  viewer: "Solo lectura",
};

const roleClass: Record<string, string> = {
  admin: "av-admin",
  vendedor: "av-vendedor",
  viewer: "av-viewer",
};

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
      },
    });
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: 12 }}>🏥</div>
          <div style={{ fontFamily: "var(--cond)", fontSize: ".85rem", color: "var(--t2)", letterSpacing: ".08em" }}>CARGANDO...</div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [isLoading, user, setLocation]);

  if (!isLoading && !user) {
    return null;
  }

  const visibleNav = NAV_ITEMS.filter(n => n.roles.includes(user.role));
  const initials = user.name ? user.name.slice(0, 2).toUpperCase() : user.username.slice(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-brand">
            <span>🏥</span>
            DistriMed
          </div>
          <div className="sidebar-tagline">CATÁLOGO MÉDICO · v2.0</div>
        </div>

        <nav className="sidebar-nav">
          {visibleNav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${location === item.href || location.startsWith(item.href + "/") ? " active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-chip">
            <div className={`user-av ${roleClass[user.role] || "av-viewer"}`}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name">{user.name || user.username}</div>
              <div className="user-role">{roleLabel[user.role] || user.role}</div>
            </div>
          </div>
          <button
            className="btn btn-re w-full"
            onClick={handleLogout}
            disabled={logout.isPending}
            style={{ fontSize: ".78rem" }}
          >
            {logout.isPending ? "Cerrando..." : "⏻ Cerrar sesión"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
