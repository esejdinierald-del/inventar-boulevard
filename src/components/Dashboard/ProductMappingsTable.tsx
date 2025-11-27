import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Loader2, Upload, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductMapping {
  id: string;
  receipt_name: string;
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

export const ProductMappingsTable = () => {
  const [mappings, setMappings] = useState<ProductMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingMapping, setEditingMapping] = useState<ProductMapping | null>(null);
  const [editForm, setEditForm] = useState({
    product_type: '',
    product_name: '',
    quantity: 1
  });

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('product_mappings')
        .select('*')
        .order('receipt_name', { ascending: true });

      if (error) throw error;
      setMappings(data || []);
    } catch (error) {
      console.error('Error loading product mappings:', error);
      toast.error('Gabim në ngarkimin e mapimeve');
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (id: string, newQuantity: number) => {
    try {
      const { error } = await supabase
        .from('product_mappings')
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

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        toast.error('Formati i JSON duhet të jetë array');
        return;
      }

      for (const item of data) {
        if (!item.receipt_name || !item.product_type || !item.product_name) {
          toast.error('Të dhënat në JSON janë jo të plota');
          return;
        }
      }

      const { error } = await supabase
        .from('product_mappings')
        .insert(data.map(item => ({
          receipt_name: item.receipt_name,
          product_type: item.product_type,
          product_name: item.product_name,
          quantity: item.quantity || 1
        })));

      if (error) throw error;

      toast.success(`${data.length} mapime u importuan me sukses!`);
      await loadMappings();
    } catch (error) {
      console.error('Error importing mappings:', error);
      toast.error('Gabim gjatë importimit të mapimeve');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openEditDialog = (mapping: ProductMapping) => {
    setEditingMapping(mapping);
    setEditForm({
      product_type: mapping.product_type,
      product_name: mapping.product_name,
      quantity: mapping.quantity || 1
    });
  };

  const closeEditDialog = () => {
    setEditingMapping(null);
  };

  const saveEdit = async () => {
    if (!editingMapping) return;

    try {
      const { error } = await supabase
        .from('product_mappings')
        .update({
          product_type: editForm.product_type,
          product_name: editForm.product_name,
          quantity: editForm.quantity
        })
        .eq('id', editingMapping.id);

      if (error) throw error;

      toast.success('Mapimi u përditësua!');
      closeEditDialog();
      await loadMappings();
    } catch (error) {
      console.error('Error updating mapping:', error);
      toast.error('Gabim gjatë përditësimit të mapimit');
    }
  };

  const deleteMapping = async (id: string, receiptName: string) => {
    try {
      const { error } = await supabase
        .from('product_mappings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success(`Mapimi për "${receiptName}" u fshi!`);
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
          <CardTitle>Mapimi i Shiritave të Shitjes</CardTitle>
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Mapimi i Shiritave të Shitjes</CardTitle>
            <p className="text-sm text-muted-foreground">
              Lista e produkteve nga shiritat e shitjes që janë të mapuara me produktet në sistem
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importo
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {mappings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nuk ka mapime të ruajtura</p>
            <p className="text-xs mt-1">Përdor skanerin e shiritave për të krijuar mapime</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Emërtimi në Shirit</TableHead>
                  <TableHead>Lloji</TableHead>
                  <TableHead>Produkti në Sistem</TableHead>
                  <TableHead className="w-[100px]">Sasia</TableHead>
                  <TableHead className="w-[100px]">Veprime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-mono text-sm">{mapping.receipt_name}</TableCell>
                    <TableCell>
                      <span className="text-sm">{getTypeBadge(mapping.product_type)}</span>
                    </TableCell>
                    <TableCell className="font-medium">{mapping.product_name}</TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={mapping.quantity || 1}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (value > 0 && !isNaN(value)) {
                            updateQuantity(mapping.id, value);
                          }
                        }}
                        className="w-20 text-center"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(mapping)}
                          className="text-primary hover:text-primary"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMapping(mapping.id, mapping.receipt_name)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={!!editingMapping} onOpenChange={closeEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edito Mapimin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Emërtimi në Shirit</Label>
              <Input 
                value={editingMapping?.receipt_name || ''} 
                disabled 
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Lloji i Produktit</Label>
              <Select
                value={editForm.product_type}
                onValueChange={(value) => setEditForm({ ...editForm, product_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">📦 Produkt</SelectItem>
                  <SelectItem value="coffee">☕ Kafe</SelectItem>
                  <SelectItem value="kitchen">🍳 Kuzhinë</SelectItem>
                  <SelectItem value="alcoholic_drink">🍸 Pije Alkoolike</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Emri i Produktit në Sistem</Label>
              <Input
                value={editForm.product_name}
                onChange={(e) => setEditForm({ ...editForm, product_name: e.target.value })}
                placeholder="P.sh. Coca Cola"
              />
            </div>
            <div className="space-y-2">
              <Label>Sasia për Paketë (mund të jetë decimale, p.sh. 0.05)</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={editForm.quantity}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setEditForm({ ...editForm, quantity: isNaN(value) ? 1 : value });
                }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={closeEditDialog}>
                Anulo
              </Button>
              <Button onClick={saveEdit}>
                Ruaj
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
