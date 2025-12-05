import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";

const Reports = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [stats, setStats] = useState({
    totalSales: 0,
    avgDaily: 0,
    activeDays: 0,
    totalDays: 0
  });

  const handleUnlock = () => {
    const secretPassword = "23061983";
    if (password === "1983" || password === secretPassword) {
      setIsUnlocked(true);
      toast.success("Raportet u zhbllokuan");
    } else {
      toast.error("Fjalëkalimi është i gabuar");
    }
  };

  useEffect(() => {
    loadMonthlyData();
  }, [selectedMonth]);

  const loadMonthlyData = async () => {
    try {
      setIsLoading(true);
      const [year, month] = selectedMonth.split("-");
      const startDate = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
      const endDate = endOfMonth(startDate);

      // Load daily entries
      const { data, error } = await supabase
        .from("daily_entries")
        .select("*")
        .gte("entry_date", format(startDate, "yyyy-MM-dd"))
        .lte("entry_date", format(endDate, "yyyy-MM-dd"))
        .order("entry_date", { ascending: true });

      if (error) throw error;

      // Load expenses for the same period
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("cost")
        .gte("expense_date", format(startDate, "yyyy-MM-dd"))
        .lte("expense_date", format(endDate, "yyyy-MM-dd"));

      if (expensesError) throw expensesError;

      const expensesTotal = expensesData?.reduce((sum, exp) => sum + exp.cost, 0) || 0;
      setTotalExpenses(expensesTotal);

      // Process data
      const daysInMonth = endDate.getDate();
      const dailyMap = new Map();
      
      data?.forEach((entry: any) => {
        const day = parseISO(entry.entry_date).getDate();
        const t1Xhiro = entry.turn1_data?.xhiro || 0;
        const t2Xhiro = entry.turn2_data?.xhiro || 0;
        dailyMap.set(day, {
          day,
          date: entry.entry_date,
          t1: t1Xhiro,
          t2: t2Xhiro,
          sales: t1Xhiro + t2Xhiro
        });
      });

      // Fill missing days
      const processedData = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        return dailyMap.get(day) || { day, t1: 0, t2: 0, sales: 0 };
      });

      setMonthlyData(processedData);

      // Calculate stats
      const totalSales = processedData.reduce((sum, d) => sum + d.sales, 0);
      const activeDays = processedData.filter(d => d.sales > 0).length;
      const avgDaily = activeDays > 0 ? totalSales / activeDays : 0;

      setStats({
        totalSales,
        avgDaily,
        activeDays,
        totalDays: daysInMonth
      });

      // Calculate top products
      calculateTopProducts(data);
    } catch (error) {
      console.error("Error loading monthly data:", error);
      toast.error("Gabim në ngarkimin e të dhënave");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTopProducts = (entries: any[]) => {
    const productTotals = new Map();

    entries?.forEach((entry: any) => {
      [entry.turn1_data, entry.turn2_data].forEach((turnData: any) => {
        // Count regular products
        if (turnData?.products) {
          Object.entries(turnData.products).forEach(([productName, productData]: [string, any]) => {
            const shiriti = productData.shiriti || 0;
            const current = productTotals.get(productName) || 0;
            productTotals.set(productName, current + shiriti);
          });
        }
        
        // Count coffee types
        if (turnData?.coffeeTypes) {
          Object.entries(turnData.coffeeTypes).forEach(([coffeeName, coffeeData]: [string, any]) => {
            const shiriti = coffeeData.shiriti || 0;
            const current = productTotals.get(coffeeName) || 0;
            productTotals.set(coffeeName, current + shiriti);
          });
        }
      });
    });

    const sorted = Array.from(productTotals.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    setTopProducts(sorted);
  };

  // Generate month options for the last 6 months
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy")
    };
  });

  return (
    <Layout>
      <div className="space-y-6">
        {!isUnlocked && (
          <Card className="border-warning">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Lock className="h-5 w-5 text-warning" />
                <Input
                  type="password"
                  placeholder="Fut fjalëkalimin për të parë raportet"
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Raporte</h2>
            <p className="text-muted-foreground">Statistika dhe analiza e shitjeve</p>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Zgjidh muajin" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Xhiro Totale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.totalSales.toLocaleString()} ALL
              </div>
              <p className="text-xs text-muted-foreground">Total për muajin</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Shpenzime</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {totalExpenses.toLocaleString()} ALL
              </div>
              <p className="text-xs text-muted-foreground">Furnizime & shpenzime</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Fitim</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {(stats.totalSales - totalExpenses).toLocaleString()} ALL
              </div>
              <p className="text-xs text-muted-foreground">Xhiro - Shpenzime</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Mesatarja Ditore</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {Math.round(stats.avgDaily).toLocaleString()} ALL
              </div>
              <p className="text-xs text-muted-foreground">Bazuar në ditët aktive</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Ditë Aktive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.activeDays} / {stats.totalDays}
              </div>
              <p className="text-xs text-muted-foreground">Ditë me regjistrime</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Të Dhëna Ditore - {format(parseISO(selectedMonth + "-01"), "MMMM yyyy")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Turni 1</TableHead>
                    <TableHead>Turni 2</TableHead>
                    <TableHead>Total Ditore</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((day) => (
                    <TableRow key={day.day} className={day.sales === 0 ? "opacity-40" : ""}>
                      <TableCell className="font-medium">{day.day}</TableCell>
                      <TableCell>{day.t1.toLocaleString()} ALL</TableCell>
                      <TableCell>{day.t2.toLocaleString()} ALL</TableCell>
                      <TableCell className="font-medium">{day.sales.toLocaleString()} ALL</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-bold">TOTALI</TableCell>
                    <TableCell className="font-bold">
                      {monthlyData.reduce((sum, d) => sum + d.t1, 0).toLocaleString()} ALL
                    </TableCell>
                    <TableCell className="font-bold">
                      {monthlyData.reduce((sum, d) => sum + d.t2, 0).toLocaleString()} ALL
                    </TableCell>
                    <TableCell className="font-bold text-primary">
                      {stats.totalSales.toLocaleString()} ALL
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produktet Më të Shitura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produkti</TableHead>
                    <TableHead>Sasia (Shiriti)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.length > 0 ? (
                    topProducts.map((product, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.quantity} copë</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        Nuk ka të dhëna
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        </>
        )}
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
