import Layout from "@/components/Layout";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Package, ShoppingCart, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { KitchenProductsManager } from "@/components/Dashboard/KitchenProductsManager";
import { AlcoholicDrinksManager } from "@/components/Dashboard/AlcoholicDrinksManager";
import { InvoiceMappingsTable } from "@/components/Dashboard/InvoiceMappingsTable";
import { supabase } from "@/integrations/supabase/client";
import { TurnData } from "@/types/turn.types";

const Dashboard = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [xhiroProgresive, setXhiroProgresive] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const handleUnlock = () => {
    if (password === "1983") {
      setIsUnlocked(true);
      toast.success("Dashboard u zhbllokua");
    } else {
      toast.error("Fjalëkalimi është i gabuar");
    }
  };

  useEffect(() => {
    loadMonthlyData();
  }, []);

  const loadMonthlyData = async () => {
    try {
      setIsLoading(true);
      
      // Merr të dhënat për muajin Tetor 2024
      const startDate = '2024-10-01';
      const endDate = '2024-10-31';
      
      const { data: entries, error } = await supabase
        .from('daily_entries')
        .select('turn1_data, turn2_data')
        .gte('entry_date', startDate)
        .lte('entry_date', endDate);

      if (error) {
        console.error('Error loading data:', error);
        toast.error('Gabim në ngarkimin e të dhënave');
        return;
      }

      // Llogarit xhiron totale
      let totalXhiro = 0;
      entries?.forEach(entry => {
        const turn1 = entry.turn1_data as unknown as TurnData;
        const turn2 = entry.turn2_data as unknown as TurnData;
        totalXhiro += (turn1?.xhiro || 0) + (turn2?.xhiro || 0);
      });

      setXhiroProgresive(totalXhiro);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gabim në ngarkimin e të dhënave');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">Pasqyra e përgjithshme e aktivitetit të kafesë</p>
        </div>

        {!isUnlocked && (
          <Card className="border-warning">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Lock className="h-5 w-5 text-warning" />
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Fut fjalëkalimin për të parë të dhënat"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                  className="flex-1"
                />
                <Button onClick={handleUnlock}>Zhblloko</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className={!isUnlocked ? "blur-sm pointer-events-none select-none" : ""}>
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Xhiro Progresive - Tetor"
            value={isLoading ? "Duke ngarkuar..." : `${xhiroProgresive.toLocaleString()} ALL`}
            icon={<DollarSign className="h-4 w-4" />}
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

        {/* Kitchen Products Manager */}
        <KitchenProductsManager />

        {/* Alcoholic Drinks Manager */}
        <AlcoholicDrinksManager />

        {/* Invoice Mappings Table */}
        <InvoiceMappingsTable />

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
      </div>
    </Layout>
  );
};

export default Dashboard;
