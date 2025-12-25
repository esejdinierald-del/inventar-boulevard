import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { CalendarIcon, Download, FileText } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { sq } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Expense {
  id: string;
  expense_date: string;
  product_name: string;
  cost: number;
  category: string | null;
  notes: string | null;
}

export const ExpensesReport = () => {
  const [fromDate, setFromDate] = useState<Date>(startOfMonth(new Date()));
  const [toDate, setToDate] = useState<Date>(endOfMonth(new Date()));
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, [fromDate, toDate]);

  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('expense_date', format(fromDate, 'yyyy-MM-dd'))
        .lte('expense_date', format(toDate, 'yyyy-MM-dd'))
        .order('expense_date', { ascending: false });

      if (error) {
        console.error('Error loading expenses:', error);
        toast.error('Gabim në ngarkimin e shpenzimeve');
        return;
      }

      setExpenses(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.cost || 0), 0);

  const exportExpenses = () => {
    if (expenses.length === 0) {
      toast.error('Nuk ka shpenzime për të eksportuar');
      return;
    }

    let csvContent = "Data,Produkti,Kategoria,Shuma,Shënime\n";
    
    expenses.forEach(exp => {
      const notes = exp.notes ? `"${exp.notes.replace(/"/g, '""')}"` : '';
      csvContent += `${exp.expense_date},${exp.product_name},${exp.category || ''},${exp.cost},${notes}\n`;
    });

    csvContent += `\nTotal,,,"${totalExpenses} ALL",`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `shpenzime-${format(fromDate, 'yyyy-MM-dd')}-${format(toDate, 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success('Shpenzimet u eksportuan me sukses');
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Raporti i Shpenzimeve
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Range Selector */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Nga:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[160px] justify-start text-left font-normal",
                    !fromDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fromDate ? format(fromDate, "dd/MM/yyyy") : "Zgjidh datën"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={(date) => date && setFromDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Deri:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[160px] justify-start text-left font-normal",
                    !toDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {toDate ? format(toDate, "dd/MM/yyyy") : "Zgjidh datën"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={(date) => date && setToDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button onClick={exportExpenses} disabled={isLoading || expenses.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Shkarko CSV
          </Button>
        </div>

        {/* Expenses Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produkti</TableHead>
                <TableHead>Kategoria</TableHead>
                <TableHead className="text-right">Shuma</TableHead>
                <TableHead>Shënime</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Duke ngarkuar...
                  </TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nuk ka shpenzime për periudhën e zgjedhur
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell>{format(new Date(exp.expense_date), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="font-medium">{exp.product_name}</TableCell>
                    <TableCell>{exp.category || '-'}</TableCell>
                    <TableCell className="text-right text-destructive font-semibold">
                      {Number(exp.cost).toLocaleString()} ALL
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {exp.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {expenses.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="font-bold">Total Shpenzime</TableCell>
                  <TableCell className="text-right font-bold text-destructive text-lg">
                    {totalExpenses.toLocaleString()} ALL
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>

        {/* Summary */}
        {expenses.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Gjithsej {expenses.length} shpenzime nga {format(fromDate, "dd/MM/yyyy")} deri {format(toDate, "dd/MM/yyyy")}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
