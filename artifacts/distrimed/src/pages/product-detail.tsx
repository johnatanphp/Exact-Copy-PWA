import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import {
  useGetProduct,
  useCreateProduct,
  useUpdateProduct,
  useGetCategories,
  getGetProductsQueryKey,
  getGetProductQueryKey,
  useGetMe,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function ProductDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();

  const isNew = !id || id === "new";
  const productId = isNew ? 0 : parseInt(id);

  const searchParams = new URLSearchParams(window.location.search);
  const initialEditMode = searchParams.get("edit") === "true";

  const [isEditing, setIsEditing] = useState(isNew || initialEditMode);
  const [alert, setAlert] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const { data: product, isLoading } = useGetProduct(productId, {
    query: { enabled: !isNew, queryKey: getGetProductQueryKey(productId) },
  });
  const { data: categories } = useGetCategories();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const [formData, setFormData] = useState({
    name: "", code: "", description: "", categoryId: "",
    price: "", stock: "", image: "",
  });

  useEffect(() => {
    if (product && !isNew) {
      setFormData({
        name: product.name, code: product.code,
        description: product.description || "",
        categoryId: product.categoryId.toString(),
        price: product.price.toString(), stock: product.stock.toString(),
        image: product.image || "",
      });
    }
  }, [product, isNew]);

  const canEdit = user?.role === "admin";

  const showAlert = (type: "ok" | "err", msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name, code: formData.code, description: formData.description,
      categoryId: parseInt(formData.categoryId),
      price: parseFloat(formData.price), stock: parseInt(formData.stock),
      image: formData.image,
    };

    if (isNew) {
      createMutation.mutate({ data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
          setLocation("/catalogo");
        },
        onError: () => showAlert("err", "No se pudo crear el producto"),
      });
    } else {
      updateMutation.mutate({ id: productId, data: payload }, {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetProductQueryKey(productId), data);
          queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
          setIsEditing(false);
          showAlert("ok", "Producto actualizado correctamente");
        },
        onError: () => showAlert("err", "No se pudo actualizar el producto"),
      });
    }
  };

  if (!isNew && isLoading) {
    return (
      <SidebarLayout>
        <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>🔬</div>
            <div style={{ fontFamily: "var(--cond)", fontSize: ".85rem", color: "var(--t2)", letterSpacing: ".08em" }}>CARGANDO...</div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const stockNum = parseInt(formData.stock) || 0;
  const stockColor = stockNum === 0 ? "var(--re)" : stockNum <= 10 ? "var(--ye)" : "var(--gr)";
  const stockLabel = stockNum === 0 ? "Agotado" : stockNum <= 10 ? "Stock bajo" : "En stock";

  return (
    <SidebarLayout>
      <div className="page-wrap" style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button className="btn btn-sec btn-sm" onClick={() => setLocation("/catalogo")}>
            ← Catálogo
          </button>
          <div>
            <h1 className="page-title">
              {isNew ? "Nuevo Producto" : isEditing ? "Editar Producto" : product?.name}
            </h1>
            {!isNew && product && (
              <div style={{ fontSize: ".78rem", color: "var(--t2)", fontFamily: "var(--mono)", marginTop: 2 }}>
                {product.code} · {product.categoryName}
              </div>
            )}
          </div>
          {!isNew && !isEditing && canEdit && (
            <button className="btn btn-cy btn-sm" style={{ marginLeft: "auto" }} onClick={() => setIsEditing(true)}>
              ✏️ Editar
            </button>
          )}
        </div>

        {alert && (
          <div className={`alert ${alert.type === "ok" ? "al-ok" : "al-err"}`}>{alert.msg}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>
            {/* Left column */}
            <div>
              <div className="card" style={{ marginBottom: 14 }}>
                <div style={{
                  fontFamily: "var(--cond)", fontSize: ".75rem", fontWeight: 700,
                  color: "var(--t2)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14,
                }}>
                  INFORMACIÓN BÁSICA
                </div>
                <div className="fg-row">
                  <div className="fg">
                    <label>Código SKU *</label>
                    <input
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value })}
                      disabled={!isEditing}
                      required
                      placeholder="DM-001"
                      style={{ fontFamily: "var(--mono)" }}
                    />
                  </div>
                  <div className="fg">
                    <label>Categoría *</label>
                    <select
                      value={formData.categoryId}
                      onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                      disabled={!isEditing}
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {categories?.map(c => (
                        <option key={c.id} value={c.id.toString()}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="fg">
                  <label>Nombre del Producto *</label>
                  <input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    required
                    placeholder="Ej: Tensiómetro Digital"
                  />
                </div>
                <div className="fg">
                  <label>Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    disabled={!isEditing}
                    rows={4}
                    placeholder="Descripción detallada del producto médico..."
                  />
                </div>
              </div>

              <div className="card">
                <div style={{
                  fontFamily: "var(--cond)", fontSize: ".75rem", fontWeight: 700,
                  color: "var(--t2)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14,
                }}>
                  INVENTARIO Y PRECIO
                </div>
                <div className="fg-row">
                  <div className="fg">
                    <label>Precio (USD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      disabled={!isEditing}
                      required
                      placeholder="0.00"
                      style={{ fontFamily: "var(--mono)" }}
                    />
                  </div>
                  <div className="fg">
                    <label>Stock *</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={e => setFormData({ ...formData, stock: e.target.value })}
                      disabled={!isEditing}
                      required
                      placeholder="0"
                      style={{ fontFamily: "var(--mono)", color: stockColor }}
                    />
                  </div>
                </div>
                {!isNew && formData.stock && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className={`badge ${stockNum === 0 ? "b-re" : stockNum <= 10 ? "b-warn" : "b-ok"}`}>
                      {stockLabel}
                    </span>
                    <span style={{ fontFamily: "var(--mono)", color: stockColor, fontSize: ".85rem" }}>
                      {stockNum} unidades
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div>
              <div className="card" style={{ marginBottom: 14 }}>
                <div style={{
                  fontFamily: "var(--cond)", fontSize: ".75rem", fontWeight: 700,
                  color: "var(--t2)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12,
                }}>
                  IMAGEN
                </div>
                <div style={{
                  height: 180,
                  background: "linear-gradient(135deg,var(--bg3),var(--bg4))",
                  border: "1px solid var(--bd)",
                  borderRadius: "var(--r)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  marginBottom: 10,
                  fontSize: "4rem",
                }}>
                  {formData.image ? (
                    <img src={formData.image} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : "💊"}
                </div>
                {isEditing && (
                  <div className="fg">
                    <label>URL de imagen</label>
                    <input
                      value={formData.image}
                      onChange={e => setFormData({ ...formData, image: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                )}
              </div>

              {/* Quick stats for existing products */}
              {!isNew && product && (
                <div className="card" style={{ marginBottom: 14 }}>
                  <div style={{
                    fontFamily: "var(--cond)", fontSize: ".75rem", fontWeight: 700,
                    color: "var(--t2)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12,
                  }}>
                    DETALLES
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      ["ID", `#${product.id}`],
                      ["Código", product.code],
                      ["Categoría", product.categoryName],
                      ["Precio", `$${product.price.toFixed(2)}`],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: ".82rem" }}>
                        <span style={{ color: "var(--t2)", fontFamily: "var(--cond)", fontWeight: 700, textTransform: "uppercase", fontSize: ".7rem" }}>{k}</span>
                        <span style={{ fontFamily: "var(--mono)", color: "var(--cy)" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isEditing && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button
                    type="submit"
                    className="btn btn-cy w-full"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Guardando..."
                      : isNew ? "💾 Crear Producto" : "💾 Guardar Cambios"}
                  </button>
                  {!isNew && (
                    <button
                      type="button"
                      className="btn btn-sec w-full"
                      onClick={() => {
                        setIsEditing(false);
                        if (product) {
                          setFormData({
                            name: product.name, code: product.code,
                            description: product.description || "",
                            categoryId: product.categoryId.toString(),
                            price: product.price.toString(),
                            stock: product.stock.toString(),
                            image: product.image || "",
                          });
                        }
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </SidebarLayout>
  );
}
