import { useState } from "react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { useGetProducts, useGetCategories, useDeleteProduct, getGetProductsQueryKey, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function Catalog() {
  const [search, setSearch]     = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const queryClient = useQueryClient();
  const [alert, setAlert] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const { data: productsData, isLoading } = useGetProducts({
    search: search || undefined,
    category: categoryId !== "all" ? categoryId : undefined,
  });
  const { data: categories } = useGetCategories();
  const deleteProduct = useDeleteProduct();

  const isAdmin   = user?.role === "admin";
  const isVendedor = user?.role === "vendedor";
  const canEdit   = isAdmin;

  const showAlert = (type: "ok" | "err", msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("¿Eliminar este producto?")) return;
    deleteProduct.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
        showAlert("ok", "Producto eliminado");
      },
      onError: () => showAlert("err", "No se pudo eliminar"),
    });
  };

  const products = productsData?.products || [];

  return (
    <SidebarLayout>
      <div className="page-wrap">
        <div className="sec-hd page-hd">
          <div>
            <div className="row" style={{ marginBottom: 4 }}>
              <span style={{ fontSize: "1.3rem" }}>🧬</span>
              <h1 className="page-title">Catálogo de Productos</h1>
            </div>
            <p className="page-sub">{products.length} productos · {isAdmin ? "Modo administración" : isVendedor ? "Modo vendedor" : "Solo lectura"}</p>
          </div>
          {canEdit && (
            <button className="btn btn-cy" onClick={() => setLocation("/producto/new")}>
              + Nuevo Producto
            </button>
          )}
        </div>

        {alert && (
          <div className={`alert ${alert.type === "ok" ? "al-ok" : "al-err"}`}>{alert.msg}</div>
        )}

        {/* Filters */}
        <div className="filters" style={{ marginBottom: 20 }}>
          <input
            placeholder="🔍 Buscar por nombre o código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 2, minWidth: 180 }}
          />
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={{ minWidth: 180 }}>
            <option value="all">Todas las categorías</option>
            {categories?.map(c => (
              <option key={c.id} value={c.id.toString()}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Category chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
          <button className={`chip${categoryId === "all" ? " on" : ""}`} onClick={() => setCategoryId("all")}>Todos</button>
          {categories?.map(c => (
            <button
              key={c.id}
              className={`chip${categoryId === c.id.toString() ? " on" : ""}`}
              onClick={() => setCategoryId(categoryId === c.id.toString() ? "all" : c.id.toString())}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="prod-grid">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="prod-card">
                <div className="prod-thumb shimmer" />
                <div className="prod-body">
                  <div className="shimmer" style={{ height: 12, width: "50%", marginBottom: 6 }} />
                  <div className="shimmer" style={{ height: 16, width: "80%", marginBottom: 8 }} />
                  <div className="shimmer" style={{ height: 12, width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="empty">
            <div className="empty-ico">🔬</div>
            <div className="empty-ttl">Sin resultados</div>
            <div>Ajusta los filtros de búsqueda</div>
          </div>
        ) : (
          <div className="prod-grid">
            {products.map(product => (
              <div
                key={product.id}
                className="prod-card card-hover"
                onClick={() => setLocation(`/producto/${product.id}`)}
              >
                <div className="prod-thumb">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
                    />
                  ) : (
                    <span style={{ position: "relative", zIndex: 1 }}>💊</span>
                  )}
                  <div style={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}>
                    <span className="badge" style={{
                      background: "rgba(5,12,26,.8)",
                      color: "var(--cy)",
                      border: "1px solid var(--cy20)",
                      fontSize: ".6rem",
                      fontFamily: "var(--mono)",
                    }}>
                      {product.code}
                    </span>
                  </div>
                </div>

                <div className="prod-body">
                  <div className="prod-cat">{product.categoryName}</div>
                  <div className="prod-name">{product.name}</div>
                  <div className="prod-price">${product.price.toFixed(2)}</div>
                </div>

                <div className="prod-foot">
                  <span className={`badge ${product.stock > 10 ? "b-ok" : product.stock > 0 ? "b-warn" : "b-re"}`}>
                    {product.stock > 10 ? `✓ ${product.stock}` : product.stock > 0 ? `⚠️ ${product.stock}` : "Agotado"}
                  </span>
                  {canEdit && (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        className="btn btn-sec btn-xs"
                        onClick={e => { e.stopPropagation(); setLocation(`/producto/${product.id}?edit=true`); }}
                      >
                        ✏️
                      </button>
                      <button className="btn btn-re btn-xs" onClick={e => handleDelete(product.id, e)}>
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
