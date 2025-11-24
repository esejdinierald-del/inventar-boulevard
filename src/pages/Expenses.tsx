import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
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
  created_at: string;
}

const Expenses = () => {
  const { toast } = useToast();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
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
      setExpenses(data || []);
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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Furnizime & Shpenzime</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Shto Shpenzim
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