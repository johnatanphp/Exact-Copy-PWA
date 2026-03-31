import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: "5rem", color: "var(--cy)", opacity: .2, lineHeight: 1, marginBottom: 16 }}>404</div>
        <div style={{ fontFamily: "var(--cond)", fontSize: "1.3rem", fontWeight: 800, color: "var(--t0)", marginBottom: 6 }}>Página no encontrada</div>
        <div style={{ color: "var(--t2)", fontSize: ".85rem", marginBottom: 24 }}>La ruta solicitada no existe en el sistema</div>
        <button className="btn btn-cy" onClick={() => setLocation("/dashboard")}>← Volver al inicio</button>
      </div>
    </div>
  );
}
