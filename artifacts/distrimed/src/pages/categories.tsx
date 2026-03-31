import { useState } from "react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { useGetCategories, useCreateCategory, getGetCategoriesQueryKey, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const CAT_ICONS = ["🏥", "💊", "🩺", "🔬", "🧬", "🩻", "⚕️", "🦷", "👁️", "🫀"];

export default function Categories() {
  const { data: categories, isLoading } = useGetCategories();
  const createCategory = useCreateCategory();
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();
  const isAdmin = user?.role === "admin";

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [alert, setAlert] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const showAlert = (type: "ok" | "err", msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCategory.mutate({ data: formData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCategoriesQueryKey() });
        setShowModal(false);
        setFormData({ name: "", description: "" });
        showAlert("ok", "Categoría creada correctamente");
      },
      onError: () => showAlert("err", "No se pudo crear la categoría"),
    });
  };

  return (
    <SidebarLayout>
      <div className="page-wrap">
        <div className="sec-hd page-hd">
          <div>
            <div className="row" style={{ marginBottom: 4 }}>
              <span style={{ fontSize: "1.3rem" }}>🏷️</span>
              <h1 className="page-title">Categorías</h1>
            </div>
            <p className="page-sub">Familias de productos médicos · {categories?.length || 0} categorías</p>
          </div>
          {isAdmin && (
            <button className="btn btn-cy" onClick={() => setShowModal(true)}>+ Nueva Categoría</button>
          )}
        </div>

        {alert && (
          <div className={`alert ${alert.type === "ok" ? "al-ok" : "al-err"}`}>{alert.msg}</div>
        )}

        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card shimmer" style={{ height: 110 }} />
            ))}
          </div>
        ) : categories?.length === 0 ? (
          <div className="empty">
            <div className="empty-ico">🏷️</div>
            <div className="empty-ttl">Sin categorías</div>
            <div>Crea la primera categoría para comenzar</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
            {categories?.map((cat, i) => (
              <div key={cat.id} className="card card-hover" style={{ borderColor: "var(--bd)", cursor: "default" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: "var(--r)",
                    background: "var(--cy10)",
                    border: "1px solid var(--cy20)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.3rem",
                    flexShrink: 0,
                  }}>
                    {CAT_ICONS[i % CAT_ICONS.length]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--cond)", fontWeight: 800, fontSize: "1rem", color: "var(--t0)" }}>
                      {cat.name}
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: ".65rem", color: "var(--t2)" }}>
                      #{cat.id}
                    </div>
                  </div>
                </div>
                {cat.description && (
                  <div style={{ fontSize: ".8rem", color: "var(--t2)", marginBottom: 10, lineHeight: 1.4 }}>
                    {cat.description}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="badge b-cy" style={{ fontFamily: "var(--mono)" }}>
                    {cat.productCount || 0} productos
                  </span>
                  <span className={`badge ${(cat.productCount || 0) > 0 ? "b-ok" : "b-off"}`}>
                    {(cat.productCount || 0) > 0 ? "Activa" : "Vacía"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table view below */}
        {!isLoading && (categories?.length || 0) > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{
              fontFamily: "var(--cond)",
              fontSize: ".75rem",
              fontWeight: 700,
              color: "var(--t2)",
              textTransform: "uppercase",
              letterSpacing: ".08em",
              marginBottom: 10,
            }}>
              VISTA DE TABLA
            </div>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th style={{ textAlign: "right" }}>Productos</th>
                  </tr>
                </thead>
                <tbody>
                  {categories?.map(cat => (
                    <tr key={cat.id}>
                      <td><span className="mono text-t2" style={{ fontSize: ".75rem" }}>#{cat.id}</span></td>
                      <td><span style={{ fontFamily: "var(--cond)", fontWeight: 700 }}>{cat.name}</span></td>
                      <td style={{ color: "var(--t2)", fontSize: ".8rem" }}>{cat.description || "—"}</td>
                      <td style={{ textAlign: "right" }}>
                        <span className="badge b-cy" style={{ fontFamily: "var(--mono)" }}>
                          {cat.productCount || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Category Modal */}
        {showModal && (
          <div className="overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <div className="modal">
              <div className="modal-ttl">🏷️ Nueva Categoría</div>
              <form onSubmit={handleSubmit}>
                <div className="fg">
                  <label>Nombre *</label>
                  <input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Equipos Diagnósticos"
                    required
                  />
                </div>
                <div className="fg">
                  <label>Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción breve de la categoría..."
                    rows={3}
                  />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button type="submit" className="btn btn-cy" disabled={createCategory.isPending}>
                    {createCategory.isPending ? "Guardando..." : "💾 Guardar"}
                  </button>
                  <button type="button" className="btn btn-sec" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
