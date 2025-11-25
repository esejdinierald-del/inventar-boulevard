import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Camera } from "lucide-react";
import { format } from "date-fns";
import { useProductList } from "@/hooks/useProductList";
import { useKitchenProducts } from "@/hooks/useKitchenProducts";
import { useAlcoholicDrinksList } from "@/hooks/useAlcoholicDrinksList";
import { InvoiceMappingManager } from "@/components/InvoiceMappingManager";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Expense {
  id: string;
  expense_date: string;
  product_name: string;
  cost: number;
  notes: string | null;
  category: 'kitchen' | 'drink';
  created_at: string;
}

const Expenses = () => {
  const { toast } = useToast();
  const { products, coffeeTypes } = useProductList();
  const { kitchenProducts } = useKitchenProducts();
  const { alcoholicDrinks } = useAlcoholicDrinksList();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScanningInvoice, setIsScanningInvoice] = useState(false);
  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [isShowingScannedData, setIsShowingScannedData] = useState(false);
  
  // Form state
  const [expenseDate, setExpenseDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [productName, setProductName] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isUnlocked) {
      loadExpenses();
    }
  }, [isUnlocked]);

  const handleUnlock = () => {
    if (password === "1983") {
      setIsUnlocked(true);
      toast({ title: "Qasje e autorizuar" });
    } else {
      toast({
        title: "Fjalëkalim i gabuar",
        variant: "destructive",
      });
    }
  };

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false });

      if (error) throw error;
      setExpenses((data || []) as Expense[]);
    } catch (error) {
      console.error("Error loading expenses:", error);
      toast({
        title: "Gabim në ngarkimin e të dhënave",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningInvoice(true);
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        const { data, error } = await supabase.functions.invoke("analyze-invoice", {
          body: { imageBase64: base64Image },
        });

        if (error) throw error;

        if (data.success && data.data) {
          const { date, items } = data.data;
          setExpenseDate(date || format(new Date(), "yyyy-MM-dd"));
          setScannedItems(items || []);
          setIsShowingScannedData(true);
          toast({ 
            title: "Fatura u skanua me sukses!", 
            description: `U gjetën ${items?.length || 0} produkte` 
          });
        } else {
          throw new Error(data.error || "Gabim në skanimin e faturës");
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error scanning invoice:", error);
      toast({
        title: "Gabim në skanimin e faturës",
        description: error instanceof Error ? error.message : "Provoni përsëri",
        variant: "destructive",
      });
    } finally {
      setIsScanningInvoice(false);
    }
  };

  const handleSaveScannedItems = async () => {
    if (scannedItems.length === 0) return;

    try {
      const expensesToInsert = scannedItems.map(item => ({
        expense_date: expenseDate,
        product_name: item.name,
        cost: item.price,
        category: item.category || 'drink',
        notes: item.quantity > 1 ? `Sasia: ${item.quantity}` : null,
      }));

      const { error } = await supabase.from("expenses").insert(expensesToInsert);

      if (error) throw error;

      toast({ 
        title: "Shpenzimet u regjistruan", 
        description: `${scannedItems.length} produkte u shtuan` 
      });
      
      setScannedItems([]);
      setIsShowingScannedData(false);
      setExpenseDate(format(new Date(), "yyyy-MM-dd"));
      loadExpenses();
    } catch (error) {
      console.error("Error saving scanned items:", error);
      toast({
        title: "Gabim në regjistrimin e shpenzimeve",
        variant: "destructive",
      });
    }
  };

  const handleAddExpense = async () => {
    if (!productName || !cost || parseFloat(cost) <= 0) {
      toast({
        title: "Plotëso të gjitha fushat",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("expenses").insert({
        expense_date: expenseDate,
        product_name: productName,
        cost: parseFloat(cost),
        notes: notes || null,
      });

      if (error) throw error;

      toast({ title: "Shpenzimi u regjistrua" });
      
      // Reset form
      setProductName("");
      setCost("");
      setNotes("");
      setExpenseDate(format(new Date(), "yyyy-MM-dd"));
      setIsDialogOpen(false);
      
      loadExpenses();
    } catch (error) {
      console.error("Error adding expense:", error);
      toast({
        title: "Gabim në regjistrimin e shpenzimit",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Jeni të sigurt që dëshironi ta fshini këtë shpenzim?")) return;

    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);

      if (error) throw error;

      toast({ title: "Shpenzimi u fshi" });
      loadExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Gabim në fshirjen e shpenzimit",
        variant: "destructive",
      });
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.cost, 0);

  if (!isUnlocked) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-20">
          <Card>
            <CardHeader>
              <CardTitle>Furnizime & Shpenzime</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="password"
                placeholder="Fut fjalëkalimin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              />
              <Button onClick={handleUnlock} className="w-full">
                Hyr
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Furnizime & Shpenzime</h1>
            <InvoiceMappingManager 
              products={products}
              kitchenProducts={kitchenProducts}
              alcoholicDrinks={alcoholicDrinks}
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleInvoiceUpload}
                className="hidden"
                id="invoice-upload"
              />
              <Button
                onClick={() => document.getElementById("invoice-upload")?.click()}
                disabled={isScanningInvoice}
                variant="outline"
              >
                {isScanningInvoice ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 mr-2" />
                )}
                Skano Faturë
              </Button>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Shto Manual
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Shto Shpenzim të Ri</DialogTitle>
                <DialogDescription>
                  Regjistro blerje ose shpenzime për produkte bazë
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product">Emërtimi i Produktit</Label>
                  <Input
                    id="product"
                    placeholder="psh: Vaj friteze 5L"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Kostoja (Lekë)</Label>
                  <Input
                    id="cost"
                    type="number"
                    placeholder="2500"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Shënime (opsionale)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Shënime shtesë..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Anulo
                </Button>
                <Button onClick={handleAddExpense}>Ruaj</Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Dialog për rezultatet e skanimit të faturës */}
        <Dialog open={isShowingScannedData} onOpenChange={setIsShowingScannedData}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Produktet e Skanuar nga Fatura</DialogTitle>
              <DialogDescription>
                Kontrollo dhe konfirmo produktet para se t'i ruash
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="scanned-date">Data</Label>
                <Input
                  id="scanned-date"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                />
              </div>
              {scannedItems.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produkti</TableHead>
                        <TableHead>Kategoria</TableHead>
                        <TableHead>Sasia</TableHead>
                        <TableHead>Çmimi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scannedItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              item.category === 'kitchen' 
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' 
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                              {item.category === 'kitchen' ? '🍳 Kuzhinë' : '🥤 Pije'}
                            </span>
                          </TableCell>
                          <TableCell>{item.quantity || 1}</TableCell>
                          <TableCell>{item.price.toLocaleString()} Lekë</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={3} className="font-bold">TOTALI</TableCell>
                        <TableCell className="font-bold">
                          {scannedItems.reduce((sum, item) => sum + item.price, 0).toLocaleString()} Lekë
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground">
                  Nuk u gjetën produkte në faturë
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsShowingScannedData(false);
                setScannedItems([]);
              }}>
                Anulo
              </Button>
              <Button 
                onClick={handleSaveScannedItems}
                disabled={scannedItems.length === 0}
              >
                Ruaj Të Gjitha
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Totali i Shpenzimeve</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalExpenses.toLocaleString()} Lekë</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista e Shpenzimeve</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : expenses.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Nuk ka shpenzime të regjistruara
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Produkti</TableHead>
                      <TableHead>Kategoria</TableHead>
                      <TableHead>Kostoja</TableHead>
                      <TableHead>Shënime</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          {format(new Date(expense.expense_date), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {expense.product_name}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            expense.category === 'kitchen' 
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' 
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {expense.category === 'kitchen' ? '🍳 Kuzhinë' : '🥤 Pije'}
                          </span>
                        </TableCell>
                        <TableCell>{expense.cost.toLocaleString()} Lekë</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {expense.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Expenses;