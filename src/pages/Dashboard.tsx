import Layout from "@/components/Layout";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Package, ShoppingCart, Lock, Download, ChevronLeft, ChevronRight, User, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { KitchenProductsManager } from "@/components/Dashboard/KitchenProductsManager";
import { AlcoholicDrinksManager } from "@/components/Dashboard/AlcoholicDrinksManager";
import { InvoiceMappingsTable } from "@/components/Dashboard/InvoiceMappingsTable";
import { ProductMappingsTable } from "@/components/Dashboard/ProductMappingsTable";
import { CoffeeTypesManager } from "@/components/Dashboard/CoffeeTypesManager";
import { StaffTurnPinsManager } from "@/components/Dashboard/StaffTurnPinsManager";
import { AdminSettingsCard } from "@/components/Dashboard/AdminSettingsCard";
import { ExpensesReport } from "@/components/Dashboard/ExpensesReport";
import { ProductsManager } from "@/components/Dashboard/ProductsManager";
import { FixedExpensesManager } from "@/components/Dashboard/FixedExpensesManager";
import { supabase } from "@/integrations/supabase/client";
import { TurnData } from "@/types/turn.types";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, eachWeekOfInterval, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { sq } from "date-fns/locale";
import { useManagerPermissions, ManagerPermissions } from "@/hooks/useManagerPermissions";

interface WeeklyData {
  weekLabel: string;
  xhiro: number;
  startDate: Date;
  endDate: Date;
}

interface ProductSales {
  name: string;
  quantity: number;
}

interface MonthlyData {
  totalXhiro: number;
  weeklyBreakdown: WeeklyData[];
  entries: Array<{
    entry_date: string;
    turn1_data: TurnData;
    turn2_data: TurnData;
  }>;
  topProducts: ProductSales[];
  totalCoffee: number;
  totalProductsInStock: number;
  totalExpenses: number;
}

const Dashboard = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMode, setLoginMode] = useState<'admin' | 'manager'>('admin');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({
    totalXhiro: 0,
    weeklyBreakdown: [],
    entries: [],
    topProducts: [],
    totalCoffee: 0,
    totalProductsInStock: 0,
    totalExpenses: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const { 
    verifiedUser, 
    setStaffUser, 
    setAdminUser, 
    hasPermission,
    isAdmin 
  } = useManagerPermissions();

  // Auto-unlock if user already has an admin session
  useEffect(() => {
    const checkAdminSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.is_anonymous) return;
      const { data: isAdminRole } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });
      if (isAdminRole === true) {
        setAdminUser();
        setIsUnlocked(true);
      }
    };
    checkAdminSession();
  }, [setAdminUser]);

  const handleUnlock = async () => {
    if (loginMode === 'admin') {
      if (!email || !password) {
        toast.error("Plotëso email-in dhe fjalëkalimin");
        return;
      }
      try {
        setIsAuthenticating(true);
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError || !signInData.user) {
          toast.error("Email ose fjalëkalim i pavlefshëm");
          return;
        }
        const { data: isAdminRole } = await supabase.rpc('has_role', {
          _user_id: signInData.user.id,
          _role: 'admin',
        });
        if (!isAdminRole) {
          await supabase.auth.signOut();
          toast.error("Kjo llogari nuk ka të drejta admini");
          return;
        }
        setAdminUser();
        setIsUnlocked(true);
        setPassword("");
        toast.success("Dashboard u zhbllokua si Admin");
      } catch (err) {
        console.error('Admin login error:', err);
        toast.error("Gabim gjatë hyrjes së adminit");
      } finally {
        setIsAuthenticating(false);
      }
    } else {
      // Manager PIN verification
      if (password.length !== 4) {
        toast.error("PIN duhet të jetë 4 shifra");
        return;
      }
      
      try {
        const { data, error } = await supabase
          .rpc('verify_staff_pin', { _pin: password });

        const row = Array.isArray(data) ? data[0] : data;
        if (error || !row || !row.is_manager) {
          toast.error("PIN i pavlefshëm ose nuk është menaxher");
          return;
        }

        const permissions = row.permissions as unknown as ManagerPermissions;
        
        if (!permissions.dashboard) {
          toast.error("Nuk keni të drejtë të hyni në Dashboard");
          return;
        }

        setStaffUser(row.staff_name, true, permissions);
        setIsUnlocked(true);
        toast.success(`Mirësevini, ${row.staff_name}!`);
      } catch (err) {
        console.error('Error verifying PIN:', err);
        toast.error("Gabim në verifikimin e PIN-it");
      }
    }
  };

  const goToPreviousMonth = () => setSelectedMonth(subMonths(selectedMonth, 1));
  const goToNextMonth = () => setSelectedMonth(addMonths(selectedMonth, 1));

  useEffect(() => {
    loadMonthlyData();
  }, [selectedMonth]);

  const loadMonthlyData = async () => {
    try {
      setIsLoading(true);
      
      const startDate = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');
      
      const { data: entries, error } = await supabase
        .from('daily_entries')
        .select('entry_date, turn1_data, turn2_data')
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .order('entry_date', { ascending: true });

      if (error) {
        console.error('Error loading data:', error);
        toast.error('Gabim në ngarkimin e të dhënave');
        return;
      }

      // Load expenses for the month
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('cost')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate);

      if (expensesError) {
        console.error('Error loading expenses:', expensesError);
      }

      const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.cost || 0), 0) || 0;

      // Calculate weekly breakdown
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
      
      const weeklyBreakdown: WeeklyData[] = weeks.map((weekStart, index) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const effectiveStart = weekStart < monthStart ? monthStart : weekStart;
        const effectiveEnd = weekEnd > monthEnd ? monthEnd : weekEnd;
        
        let weekXhiro = 0;
        entries?.forEach(entry => {
          const entryDate = parseISO(entry.entry_date);
          if (isWithinInterval(entryDate, { start: effectiveStart, end: effectiveEnd })) {
            const turn1 = entry.turn1_data as unknown as TurnData;
            const turn2 = entry.turn2_data as unknown as TurnData;
            weekXhiro += (turn1?.xhiro || 0) + (turn2?.xhiro || 0);
          }
        });
        
        return {
          weekLabel: `Java ${index + 1}`,
          xhiro: weekXhiro,
          startDate: effectiveStart,
          endDate: effectiveEnd
        };
      });

      // Calculate total xhiro and aggregate product sales
      let totalXhiro = 0;
      let totalCoffee = 0;
      const productSalesMap: { [key: string]: number } = {};
      let latestStockData: { [key: string]: number } = {};
      
      entries?.forEach(entry => {
        const turn1 = entry.turn1_data as unknown as TurnData;
        const turn2 = entry.turn2_data as unknown as TurnData;
        totalXhiro += (turn1?.xhiro || 0) + (turn2?.xhiro || 0);
        
        // Aggregate coffee sales
        if (turn1?.coffee) {
          Object.values(turn1.coffee).forEach(qty => {
            totalCoffee += qty || 0;
          });
        }
        if (turn2?.coffee) {
          Object.values(turn2.coffee).forEach(qty => {
            totalCoffee += qty || 0;
          });
        }
        
        // Aggregate product sales (shiriti = sold)
        if (turn1?.products) {
          Object.entries(turn1.products).forEach(([name, data]) => {
            productSalesMap[name] = (productSalesMap[name] || 0) + (data.shiriti || 0);
          });
        }
        if (turn2?.products) {
          Object.entries(turn2.products).forEach(([name, data]) => {
            productSalesMap[name] = (productSalesMap[name] || 0) + (data.shiriti || 0);
            // Keep track of latest stock (gjendje from last entry)
            latestStockData[name] = data.gjendje || 0;
          });
        }
      });
      
      // Get top 5 selling products
      const topProducts: ProductSales[] = Object.entries(productSalesMap)
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
      
      // Calculate total products in stock from latest entry
      const totalProductsInStock = Object.values(latestStockData).reduce((sum, qty) => sum + qty, 0);

      setMonthlyData({
        totalXhiro,
        weeklyBreakdown,
        entries: entries?.map(e => ({
          entry_date: e.entry_date,
          turn1_data: e.turn1_data as unknown as TurnData,
          turn2_data: e.turn2_data as unknown as TurnData
        })) || [],
        topProducts,
        totalCoffee,
        totalProductsInStock,
        totalExpenses
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gabim në ngarkimin e të dhënave');
    } finally {
      setIsLoading(false);
    }
  };

  const exportMonthlyData = () => {
    const monthName = format(selectedMonth, 'MMMM yyyy', { locale: sq });
    
    let csvContent = `Raporti Mujor - ${monthName}\n\n`;
    csvContent += `Xhiro Totale,${monthlyData.totalXhiro} ALL\n\n`;
    csvContent += `Javë,Periudha,Xhiro\n`;
    
    monthlyData.weeklyBreakdown.forEach(week => {
      const period = `${format(week.startDate, 'dd/MM')} - ${format(week.endDate, 'dd/MM')}`;
      csvContent += `${week.weekLabel},${period},${week.xhiro} ALL\n`;
    });
    
    csvContent += `\nTë dhënat Ditore\n`;
    csvContent += `Data,Turni 1 Xhiro,Turni 2 Xhiro,Total Ditor\n`;
    
    monthlyData.entries.forEach(entry => {
      const t1Xhiro = entry.turn1_data?.xhiro || 0;
      const t2Xhiro = entry.turn2_data?.xhiro || 0;
      csvContent += `${entry.entry_date},${t1Xhiro},${t2Xhiro},${t1Xhiro + t2Xhiro}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `raport-${format(selectedMonth, 'yyyy-MM')}.csv`;
    link.click();
    toast.success('Raporti u eksportua me sukses');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">Bulevard Cafe</h1>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">Pasqyra e përgjithshme e aktivitetit të kafesë</p>
        </div>

        {!isUnlocked && (
          <Card className="border-warning">
            <CardContent className="pt-6 space-y-4">
              {/* Login Mode Toggle */}
              <div className="flex gap-2 justify-center">
                <Button
                  variant={loginMode === 'admin' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setLoginMode('admin'); setPassword(''); }}
                  className="flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
                <Button
                  variant={loginMode === 'manager' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setLoginMode('manager'); setPassword(''); }}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Menaxher
                </Button>
              </div>
              
              <div className="flex items-center gap-4">
                <Lock className="h-5 w-5 text-warning" />
                <Input
                  type="password"
                  autoComplete="current-password"
                  inputMode={loginMode === 'manager' ? 'numeric' : undefined}
                  maxLength={loginMode === 'manager' ? 4 : undefined}
                  placeholder={loginMode === 'admin' ? "Fut fjalëkalimin e Admin" : "Fut PIN-in 4-shifror"}
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
        
        {/* Month Selector */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-lg font-semibold min-w-[150px] text-center capitalize">
                  {format(selectedMonth, 'MMMM yyyy', { locale: sq })}
                </span>
                <Button variant="outline" size="icon" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={exportMonthlyData} disabled={isLoading}>
                <Download className="h-4 w-4 mr-2" />
                Eksporto CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            title={`Xhiro Progresive - ${format(selectedMonth, 'MMMM', { locale: sq })}`}
            value={isLoading ? "Duke ngarkuar..." : `${monthlyData.totalXhiro.toLocaleString()} ALL`}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <StatsCard
            title="Shpenzime Mujore"
            value={isLoading ? "..." : `${monthlyData.totalExpenses.toLocaleString()} ALL`}
            icon={<ShoppingCart className="h-4 w-4" />}
          />
          <StatsCard
            title="Ditë me Regjistrime"
            value={isLoading ? "..." : `${monthlyData.entries.length}`}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatsCard
            title="Produkte në Stok"
            value={isLoading ? "..." : `${monthlyData.totalProductsInStock}`}
            icon={<Package className="h-4 w-4" />}
          />
          <StatsCard
            title="Total Kafe Shitur"
            value={isLoading ? "..." : `${monthlyData.totalCoffee} copa`}
            icon={<ShoppingCart className="h-4 w-4" />}
          />
        </div>

        {/* Monthly Overview */}
        <div className="grid gap-4 md:grid-cols-2 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Xhiro Mujore - {format(selectedMonth, 'MMMM', { locale: sq })}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyData.weeklyBreakdown.map((week, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">{week.weekLabel}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(week.startDate, 'dd/MM')} - {format(week.endDate, 'dd/MM')}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{week.xhiro.toLocaleString()} ALL</span>
                  </div>
                ))}
                <div className="border-t pt-4 flex items-center justify-between">
                  <span className="font-medium">Total</span>
                  <span className="text-lg font-bold text-primary">{monthlyData.totalXhiro.toLocaleString()} ALL</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produktet Më të Shitura - {format(selectedMonth, 'MMMM', { locale: sq })}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyData.topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nuk ka të dhëna për këtë muaj</p>
                ) : (
                  monthlyData.topProducts.map((product, index) => (
                    <div key={product.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-sm text-muted-foreground">{product.name}</span>
                      </div>
                      <span className="text-sm font-medium">{product.quantity} copë</span>
                    </div>
                  ))
                )}
                <div className="border-t pt-4 flex items-center justify-between">
                  <span className="font-medium">Total Kafe</span>
                  <span className="text-lg font-bold text-primary">{monthlyData.totalCoffee} copa</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Manager - requires 'products' permission */}
        {hasPermission('products') && <ProductsManager />}

        {/* Coffee Types Manager - requires 'products' permission */}
        {hasPermission('products') && <CoffeeTypesManager />}

        {/* Kitchen Products Manager - requires 'products' permission */}
        {hasPermission('products') && <KitchenProductsManager />}

        {/* Alcoholic Drinks Manager - requires 'products' permission */}
        {hasPermission('products') && <AlcoholicDrinksManager />}

        {/* Staff Turn PINs Manager - requires 'staff' permission */}
        {hasPermission('staff') && <StaffTurnPinsManager />}

        {/* Fixed Expenses Manager - requires 'expenses' permission */}
        {hasPermission('expenses') && <FixedExpensesManager />}

        {/* Expenses Report with Date Range - requires 'expenses' permission */}
        {hasPermission('expenses') && <ExpensesReport />}

        {/* Admin Settings - Admin only */}
        {isAdmin && <AdminSettingsCard />}

        {/* Invoice Mappings Table - Admin only */}
        {isAdmin && <InvoiceMappingsTable />}

        {/* Product Mappings Table - Admin only */}
        {isAdmin && <ProductMappingsTable />}

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
