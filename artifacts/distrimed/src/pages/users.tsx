import { useState } from "react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { 
  useGetUsers, 
  useCreateUser, 
  useDeleteUser,
  getGetUsersQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Trash2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { CreateUserRequestRole } from "@workspace/api-client-react/src/generated/api.schemas";

export default function UsersPage() {
  const { data: users, isLoading } = useGetUsers();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "viewer" as CreateUserRequestRole
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate({ data: formData }, {
      onSuccess: () => {
        toast({ title: "Éxito", description: "Usuario creado correctamente." });
        queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
        setIsOpen(false);
        setFormData({ name: "", username: "", email: "", password: "", role: "viewer" as CreateUserRequestRole });
      },
      onError: () => {
        toast({ title: "Error", description: "No se pudo crear el usuario.", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("¿Seguro que desea eliminar este usuario?")) return;
    deleteUser.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Éxito", description: "Usuario eliminado." });
        queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
      }
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-0">Administrador</Badge>;
      case "vendedor": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0">Vendedor</Badge>;
      case "viewer": return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-0">Visualizador</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <SidebarLayout>
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Usuarios</h1>
            <p className="text-gray-500 mt-1">Gestión de accesos y roles del sistema</p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Usuario</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Usuario (Login)</Label>
                    <Input id="username" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña temporal</Label>
                    <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select value={formData.role} onValueChange={(val: CreateUserRequestRole) => setFormData({...formData, role: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador (Total)</SelectItem>
                        <SelectItem value="vendedor">Vendedor (Editar Productos)</SelectItem>
                        <SelectItem value="viewer">Visualizador (Solo Lectura)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createUser.isPending}>Guardar Usuario</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="bg-gray-50/50 border-b">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Directorio de Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">Cargando usuarios...</TableCell>
                  </TableRow>
                ) : users?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">No hay usuarios registrados.</TableCell>
                  </TableRow>
                ) : (
                  users?.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-gray-500">{u.username}</TableCell>
                      <TableCell className="text-gray-500">{u.email || "-"}</TableCell>
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(u.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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