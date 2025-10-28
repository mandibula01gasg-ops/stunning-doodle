import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";

export function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = "/admin/dashboard";
      } else {
        setError(data.message || "Erro ao fazer login");
      }
    } catch (err) {
      setError("Erro ao conectar ao servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-3xl shadow-2xl border-4 border-purple-300">
        <CardHeader className="text-center space-y-4 pt-8">
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-4 rounded-full">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black bg-gradient-to-r from-purple-600 to-purple-900 bg-clip-text text-transparent">
            Painel Admin
          </CardTitle>
          <CardDescription className="text-lg">
            Açaí Prime - Área Administrativa
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@acaiprime.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-2xl"
              />
            </div>
            {error && (
              <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-2xl text-sm">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-6 rounded-2xl text-lg shadow-lg"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Credenciais padrão:</p>
            <p className="font-mono text-xs mt-1">admin@acaiprime.com / admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
