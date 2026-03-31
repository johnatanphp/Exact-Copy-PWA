import { useState } from "react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { useGetUsers, useCreateUser, useDeleteUser, getGetUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CreateUserRequestRole } from "@workspace/api-client-react/src/generated/api.schemas";

const ROLE_META: Record<string, { label: string; cls: string; icon: string }> = {
  admin:    { label: "Superadmin", cls: "b-cy",  icon: "🔴" },
  vendedor: { label: "Vendedor",   cls: "b-or",  icon: "🟠" },
  viewer:   { label: "Viewer",     cls: "b-ok",  icon: "🟢" },
};

const AV_CLASS: Record<string, string> = {
  admin: "av-admin", vendedor: "av-vendedor", viewer: "av-viewer"
};

export default function UsersPage() {
  const { data: users, isLoading } = useGetUsers();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "", username: "", email: "", password: "", role: "viewer" as CreateUserRequestRole,
  });

  const showAlert = (type: "ok" | "err", msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate({ data: formData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
        setShowModal(false);
        setFormData({ name: "", username: "", email: "", password: "", role: "viewer" as CreateUserRequestRole });
        showAlert("ok", "Usuario creado correctamente");
      },
      onError: () => showAlert("err", "No se pudo crear el usuario"),
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    deleteUser.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
        showAlert("ok", "Usuario eliminado");
      },
      onError: () => showAlert("err", "No se pudo eliminar el usuario"),
    });
  };

  return (
    <SidebarLayout>
      <div className="page-wrap">
        <div className="sec-hd page-hd">
          <div>
            <div className="row" style={{ marginBottom: 4 }}>
              <span style={{ fontSize: "1.3rem" }}>👥</span>
              <h1 className="page-title">Usuarios</h1>
            </div>
            <p className="page-sub">Gestión de accesos y roles · {users?.length || 0} usuarios</p>
          </div>
          <button className="btn btn-cy" onClick={() => setShowModal(true)}>+ Nuevo Usuario</button>
        </div>

        {alert && (
          <div className={`alert ${alert.type === "ok" ? "al-ok" : "al-err"}`}>{alert.msg}</div>
        )}

        {isLoading ? (
          <div className="card shimmer" style={{ height: 200 }} />
        ) : users?.length === 0 ? (
          <div className="empty">
            <div className="empty-ico">👥</div>
            <div className="empty-ttl">Sin usuarios</div>
            <div>Crea el primer usuario del sistema</div>
          </div>
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users?.map(u => {
                  const meta = ROLE_META[u.role] || { label: u.role, cls: "b-off", icon: "⚪" };
                  const initials = u.name ? u.name.slice(0, 2).toUpperCase() : u.username.slice(0, 2).toUpperCase();
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className={`user-av ${AV_CLASS[u.role] || "av-viewer"}`}>{initials}</div>
                          <span style={{ fontFamily: "var(--cond)", fontWeight: 700 }}>{u.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: ".82rem", color: "var(--t1)" }}>{u.username}</span>
                      </td>
                      <td style={{ color: "var(--t2)", fontSize: ".82rem" }}>{u.email || "—"}</td>
                      <td>
                        <span className={`badge ${meta.cls}`}>
                          {meta.icon} {meta.label}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn btn-re btn-xs"
                          onClick={() => handleDelete(u.id)}
                          title="Eliminar usuario"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Create User Modal */}
        {showModal && (
          <div className="overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <div className="modal">
              <div className="modal-ttl">👥 Nuevo Usuario</div>
              <form onSubmit={handleSubmit}>
                <div className="fg-row">
                  <div className="fg">
                    <label>Nombre completo *</label>
                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre y apellido" required />
                  </div>
                  <div className="fg">
                    <label>Usuario (login) *</label>
                    <input value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="username" required />
                  </div>
                </div>
                <div className="fg-row">
                  <div className="fg">
                    <label>Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="correo@ejemplo.com" />
                  </div>
                  <div className="fg">
                    <label>Contraseña *</label>
                    <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" required />
                  </div>
                </div>
                <div className="fg" style={{ marginBottom: 20 }}>
                  <label>Rol *</label>
                  <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as CreateUserRequestRole })}>
                    <option value="admin">🔴 Superadmin — Control total</option>
                    <option value="vendedor">🟠 Vendedor — Gestión de productos</option>
                    <option value="viewer">🟢 Viewer — Solo lectura</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" className="btn btn-cy" disabled={createUser.isPending}>
                    {createUser.isPending ? "Guardando..." : "💾 Guardar Usuario"}
                  </button>
                  <button type="button" className="btn btn-sec" onClick={() => setShowModal(false)}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
