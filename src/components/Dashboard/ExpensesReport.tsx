import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { CalendarIcon, Download, FileText } from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TurnData, ShpenzimiData } from "@/types/turn.types";

interface DailyExpenseItem {
  date: string;
  turn: string;
  emertimi: string;
  vlera: number;
}

export const ExpensesReport = () => {
  const [fromDate, setFromDate] = useState<Date>(startOfMonth(new Date()));
  const [toDate, setToDate] = useState<Date>(endOfMonth(new Date()));
  const [expenses, setExpenses] = useState<DailyExpenseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, [fromDate, toDate]);

  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('daily_entries')
        .select('entry_date, turn1_data, turn2_data')
        .gte('entry_date', format(fromDate, 'yyyy-MM-dd'))
        .lte('entry_date', format(toDate, 'yyyy-MM-dd'))
        .order('entry_date', { ascending: false });

      if (error) {
        console.error('Error loading daily entries:', error);
        toast.error('Gabim në ngarkimin e shpenzimeve');
        return;
      }

      // Extract shpenzime from each turn
      const allExpenses: DailyExpenseItem[] = [];
      
      data?.forEach(entry => {
        const t1 = entry.turn1_data as unknown as TurnData;
        const t2 = entry.turn2_data as unknown as TurnData;
        
        // Get T1 shpenzime
        if (t1?.shpenzime && Array.isArray(t1.shpenzime)) {
          t1.shpenzime.forEach((shp: ShpenzimiData) => {
            if (shp.emertimi && shp.vlera > 0) {
              allExpenses.push({
                date: entry.entry_date,
                turn: 'T1',
                emertimi: shp.emertimi,
                vlera: shp.vlera
              });
            }
          });
        }
        
        // Get T2 shpenzime
        if (t2?.shpenzime && Array.isArray(t2.shpenzime)) {
          t2.shpenzime.forEach((shp: ShpenzimiData) => {
            if (shp.emertimi && shp.vlera > 0) {
              allExpenses.push({
                date: entry.entry_date,
                turn: 'T2',
                emertimi: shp.emertimi,
                vlera: shp.vlera
              });
            }
          });
        }
      });

      setExpenses(allExpenses);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.vlera, 0);

  const exportExpenses = () => {
    if (expenses.length === 0) {
      toast.error('Nuk ka shpenzime për të eksportuar');
      return;
    }

    let csvContent = "Data,Turni,Emërtimi,Vlera\n";
    
    expenses.forEach(exp => {
      csvContent += `${exp.date},${exp.turn},${exp.emertimi},${exp.vlera}\n`;
    });

    csvContent += `\nTotal,,,${totalExpenses} ALL`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `shpenzime-turni-${format(fromDate, 'yyyy-MM-dd')}-${format(toDate, 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success('Shpenzimet u eksportuan me sukses');
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Raporti i Shpenzimeve të Turnit
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
                <TableHead>Turni</TableHead>
                <TableHead>Emërtimi</TableHead>
                <TableHead className="text-right">Vlera</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Duke ngarkuar...
                  </TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nuk ka shpenzime për periudhën e zgjedhur
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((exp, index) => (
                  <TableRow key={`${exp.date}-${exp.turn}-${index}`}>
                    <TableCell>{format(new Date(exp.date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        exp.turn === 'T1' 
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      )}>
                        {exp.turn}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{exp.emertimi}</TableCell>
                    <TableCell className="text-right text-destructive font-semibold">
                      {exp.vlera.toLocaleString()} ALL
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