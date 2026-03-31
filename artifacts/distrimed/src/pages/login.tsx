import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const ACCOUNTS = [
  { icon: "🔴", username: "admin", password: "admin123", role: "Superadmin", label: "Control total del sistema", cls: "av-admin" },
  { icon: "🟠", username: "vendedor1", password: "admin123", role: "Vendedor", label: "Gestión de catálogo", cls: "av-vendedor" },
  { icon: "🟢", username: "viewer1",  password: "admin123", role: "Viewer",   label: "Solo lectura",         cls: "av-viewer" },
];

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const loginMutation = useLogin();
  const { data: user } = useGetMe();

  if (user) {
    setLocation("/dashboard");
    return null;
  }

  const fill = (acc: typeof ACCOUNTS[0]) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setSelected(acc.username);
    setErrorMsg("");
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!username || !password) return;
    setErrorMsg("");
    loginMutation.mutate(
      { data: { username, password } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          setLocation("/dashboard");
        },
        onError: () => setErrorMsg("Usuario o contraseña incorrectos"),
      }
    );
  };

  return (
    <div className="login-pg">
      <div className="login-glow" />
      <div className="login-grid" />

      <div className="login-card">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: "1.8rem" }}>🏥</span>
          <div className="login-logo">DistriMed</div>
        </div>
        <div className="login-sub">Sistema de Catálogo Médico · Acceso por roles</div>

        {/* Quick-access accounts */}
        <div className="demo-box">
          <div style={{
            marginBottom: 10,
            fontFamily: "var(--cond)",
            fontWeight: 800,
            fontSize: ".8rem",
            color: "var(--t2)",
            textTransform: "uppercase",
            letterSpacing: ".08em"
          }}>
            ⚡ Accesos rápidos demo
          </div>
          {ACCOUNTS.map(acc => (
            <button
              key={acc.username}
              className={`demo-account${selected === acc.username ? " active" : ""}`}
              onClick={() => fill(acc)}
              type="button"
            >
              <div className={`user-av ${acc.cls}`} style={{ fontSize: "1rem" }}>{acc.icon}</div>
              <div className="da-info">
                <div className="da-role">{acc.role}</div>
                <div className="da-user">{acc.username} · {acc.label}</div>
              </div>
              <div className="da-arrow">→</div>
            </button>
          ))}
        </div>

        {errorMsg && (
          <div className="alert al-err" style={{ marginBottom: 16 }}>⚠️ {errorMsg}</div>
        )}

        <form onSubmit={submit}>
          <div className="fg">
            <label>Usuario</label>
            <input
              type="text"
              placeholder="Ingrese su usuario"
              value={username}
              onChange={e => { setUsername(e.target.value); setSelected(null); }}
              autoComplete="username"
            />
          </div>
          <div className="fg" style={{ marginBottom: 22 }}>
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setSelected(null); }}
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-cy w-full btn-lg"
            disabled={loginMutation.isPending || !username}
          >
            {loginMutation.isPending ? "Ingresando..." : "🚀 Ingresar"}
          </button>
        </form>

        <div style={{
          marginTop: 20,
          padding: "10px 14px",
          background: "var(--bg3)",
          borderRadius: "var(--r)",
          fontSize: ".72rem",
          color: "var(--t2)",
          fontFamily: "var(--mono)",
          textAlign: "center",
        }}>
          Demo · Contraseña: <span style={{ color: "var(--cy)" }}>admin123</span>
        </div>
      </div>
    </div>
  );
}
