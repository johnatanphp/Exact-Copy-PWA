import { useGetDashboardSummary, useGetMe, useGetProducts, useGetCategories } from "@workspace/api-client-react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#00e5ff", "#ff6030", "#00e676", "#ffd600", "#aa44ff", "#ff3355"];

function StatCard({ icon, value, label, sub, color }: { icon: string; value?: number | string; label: string; sub?: string; color?: string }) {
  return (
    <div className="stat">
      <div className="stat-ico">{icon}</div>
      <div className="stat-val" style={{ color: color || "var(--t0)" }}>{value ?? "—"}</div>
      <div className="stat-lbl">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function AdminDashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();
  const { data: categories } = useGetCategories();

  const pieData = categories
    ?.filter(c => (c.productCount || 0) > 0)
    .map(c => ({ name: c.name, value: c.productCount || 0 })) || [];

  return (
    <div>
      {isLoading ? (
        <div className="stats-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat shimmer" style={{ height: 110 }} />
          ))}
        </div>
      ) : (
        <div className="stats-grid">
          <StatCard icon="🧬" value={summary?.totalProducts} label="Total Productos" sub={`${summary?.lowStockProducts || 0} con stock bajo`} color="var(--cy)" />
          <StatCard icon="🏷️" value={summary?.totalCategories} label="Categorías activas" color="var(--pu)" />
          <StatCard icon="⚠️" value={summary?.lowStockProducts} label="Alertas de stock" sub="Requieren atención" color="var(--ye)" />
          <StatCard icon="👥" value={summary?.totalUsers} label="Usuarios totales" color="var(--gr)" />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontFamily: "var(--cond)", fontSize: ".78rem", fontWeight: 700, color: "var(--t2)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>
            DISTRIBUCIÓN POR CATEGORÍA
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" nameKey="name" paddingAngle={3}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "var(--bg2)", border: "1px solid var(--bd)", borderRadius: "var(--r)", color: "var(--t0)", fontFamily: "var(--mono)", fontSize: ".78rem" }}
                  formatter={(v: number) => [`${v} productos`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty" style={{ padding: 30 }}><div>Sin datos</div></div>
          )}
        </div>

        <div className="card">
          <div style={{ fontFamily: "var(--cond)", fontSize: ".78rem", fontWeight: 700, color: "var(--t2)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>
            PRODUCTOS POR CATEGORÍA
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pieData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--t2)", fontFamily: "var(--cond)" }} />
                <YAxis tick={{ fontSize: 9, fill: "var(--t2)", fontFamily: "var(--mono)" }} />
                <Tooltip
                  contentStyle={{ background: "var(--bg2)", border: "1px solid var(--bd)", borderRadius: "var(--r)", color: "var(--t0)", fontFamily: "var(--mono)", fontSize: ".78rem" }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty" style={{ padding: 30 }}><div>Sin datos</div></div>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ fontFamily: "var(--cond)", fontSize: ".78rem", fontWeight: 700, color: "var(--t2)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>
          CATEGORÍAS DEL SISTEMA
        </div>
        {categories?.map((cat, i) => (
          <div key={cat.id} className="feed-item">
            <div className="feed-dot" style={{ background: COLORS[i % COLORS.length] }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: "var(--cond)", fontWeight: 700 }}>{cat.name}</span>
              {cat.description && <span style={{ color: "var(--t2)", fontSize: ".78rem", marginLeft: 8 }}>{cat.description}</span>}
            </div>
            <span className="badge b-cy" style={{ fontFamily: "var(--mono)" }}>{cat.productCount || 0} productos</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VendedorDashboard() {
  const { data: productsData } = useGetProducts({});
  const { data: categories } = useGetCategories();
  const products = productsData?.products || [];
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10);
  const outOfStock = products.filter(p => p.stock === 0);

  return (
    <div>
      <div className="stats-grid">
        <StatCard icon="🧬" value={products.length} label="Total Productos" color="var(--cy)" />
        <StatCard icon="🏷️" value={categories?.length} label="Categorías" color="var(--pu)" />
        <StatCard icon="⚠️" value={lowStock.length} label="Stock bajo" sub="≤ 10 unidades" color="var(--ye)" />
        <StatCard icon="❌" value={outOfStock.length} label="Sin stock" color="var(--re)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="card">
          <div style={{ fontFamily: "var(--cond)", fontSize: ".78rem", fontWeight: 700, color: "var(--t2)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>
            STOCK BAJO — ATENCIÓN
          </div>
          {lowStock.length === 0 && outOfStock.length === 0 ? (
            <div className="empty" style={{ padding: 20 }}>
              <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>✅</div>
              <div style={{ color: "var(--gr)" }}>Stock en buen estado</div>
            </div>
          ) : (
            <>
              {outOfStock.slice(0, 5).map(p => (
                <div key={p.id} className="feed-item">
                  <div className="feed-dot" style={{ background: "var(--re)" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--cond)", fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: ".72rem", color: "var(--t2)" }}>{p.code}</div>
                  </div>
                  <span className="badge b-re">AGOTADO</span>
                </div>
              ))}
              {lowStock.slice(0, 5).map(p => (
                <div key={p.id} className="feed-item">
                  <div className="feed-dot" style={{ background: "var(--ye)" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--cond)", fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: ".72rem", color: "var(--t2)" }}>{p.code}</div>
                  </div>
                  <span className="badge b-warn" style={{ fontFamily: "var(--mono)" }}>Stock: {p.stock}</span>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="card">
          <div style={{ fontFamily: "var(--cond)", fontSize: ".78rem", fontWeight: 700, color: "var(--t2)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>
            ÚLTIMOS PRODUCTOS
          </div>
          {products.slice(0, 6).map((p, i) => (
            <div key={p.id} className="feed-item">
              <div className="feed-dot" style={{ background: COLORS[i % COLORS.length] }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--cond)", fontWeight: 700 }}>{p.name}</div>
                <div style={{ fontSize: ".72rem", color: "var(--t2)" }}>{p.categoryName}</div>
              </div>
              <span style={{ fontFamily: "var(--mono)", color: "var(--cy)", fontSize: ".82rem" }}>${p.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ViewerDashboard() {
  const { data: productsData } = useGetProducts({});
  const { data: categories } = useGetCategories();
  const products = productsData?.products || [];

  return (
    <div>
      <div className="stats-grid">
        <StatCard icon="🧬" value={products.length} label="Productos disponibles" color="var(--cy)" />
        <StatCard icon="🏷️" value={categories?.length} label="Categorías" color="var(--pu)" />
        <StatCard icon="✅" value={products.filter(p => p.stock > 10).length} label="En stock" color="var(--gr)" />
        <StatCard icon="⚠️" value={products.filter(p => p.stock <= 10).length} label="Stock limitado" color="var(--ye)" />
      </div>

      <div className="card">
        <div style={{ fontFamily: "var(--cond)", fontSize: ".78rem", fontWeight: 700, color: "var(--t2)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>
          CATÁLOGO DE PRODUCTOS
        </div>
        {products.slice(0, 10).map((p, i) => (
          <div key={p.id} className="feed-item">
            <div className="feed-dot" style={{ background: COLORS[i % COLORS.length] }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--cond)", fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: ".72rem", color: "var(--t2)" }}>{p.categoryName} · {p.code}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--mono)", color: "var(--cy)", fontSize: ".82rem" }}>${p.price.toFixed(2)}</span>
              <span className={`badge ${p.stock > 10 ? "b-ok" : p.stock > 0 ? "b-warn" : "b-re"}`} style={{ fontFamily: "var(--mono)", fontSize: ".62rem" }}>
                {p.stock > 10 ? "OK" : p.stock > 0 ? p.stock : "—"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: user } = useGetMe();

  const greetings: Record<string, { title: string; sub: string; icon: string }> = {
    admin:    { title: "Panel de Administración", sub: "Control total del sistema DistriMed", icon: "🔴" },
    vendedor: { title: "Panel de Vendedor", sub: "Gestión y seguimiento del catálogo", icon: "🟠" },
    viewer:   { title: "Panel de Consulta", sub: "Vista general del catálogo médico", icon: "🟢" },
  };

  const greeting = greetings[user?.role || "viewer"] || greetings.viewer;

  return (
    <SidebarLayout>
      <div className="page-wrap">
        <div className="page-hd">
          <div className="row" style={{ marginBottom: 4 }}>
            <span style={{ fontSize: "1.4rem" }}>{greeting.icon}</span>
            <h1 className="page-title">{greeting.title}</h1>
          </div>
          <p className="page-sub">{greeting.sub}</p>
        </div>

        {user?.role === "admin"    && <AdminDashboard />}
        {user?.role === "vendedor" && <VendedorDashboard />}
        {user?.role === "viewer"   && <ViewerDashboard />}
      </div>
    </SidebarLayout>
  );
}
