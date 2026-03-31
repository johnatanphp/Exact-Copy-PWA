import { useState } from "react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { useGetCategories, useCreateCategory, getGetCategoriesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tags, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe } from "@workspace/api-client-react";

export default function Categories() {
  const { data: categories, isLoading } = useGetCategories();
  const createCategory = useCreateCategory();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();
  const isAdmin = user?.role === "admin";

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCategory.mutate({ data: formData }, {
      onSuccess: () => {
        toast({ title: "Éxito", description: "Categoría creada correctamente." });
        queryClient.invalidateQueries({ queryKey: getGetCategoriesQueryKey() });
        setIsOpen(false);
        setFormData({ name: "", description: "" });
      },
      onError: () => {
        toast({ title: "Error", description: "No se pudo crear la categoría.", variant: "destructive" });
      }
    });
  };

  return (
    <SidebarLayout>
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Categorías</h1>
            <p className="text-gray-500 mt-1">Gestión de familias de productos</p>
          </div>
          
          {isAdmin && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Categoría
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Categoría</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input 
                      id="name" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea 
                      id="description" 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={createCategory.isPending}>Guardar</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="shadow-sm">
          <CardHeader className="bg-gray-50/50 border-b">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Tags className="h-5 w-5 text-primary" />
              Listado de Categorías
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Descripción</TableHead>
                  <TableHead className="text-right">Productos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">Cargando categorías...</TableCell>
                  </TableRow>
                ) : categories?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">No hay categorías registradas.</TableCell>
                  </TableRow>
                ) : (
                  categories?.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium text-gray-500">#{cat.id}</TableCell>
                      <TableCell className="font-semibold text-gray-900">{cat.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-gray-500 truncate max-w-xs">{cat.description || "-"}</TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                          {cat.productCount || 0}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}