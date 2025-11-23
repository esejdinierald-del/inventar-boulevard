import Layout from "@/components/Layout";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Package, ShoppingCart } from "lucide-react";

const Dashboard = () => {
  // Të dhënat nga Excel
  const xhiroProgresive = 63000;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">Pasqyra e përgjithshme e aktivitetit të kafesë</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Xhiro Progresive"
            value={`${xhiroProgresive.toLocaleString()} ALL`}
            icon={<DollarSign className="h-4 w-4" />}
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatsCard
            title="Shitje Ditore"
            value="0 ALL"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatsCard
            title="Produkte në Stok"
            value="0"
            icon={<Package className="h-4 w-4" />}
          />
          <StatsCard
            title="Furnizime Aktive"
            value="0"
            icon={<ShoppingCart className="h-4 w-4" />}
          />
        </div>

        {/* Monthly Overview */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Xhiro Mujore - Tetor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Java 1</span>
                  <span className="text-sm font-medium">0 ALL</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Java 2</span>
                  <span className="text-sm font-medium">0 ALL</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Java 3</span>
                  <span className="text-sm font-medium">0 ALL</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Java 4</span>
                  <span className="text-sm font-medium">0 ALL</span>
                </div>
                <div className="border-t pt-4 flex items-center justify-between">
                  <span className="font-medium">Total</span>
                  <span className="text-lg font-bold text-primary">{xhiroProgresive.toLocaleString()} ALL</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produktet Më të Shitura</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Kafe</span>
                  <span className="text-sm font-medium">0 copë</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Kanace</span>
                  <span className="text-sm font-medium">0 copë</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Heineken 330</span>
                  <span className="text-sm font-medium">0 copë</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Red Bull</span>
                  <span className="text-sm font-medium">0 copë</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Veprime të Shpejta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <a
                href="/daily"
                className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
              >
                <div className="rounded-full bg-primary/10 p-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Regjistro Ditën</h3>
                  <p className="text-sm text-muted-foreground">Shto të dhënat e sotme</p>
                </div>
              </a>
              <a
                href="/reports"
                className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
              >
                <div className="rounded-full bg-success/10 p-2">
                  <Package className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="font-medium">Shiko Raportet</h3>
                  <p className="text-sm text-muted-foreground">Analizo performancën</p>
                </div>
              </a>
              <a
                href="/daily"
                className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
              >
                <div className="rounded-full bg-warning/10 p-2">
                  <ShoppingCart className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <h3 className="font-medium">Menaxho Stokun</h3>
                  <p className="text-sm text-muted-foreground">Kontrollo inventarin</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
