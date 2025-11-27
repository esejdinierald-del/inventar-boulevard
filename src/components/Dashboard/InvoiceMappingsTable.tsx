import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InvoiceMapping {
  id: string;
  invoice_name: string;
  product_type: string;
  product_name: string;
  quantity: number | null;
}

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'product':
      return '📦 Produkt';
    case 'coffee':
      return '☕ Kafe';
    case 'kitchen':
      return '🍳 Kuzhinë';
    case 'alcoholic_drink':
      return '🍸 Pije Alkoolike';
    default:
      return type;
  }
};

export const InvoiceMappingsTable = () => {
  const [mappings, setMappings] = useState<InvoiceMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('invoice_mappings')
        .select('*')
        .order('invoice_name', { ascending: true });

      if (error) throw error;
      setMappings(data || []);
    } catch (error) {
      console.error('Error loading invoice mappings:', error);
      toast.error('Gabim në ngarkimin e mapimeve');
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (id: string, newQuantity: number) => {
    try {
      const { error } = await supabase
        .from('invoice_mappings')
        .update({ quantity: newQuantity })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Sasia u përditësua!');
      await loadMappings();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Gabim gjatë përditësimit të sasisë');
    }
  };

  const deleteMapping = async (id: string, invoiceName: string) => {
    try {
      const { error } = await supabase
        .from('invoice_mappings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success(`Mapimi për "${invoiceName}" u fshi!`);
      await loadMappings();
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast.error('Gabim gjatë fshirjes së mapimit');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mapimi i Faturave</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapimi i Faturave</CardTitle>
        <p className="text-sm text-muted-foreground">
          Lista e produkteve nga faturat që janë të mapuara me produktet në sistem
        </p>
      </CardHeader>
      <CardContent>
        {mappings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nuk ka mapime të ruajtura</p>
            <p className="text-xs mt-1">Përdor "Ngarko Furnizime" për të skanuar fatura dhe krijuar mapime</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Emërtimi në Faturë</TableHead>
                  <TableHead>Lloji</TableHead>
                  <TableHead>Produkti në Sistem</TableHead>
                  <TableHead className="w-[100px]">Sasia</TableHead>
                  <TableHead className="w-[100px]">Veprime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-mono text-sm">{mapping.invoice_name}</TableCell>
                    <TableCell>
                      <span className="text-sm">{getTypeBadge(mapping.product_type)}</span>
                    </TableCell>
                    <TableCell className="font-medium">{mapping.product_name}</TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min="1"
                        value={mapping.quantity || 1}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value > 0) {
                            updateQuantity(mapping.id, value);
                          }
                        }}
                        className="w-16 text-center"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMapping(mapping.id, mapping.invoice_name)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
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
  );
};
