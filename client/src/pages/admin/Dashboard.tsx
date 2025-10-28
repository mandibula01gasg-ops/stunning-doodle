import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  ShoppingCart, 
  CreditCard, 
  DollarSign, 
  Eye,
  TrendingUp,
  LogOut,
  Package,
  MessageSquare,
  FileText
} from "lucide-react";

interface Analytics {
  totalPageViews: number;
  totalOrders: number;
  totalPixGenerated: number;
  totalCardPayments: number;
  totalRevenue: number;
  conversionRate: string;
  ordersByStatus: Array<{ status: string; count: number }>;
  recentOrders: any[];
}

export function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const response = await fetch("/api/admin/analytics");
      if (response.status === 401) {
        setLocation("/admin/login");
        return;
      }
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setLocation("/admin/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center">
        <div className="text-purple-600 text-xl font-bold">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-purple-900 text-white shadow-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black">🍇 Painel Administrativo</h1>
              <p className="text-purple-200">Açaí Prime - Gerenciamento Completo</p>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-2xl"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="rounded-3xl border-4 border-blue-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-gray-700">
                Visualizações de Página
              </CardTitle>
              <Eye className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-blue-600">
                {analytics?.totalPageViews || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Total de acessos</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-4 border-green-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-gray-700">
                Total de Pedidos
              </CardTitle>
              <ShoppingCart className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-green-600">
                {analytics?.totalOrders || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Pedidos realizados</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-4 border-purple-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-gray-700">
                Pagamentos PIX
              </CardTitle>
              <CreditCard className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-purple-600">
                {analytics?.totalPixGenerated || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">QR Codes gerados</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-4 border-yellow-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-gray-700">
                Receita Total
              </CardTitle>
              <DollarSign className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-yellow-600">
                R$ {analytics?.totalRevenue?.toFixed(2).replace('.', ',') || '0,00'}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Taxa de conversão: {analytics?.conversionRate || '0'}%
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-4 border-orange-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-gray-700">
                Pagamentos Cartão
              </CardTitle>
              <CreditCard className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-orange-600">
                {analytics?.totalCardPayments || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Transações com cartão</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Button
            onClick={() => setLocation("/admin/products")}
            className="h-24 bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 rounded-3xl text-lg font-bold shadow-lg"
          >
            <Package className="mr-3 h-6 w-6" />
            Gerenciar Produtos
          </Button>

          <Button
            onClick={() => setLocation("/admin/orders")}
            className="h-24 bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 rounded-3xl text-lg font-bold shadow-lg"
          >
            <ShoppingCart className="mr-3 h-6 w-6" />
            Ver Pedidos
          </Button>

          <Button
            onClick={() => setLocation("/admin/reviews")}
            className="h-24 bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 rounded-3xl text-lg font-bold shadow-lg"
          >
            <MessageSquare className="mr-3 h-6 w-6" />
            Gerenciar Reviews
          </Button>

          <Button
            onClick={() => setLocation("/admin/transactions")}
            className="h-24 bg-gradient-to-br from-yellow-500 to-yellow-700 hover:from-yellow-600 hover:to-yellow-800 rounded-3xl text-lg font-bold shadow-lg"
          >
            <FileText className="mr-3 h-6 w-6" />
            Ver Transações
          </Button>
        </div>

        {/* Recent Orders */}
        <Card className="rounded-3xl border-4 border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-black text-gray-900">
              Pedidos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.recentOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum pedido ainda</p>
              ) : (
                analytics?.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-white rounded-2xl border-2 border-purple-100"
                  >
                    <div>
                      <p className="font-bold text-gray-900">{order.customerName}</p>
                      <p className="text-sm text-gray-600">
                        {order.items?.length || 0} itens • {order.paymentMethod === 'pix' ? 'PIX' : 'Cartão'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-green-600">
                        R$ {parseFloat(order.totalAmount).toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
