import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Trash2, Edit2, Check, X, PlayCircle, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { sq } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ExpenseTemplate {
  id: string;
  name: string;
  amount: number;
  category: string;
  sort_order: number;
  is_active: boolean;
}

export const FixedExpensesManager = () => {
  const [templates, setTemplates] = useState<ExpenseTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedAmount, setEditedAmount] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('expense_templates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Gabim në ngarkimin e templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    const trimmedName = newName.trim();
    const amount = parseFloat(newAmount) || 0;
    
    if (!trimmedName) {
      toast.error("Shkruaj emrin e shpenzimit!");
      return;
    }
    if (amount <= 0) {
      toast.error("Vendos një shumë valide!");
      return;
    }

    try {
      const maxSortOrder = Math.max(...templates.map(t => t.sort_order), 0);
      const { error } = await supabase
        .from('expense_templates')
        .insert({
          name: trimmedName,
          amount: amount,
          category: 'fixed',
          sort_order: maxSortOrder + 1
        });

      if (error) throw error;
      
      toast.success("Template u shtua!");
      setNewName("");
      setNewAmount("");
      loadTemplates();
    } catch (error) {
      console.error('Error adding template:', error);
      toast.error("Gabim në shtimin e template");
    }
  };

  const startEdit = (template: ExpenseTemplate) => {
    setEditingTemplate(template.id);
    setEditedName(template.name);
    setEditedAmount(String(template.amount));
  };

  const saveEdit = async (templateId: string) => {
    const trimmedName = editedName.trim();
    const amount = parseFloat(editedAmount) || 0;

    if (!trimmedName || amount <= 0) {
      toast.error("Plotëso të gjitha fushat!");
      return;
    }

    try {
      const { error } = await supabase
        .from('expense_templates')
        .update({
          name: trimmedName,
          amount: amount
        })
        .eq('id', templateId);

      if (error) throw error;
      
      toast.success("Template u përditësua!");
      setEditingTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error("Gabim në përditësim");
    }
  };

  const cancelEdit = () => {
    setEditingTemplate(null);
    setEditedName("");
    setEditedAmount("");
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('expense_templates')
        .update({ is_active: false })
        .eq('id', templateId);

      if (error) throw error;
      
      toast.success("Template u fshi!");
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error("Gabim në fshirje");
    }
  };

  const applyTemplatesToMonth = async () => {
    if (templates.length === 0) {
      toast.error("Nuk ka shpenzime fikse për të aplikuar!");
      return;
    }

    try {
      setIsApplying(true);
      const [year, month] = selectedMonth.split("-");
      const monthStart = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
      
      // Check if templates already applied for this month
      const { data: existing, error: checkError } = await supabase
        .from('expenses')
        .select('id')
        .eq('category', 'fixed')
        .gte('expense_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('expense_date', format(endOfMonth(monthStart), 'yyyy-MM-dd'))
        .limit(1);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        const confirmed = window.confirm(
          `Ky muaj ka tashmë shpenzime fikse. Dëshiron t'i shtosh përsëri?`
        );
        if (!confirmed) {
          setIsApplying(false);
          return;
        }
      }

      // Insert all templates as expenses for the selected month
      const expenseDate = format(monthStart, 'yyyy-MM-dd');
      const expensesToInsert = templates.map(template => ({
        product_name: template.name,
        cost: template.amount,
        expense_date: expenseDate,
        category: 'fixed',
        notes: `Shpenzim fiks mujor - ${format(monthStart, 'MMMM yyyy', { locale: sq })}`
      }));

      const { error: insertError } = await supabase
        .from('expenses')
        .insert(expensesToInsert);

      if (insertError) throw insertError;

      toast.success(`${templates.length} shpenzime fikse u aplikuan për ${format(monthStart, 'MMMM yyyy', { locale: sq })}`);
    } catch (error) {
      console.error('Error applying templates:', error);
      toast.error("Gabim në aplikimin e templates");
    } finally {
      setIsApplying(false);
    }
  };

  // Generate month options
  const monthOptions = Array.from({ length: 3 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i + 1); // Include next month
    return {
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy", { locale: sq })
    };
  });

  const totalFixed = templates.reduce((sum, t) => sum + t.amount, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Shpenzime Fikse Mujore
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Duke ngarkuar...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Shpenzime Fikse Mujore
        </CardTitle>
        <CardDescription>
          Krijo template për shpenzimet fikse (rroga, qera, etj.) dhe apliko me një klik për çdo muaj
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add New Template */}
          <div className="flex gap-2 flex-wrap">
            <Input
              placeholder="Emri (p.sh. Qera, Rroga...)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <Input
              type="number"
              placeholder="Shuma (ALL)"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="w-32"
            />
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Shto
            </Button>
          </div>

          {/* Templates Table */}
          {templates.length > 0 ? (
            <>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shpenzimi</TableHead>
                      <TableHead className="w-32">Shuma (ALL)</TableHead>
                      <TableHead className="w-24">Veprime</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">
                          {editingTemplate === template.id ? (
                            <Input
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className="h-8"
                              autoFocus
                            />
                          ) : (
                            template.name
                          )}
                        </TableCell>
                        <TableCell>
                          {editingTemplate === template.id ? (
                            <Input
                              type="number"
                              value={editedAmount}
                              onChange={(e) => setEditedAmount(e.target.value)}
                              className="h-8 w-24"
                            />
                          ) : (
                            <span className="font-medium">{template.amount.toLocaleString()}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingTemplate === template.id ? (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => saveEdit(template.id)}
                                className="h-8 w-8 p-0 text-green-600"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelEdit}
                                className="h-8 w-8 p-0 text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEdit(template)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteTemplate(template.id)}
                                className="h-8 w-8 p-0 text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-bold">TOTALI MUJOR</TableCell>
                      <TableCell className="font-bold text-primary">
                        {totalFixed.toLocaleString()} ALL
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Apply to Month */}
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg flex-wrap">
                <span className="text-sm font-medium">Apliko për:</span>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={applyTemplatesToMonth} 
                  disabled={isApplying}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  {isApplying ? "Duke aplikuar..." : "Apliko Shpenzimet"}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nuk ka shpenzime fikse. Shto rrogat, qeranë ose shpenzime të tjera të përsëritura!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
