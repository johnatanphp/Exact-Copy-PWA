import { useState, useMemo } from "react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { useGetProducts, useGetCategories, useDeleteProduct, getGetProductsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetMe } from "@workspace/api-client-react";
import { Plus, Search, Edit, Trash2, PackageSearch, Image as ImageIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Catalog() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: productsData, isLoading } = useGetProducts({ 
    search: search || undefined, 
    category: categoryId !== "all" ? categoryId : undefined 
  });
  
  const { data: categories } = useGetCategories();
  const deleteProduct = useDeleteProduct();

  const isAdmin = user?.role === "admin";
  const canEdit = ["admin"].includes(user?.role || "");

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("¿Está seguro de que desea eliminar este producto?")) return;
    
    deleteProduct.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Producto eliminado", description: "El producto se ha eliminado correctamente." });
        queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "No se pudo eliminar el producto.", variant: "destructive" });
      }
    });
  };

  return (
    <SidebarLayout>
      <div className="p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Catálogo de Productos</h1>
            <p className="text-gray-500 mt-1">Gestione el inventario de productos médicos.</p>
          </div>
          
          {isAdmin && (
            <Button onClick={() => setLocation("/producto/new")} className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          )}
        </div>

        <Card className="shadow-sm border-gray-200/60">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Buscar por nombre o código..." 
                  className="pl-9 h-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-[250px]">
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories?.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full rounded-none" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : productsData?.products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg border border-dashed">
            <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <PackageSearch className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No se encontraron productos</h3>
            <p className="text-gray-500 mt-1">Intente ajustar los filtros de búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productsData?.products.map((product) => (
              <Link key={product.id} href={`/producto/${product.id}`}>
                <Card className="h-full overflow-hidden hover:shadow-md transition-shadow cursor-pointer border-gray-200/60 group">
                  <div className="h-48 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-gray-300" />
                    )}
                    <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                      <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white shadow-sm font-mono text-xs">
                        {product.code}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-primary mb-1 uppercase tracking-wider">{product.categoryName}</p>
                    <h3 className="text-base font-semibold text-gray-900 line-clamp-2 leading-tight mb-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
                      <Badge variant={product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"} 
                             className={product.stock > 10 ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : ""}>
                        Stock: {product.stock}
                      </Badge>
                    </div>
                  </CardContent>
                  {canEdit && (
                    <CardFooter className="p-4 pt-0 border-t bg-gray-50 flex justify-end gap-2 mt-auto">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.preventDefault(); setLocation(`/producto/${product.id}?edit=true`); }}>
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => handleDelete(product.id, e)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}