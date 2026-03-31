import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { 
  useGetProduct, 
  useCreateProduct, 
  useUpdateProduct, 
  useGetCategories,
  getGetProductsQueryKey,
  getGetProductQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Image as ImageIcon, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe } from "@workspace/api-client-react";

export default function ProductDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();
  
  const isNew = !id || id === "new";
  const productId = isNew ? 0 : parseInt(id);
  
  // Read ?edit=true from query string manually since wouter doesn't have useSearchParams
  const searchParams = new URLSearchParams(window.location.search);
  const initialEditMode = searchParams.get("edit") === "true";
  
  const [isEditing, setIsEditing] = useState(isNew || initialEditMode);
  
  const { data: product, isLoading: isLoadingProduct } = useGetProduct(productId, { 
    query: { enabled: !isNew, queryKey: getGetProductQueryKey(productId) } 
  });
  
  const { data: categories } = useGetCategories();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    categoryId: "",
    price: "",
    stock: "",
    image: ""
  });

  useEffect(() => {
    if (product && !isNew) {
      setFormData({
        name: product.name,
        code: product.code,
        description: product.description || "",
        categoryId: product.categoryId.toString(),
        price: product.price.toString(),
        stock: product.stock.toString(),
        image: product.image || ""
      });
    }
  }, [product, isNew]);

  const canEdit = ["admin"].includes(user?.role || "");

  if (!isNew && isLoadingProduct) {
    return (
      <SidebarLayout>
        <div className="flex h-full items-center justify-center">
          <Activity className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SidebarLayout>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name: formData.name,
      code: formData.code,
      description: formData.description,
      categoryId: parseInt(formData.categoryId),
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      image: formData.image
    };

    if (isNew) {
      createMutation.mutate({ data: payload }, {
        onSuccess: () => {
          toast({ title: "Éxito", description: "Producto creado correctamente." });
          queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
          setLocation("/catalogo");
        },
        onError: () => toast({ title: "Error", description: "No se pudo crear.", variant: "destructive" })
      });
    } else {
      updateMutation.mutate({ id: productId, data: payload }, {
        onSuccess: (data) => {
          toast({ title: "Éxito", description: "Producto actualizado." });
          queryClient.setQueryData(getGetProductQueryKey(productId), data);
          queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
          setIsEditing(false);
        },
        onError: () => toast({ title: "Error", description: "No se pudo actualizar.", variant: "destructive" })
      });
    }
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => setLocation("/catalogo")} className="-ml-4 text-gray-500">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al catálogo
        </Button>

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? "Nuevo Producto" : isEditing ? "Editar Producto" : product?.name}
          </h1>
          {!isNew && !isEditing && canEdit && (
            <Button onClick={() => setIsEditing(true)}>
              Editar
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Card className="shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2 md:col-span-1">
                      <Label htmlFor="code">Código SKU *</Label>
                      <Input 
                        id="code" 
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                        disabled={!isEditing}
                        required
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2 col-span-2 md:col-span-1">
                      <Label htmlFor="categoryId">Categoría *</Label>
                      <Select 
                        value={formData.categoryId} 
                        onValueChange={(val) => setFormData({...formData, categoryId: val})}
                        disabled={!isEditing}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="name">Nombre del Producto *</Label>
                      <Input 
                        id="name" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        disabled={!isEditing}
                        required
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea 
                        id="description" 
                        rows={5}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        disabled={!isEditing}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2 mb-4">Inventario y Precio</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Precio (USD) *</Label>
                      <Input 
                        id="price" 
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        disabled={!isEditing}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock *</Label>
                      <Input 
                        id="stock" 
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData({...formData, stock: e.target.value})}
                        disabled={!isEditing}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <Label>Imagen del Producto</Label>
                  <div className="border-2 border-dashed rounded-lg h-64 flex flex-col items-center justify-center bg-gray-50 overflow-hidden relative">
                    {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-gray-400 p-4">
                        <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Sin imagen</p>
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <div className="space-y-2">
                      <Label htmlFor="image">URL de la imagen</Label>
                      <Input 
                        id="image" 
                        value={formData.image}
                        onChange={(e) => setFormData({...formData, image: e.target.value})}
                        placeholder="https://..."
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {isEditing && (
                <div className="flex gap-4">
                  {!isNew && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setIsEditing(false);
                        if (product) {
                          setFormData({
                            name: product.name,
                            code: product.code,
                            description: product.description || "",
                            categoryId: product.categoryId.toString(),
                            price: product.price.toString(),
                            stock: product.stock.toString(),
                            image: product.image || ""
                          });
                        }
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    className="flex-1 bg-primary"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Guardar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </SidebarLayout>
  );
}