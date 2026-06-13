import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Loader2, Printer, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { sq } from "date-fns/locale";

interface ProductPrices {
  [key: string]: number;
}

/** Escape HTML to prevent XSS when interpolating untrusted DB strings into document.write. */
const escHtml = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const Reports = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [productPrices, setProductPrices] = useState<ProductPrices>({});
  const [coffeePrices, setCoffeePrices] = useState<ProductPrices>({});
  const [stats, setStats] = useState({
    totalSales: 0,
    avgDaily: 0,
    activeDays: 0,
    totalDays: 0,
    costOfGoodsSold: 0,
    grossProfit: 0,
    netProfit: 0
  });
  const printRef = useRef<HTMLDivElement>(null);

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
    loadPrices();
  }, []);

  useEffect(() => {
    if (Object.keys(productPrices).length > 0 || Object.keys(coffeePrices).length > 0) {
      loadMonthlyData();
    }
  }, [selectedMonth, productPrices, coffeePrices]);

  const loadPrices = async () => {
    try {
      // Load product prices
      const { data: products } = await supabase
        .from('products')
        .select('name, purchase_price');
      
      const { data: kitchenProducts } = await supabase
        .from('kitchen_products')
        .select('name, purchase_price');
      
      const { data: alcoholicDrinks } = await supabase
        .from('alcoholic_drinks_inventory')
        .select('drink_name, purchase_price');
      
      const { data: coffeeTypes } = await supabase
        .from('coffee_types')
        .select('name, purchase_price');

      const prices: ProductPrices = {};
      
      products?.forEach(p => {
        prices[p.name] = p.purchase_price || 0;
      });
      
      kitchenProducts?.forEach(p => {
        prices[p.name] = p.purchase_price || 0;
      });
      
      alcoholicDrinks?.forEach(p => {
        prices[p.drink_name] = p.purchase_price || 0;
      });

      setProductPrices(prices);

      const cPrices: ProductPrices = {};
      coffeeTypes?.forEach(c => {
        cPrices[c.name] = c.purchase_price || 0;
      });
      setCoffeePrices(cPrices);

    } catch (error) {
      console.error("Error loading prices:", error);
    }
  };

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

      // Load expenses from expenses table
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("cost")
        .gte("expense_date", format(startDate, "yyyy-MM-dd"))
        .lte("expense_date", format(endDate, "yyyy-MM-dd"));

      if (expensesError) throw expensesError;

      const expensesTableTotal = expensesData?.reduce((sum, exp) => sum + Number(exp.cost), 0) || 0;
      
      // Also calculate expenses from daily entries (turn1_data.shpenzime + turn2_data.shpenzime)
      let dailyExpensesTotal = 0;
      data?.forEach((entry: any) => {
        const t1Shpenzime = entry.turn1_data?.shpenzime || [];
        const t2Shpenzime = entry.turn2_data?.shpenzime || [];
        
        t1Shpenzime.forEach((sh: { vlera: number }) => {
          dailyExpensesTotal += Number(sh.vlera) || 0;
        });
        t2Shpenzime.forEach((sh: { vlera: number }) => {
          dailyExpensesTotal += Number(sh.vlera) || 0;
        });
      });
      
      const totalExpensesCalc = expensesTableTotal + dailyExpensesTotal;
      setTotalExpenses(totalExpensesCalc);

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

      // Calculate stats and cost of goods sold
      const totalSales = processedData.reduce((sum, d) => sum + d.sales, 0);
      const activeDays = processedData.filter(d => d.sales > 0).length;
      const avgDaily = activeDays > 0 ? totalSales / activeDays : 0;

      // Calculate cost of goods sold based on products sold
      const { costOfGoodsSold, productsWithCost } = calculateCostOfGoodsSold(data);

      const grossProfit = totalSales - costOfGoodsSold;
      const netProfit = grossProfit - totalExpensesCalc;

      setStats({
        totalSales,
        avgDaily,
        activeDays,
        totalDays: daysInMonth,
        costOfGoodsSold,
        grossProfit,
        netProfit
      });

      // Calculate top products with cost
      calculateTopProducts(data, activeDays, productsWithCost);
    } catch (error) {
      console.error("Error loading monthly data:", error);
      toast.error("Gabim në ngarkimin e të dhënave");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCostOfGoodsSold = (entries: any[]) => {
    let totalCost = 0;
    const productsWithCost: { [key: string]: { quantity: number; cost: number } } = {};

    entries?.forEach((entry: any) => {
      [entry.turn1_data, entry.turn2_data].forEach((turnData: any) => {
        // Calculate cost for regular products
        if (turnData?.products) {
          Object.entries(turnData.products).forEach(([productName, productData]: [string, any]) => {
            const shiriti = productData.shiriti || 0;
            const purchasePrice = productPrices[productName] || 0;
            const cost = shiriti * purchasePrice;
            totalCost += cost;

            if (!productsWithCost[productName]) {
              productsWithCost[productName] = { quantity: 0, cost: 0 };
            }
            productsWithCost[productName].quantity += shiriti;
            productsWithCost[productName].cost += cost;
          });
        }
        
        // Calculate cost for coffee
        if (turnData?.coffee) {
          Object.entries(turnData.coffee).forEach(([coffeeType, quantity]: [string, any]) => {
            const qty = typeof quantity === 'number' ? quantity : 0;
            const purchasePrice = coffeePrices[coffeeType] || 0;
            const cost = qty * purchasePrice;
            totalCost += cost;

            const key = `Kafe: ${coffeeType}`;
            if (!productsWithCost[key]) {
              productsWithCost[key] = { quantity: 0, cost: 0 };
            }
            productsWithCost[key].quantity += qty;
            productsWithCost[key].cost += cost;
          });
        }
      });
    });

    return { costOfGoodsSold: totalCost, productsWithCost };
  };

  const calculateTopProducts = (entries: any[], activeDays: number, productsWithCost: { [key: string]: { quantity: number; cost: number } }) => {
    const sorted = Object.entries(productsWithCost)
      .map(([name, data]) => ({ 
        name, 
        quantity: data.quantity,
        cost: data.cost,
        avgDaily: activeDays > 0 ? data.quantity / activeDays : 0
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 15);

    setTopProducts(sorted);
  };

  // Generate month options for the last 6 months
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy", { locale: sq })
    };
  });

  const handlePrint = () => {
    const printContent = document.getElementById('print-report');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Lejo popup-et për të printuar');
      return;
    }

    const monthLabel = monthOptions.find(o => o.value === selectedMonth)?.label || selectedMonth;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Raport Financiar - ${monthLabel}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          * { box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            font-size: 11px; 
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .header h1 { 
            font-size: 20px; 
            margin: 0 0 5px 0;
            color: #1a1a1a;
          }
          .header .subtitle { 
            font-size: 14px; 
            color: #666;
          }
          .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 10px; 
            margin-bottom: 20px;
          }
          .summary-box { 
            border: 1px solid #ddd; 
            padding: 10px; 
            text-align: center;
            border-radius: 4px;
          }
          .summary-box.highlight { 
            background: #f0f9ff; 
            border-color: #0284c7;
          }
          .summary-box.profit { 
            background: #f0fdf4; 
            border-color: #16a34a;
          }
          .summary-box.expense { 
            background: #fef2f2; 
            border-color: #dc2626;
          }
          .summary-label { 
            font-size: 9px; 
            color: #666; 
            text-transform: uppercase;
            margin-bottom: 3px;
          }
          .summary-value { 
            font-size: 14px; 
            font-weight: bold;
          }
          .summary-value.profit { color: #16a34a; }
          .summary-value.expense { color: #dc2626; }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 15px;
            font-size: 10px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 6px 8px; 
            text-align: left; 
          }
          th { 
            background: #f5f5f5; 
            font-weight: 600;
            font-size: 9px;
            text-transform: uppercase;
          }
          .text-right { text-align: right; }
          .section-title { 
            font-size: 13px; 
            font-weight: bold; 
            margin: 15px 0 8px 0;
            padding-bottom: 5px;
            border-bottom: 1px solid #eee;
          }
          .footer { 
            margin-top: 20px; 
            text-align: center; 
            font-size: 9px; 
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 10px;
          }
          .total-row { 
            background: #f9f9f9; 
            font-weight: bold;
          }
          .formula {
            background: #f8fafc;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
            font-size: 10px;
          }
          .formula-line {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
          }
          .formula-line.total {
            border-top: 1px solid #ddd;
            margin-top: 5px;
            padding-top: 8px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BULEVARD CAFE</h1>
          <div class="subtitle">Raport Financiar - ${monthLabel}</div>
        </div>

        <div class="summary-grid">
          <div class="summary-box highlight">
            <div class="summary-label">Xhiro Totale</div>
            <div class="summary-value">${stats.totalSales.toLocaleString()} ALL</div>
          </div>
          <div class="summary-box">
            <div class="summary-label">Kosto Produkteve</div>
            <div class="summary-value">${stats.costOfGoodsSold.toLocaleString()} ALL</div>
          </div>
          <div class="summary-box expense">
            <div class="summary-label">Shpenzime</div>
            <div class="summary-value expense">${totalExpenses.toLocaleString()} ALL</div>
          </div>
          <div class="summary-box">
            <div class="summary-label">Fitimi Bruto</div>
            <div class="summary-value">${stats.grossProfit.toLocaleString()} ALL</div>
          </div>
          <div class="summary-box profit">
            <div class="summary-label">Fitimi Neto</div>
            <div class="summary-value profit">${stats.netProfit.toLocaleString()} ALL</div>
          </div>
          <div class="summary-box">
            <div class="summary-label">Ditë Aktive</div>
            <div class="summary-value">${stats.activeDays} / ${stats.totalDays}</div>
          </div>
        </div>

        <div class="formula">
          <div class="formula-line">
            <span>Xhiro Totale:</span>
            <span>${stats.totalSales.toLocaleString()} ALL</span>
          </div>
          <div class="formula-line">
            <span>- Kosto e Produkteve të Shitura:</span>
            <span>${stats.costOfGoodsSold.toLocaleString()} ALL</span>
          </div>
          <div class="formula-line">
            <span>= Fitimi Bruto:</span>
            <span>${stats.grossProfit.toLocaleString()} ALL</span>
          </div>
          <div class="formula-line">
            <span>- Shpenzime Operative:</span>
            <span>${totalExpenses.toLocaleString()} ALL</span>
          </div>
          <div class="formula-line total">
            <span>= FITIMI NETO:</span>
            <span style="color: ${stats.netProfit >= 0 ? '#16a34a' : '#dc2626'}">${stats.netProfit.toLocaleString()} ALL</span>
          </div>
        </div>

        <div class="section-title">Produktet e Shitura</div>
        <table>
          <thead>
            <tr>
              <th>Produkti</th>
              <th class="text-right">Sasia</th>
              <th class="text-right">Kosto Totale</th>
              <th class="text-right">Mesatare/Ditë</th>
            </tr>
          </thead>
          <tbody>
            ${topProducts.map(p => `
              <tr>
                <td>${p.name}</td>
                <td class="text-right">${p.quantity}</td>
                <td class="text-right">${p.cost.toLocaleString()} ALL</td>
                <td class="text-right">${p.avgDaily.toFixed(1)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="section-title">Shitjet Ditore</div>
        <table>
          <thead>
            <tr>
              <th>Dita</th>
              <th class="text-right">Turni 1</th>
              <th class="text-right">Turni 2</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${monthlyData.filter(d => d.sales > 0).map(d => `
              <tr>
                <td>${d.day}</td>
                <td class="text-right">${d.t1.toLocaleString()} ALL</td>
                <td class="text-right">${d.t2.toLocaleString()} ALL</td>
                <td class="text-right">${d.sales.toLocaleString()} ALL</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td>TOTALI</td>
              <td class="text-right">${monthlyData.reduce((s, d) => s + d.t1, 0).toLocaleString()} ALL</td>
              <td class="text-right">${monthlyData.reduce((s, d) => s + d.t2, 0).toLocaleString()} ALL</td>
              <td class="text-right">${stats.totalSales.toLocaleString()} ALL</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          Gjeneruar më ${format(new Date(), 'dd/MM/yyyy HH:mm')} | Bulevard Cafe Management System
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Raporte Financiare</h2>
            <p className="text-muted-foreground">Statistika, fitimi dhe analiza e shitjeve</p>
          </div>
          <div className="flex items-center gap-2">
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
            <Button onClick={handlePrint} variant="outline" disabled={isLoading}>
              <Printer className="h-4 w-4 mr-2" />
              Print A4
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div id="print-report">

        {/* Main Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Xhiro Totale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.totalSales.toLocaleString()} ALL
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Kosto Produkteve</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.costOfGoodsSold.toLocaleString()} ALL
              </div>
              <p className="text-xs text-muted-foreground">Kosto e artikujve të shitur</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fitimi Bruto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.grossProfit.toLocaleString()} ALL
              </div>
              <p className="text-xs text-muted-foreground">Xhiro - Kosto</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Shpenzime</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {totalExpenses.toLocaleString()} ALL
              </div>
              <p className="text-xs text-muted-foreground">Shpenzime operative</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-950/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fitimi Neto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {stats.netProfit.toLocaleString()} ALL
              </div>
              <p className="text-xs text-muted-foreground">Bruto - Shpenzime</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ditë Aktive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.activeDays} / {stats.totalDays}
              </div>
              <p className="text-xs text-muted-foreground">Mesatare: {Math.round(stats.avgDaily).toLocaleString()} ALL/ditë</p>
            </CardContent>
          </Card>
        </div>

        {/* Profit Formula Card */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Rezyme e Fitimit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b">
                <span>Xhiro Totale (Shitjet)</span>
                <span className="font-medium">{stats.totalSales.toLocaleString()} ALL</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-orange-600">− Kosto e Produkteve të Shitura</span>
                <span className="font-medium text-orange-600">{stats.costOfGoodsSold.toLocaleString()} ALL</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b bg-blue-50 dark:bg-blue-950/30 px-2 -mx-2 rounded">
                <span className="font-medium text-blue-600">= Fitimi Bruto</span>
                <span className="font-bold text-blue-600">{stats.grossProfit.toLocaleString()} ALL</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-destructive">− Shpenzime Operative</span>
                <span className="font-medium text-destructive">{totalExpenses.toLocaleString()} ALL</span>
              </div>
              <div className={`flex justify-between items-center py-3 px-2 -mx-2 rounded ${stats.netProfit >= 0 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                <span className={`font-bold text-lg ${stats.netProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>= FITIMI NETO</span>
                <span className={`font-bold text-xl ${stats.netProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>{stats.netProfit.toLocaleString()} ALL</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Data */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Të Dhëna Ditore - {format(parseISO(selectedMonth + "-01"), "MMMM yyyy", { locale: sq })}</CardTitle>
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

        {/* Top Products with Cost */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Produktet e Shitura (me Kosto)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produkti</TableHead>
                    <TableHead>Sasia</TableHead>
                    <TableHead>Kosto Totale</TableHead>
                    <TableHead>Mesatarja Ditore</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.length > 0 ? (
                    topProducts.map((product, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.quantity} copë</TableCell>
                        <TableCell className="text-orange-600">{product.cost.toLocaleString()} ALL</TableCell>
                        <TableCell>{product.avgDaily.toFixed(1)} copë/ditë</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Nuk ka të dhëna
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-bold">TOTALI KOSTO</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="font-bold text-orange-600">
                      {stats.costOfGoodsSold.toLocaleString()} ALL
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        </div>
        )}
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
