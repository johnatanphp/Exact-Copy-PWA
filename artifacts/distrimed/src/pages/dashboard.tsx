import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Tags, Users, AlertTriangle, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { useGetCategories } from "@workspace/api-client-react";

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: categories, isLoading: isCategoriesLoading } = useGetCategories();

  const COLORS = ['#0d6efd', '#20c997', '#198754', '#ffc107', '#ffc107', '#fd7e14', '#dc3545'];

  return (
    <SidebarLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Resumen general del sistema DistriMed</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard 
            title="Total Productos" 
            value={summary?.totalProducts} 
            icon={Package} 
            loading={isSummaryLoading} 
            color="text-blue-600"
            bgColor="bg-blue-100"
          />
          <StatsCard 
            title="Categorías" 
            value={summary?.totalCategories} 
            icon={Tags} 
            loading={isSummaryLoading}
            color="text-emerald-600"
            bgColor="bg-emerald-100"
          />
          <StatsCard 
            title="Alertas de Stock" 
            value={summary?.lowStockProducts} 
            icon={AlertTriangle} 
            loading={isSummaryLoading}
            color="text-red-600"
            bgColor="bg-red-100"
          />
          <StatsCard 
            title="Usuarios Activos" 
            value={summary?.totalUsers} 
            icon={Users} 
            loading={isSummaryLoading}
            color="text-indigo-600"
            bgColor="bg-indigo-100"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-1 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Productos por Categoría</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              {isCategoriesLoading ? (
                <Activity className="h-8 w-8 animate-spin text-primary/50" />
              ) : categories && categories.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories.filter(c => (c.productCount || 0) > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="productCount"
                      nameKey="name"
                    >
                      {categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} productos`, 'Cantidad']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500">No hay datos suficientes</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
}

function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  loading,
  color,
  bgColor
}: { 
  title: string; 
  value?: number; 
  icon: React.ElementType;
  loading: boolean;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="shadow-sm border-gray-200/60">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`p-3 rounded-full ${bgColor}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : (
            <h3 className="text-2xl font-bold tracking-tight text-gray-900">{value || 0}</h3>
          )}
        </div>
      </CardContent>
    </Card>
  );
}