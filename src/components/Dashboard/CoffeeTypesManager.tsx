import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Coffee, Trash2, Edit2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminRowControls } from "./AdminRowControls";

interface CoffeeType {
  id: string;
  name: string;
  purchase_price: number;
  sort_order: number;
  track_daily: boolean;
}

export const CoffeeTypesManager = () => {
  const [coffeeTypes, setCoffeeTypes] = useState<CoffeeType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCoffeeTypeName, setNewCoffeeTypeName] = useState("");
  const [newPurchasePrice, setNewPurchasePrice] = useState("");
  const [editingCoffeeType, setEditingCoffeeType] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedPrice, setEditedPrice] = useState("");

  useEffect(() => {
    loadCoffeeTypes();
  }, []);

  const loadCoffeeTypes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('coffee_types')
        .select('id, name, purchase_price, sort_order')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCoffeeTypes(data || []);
    } catch (error) {
      console.error('Error loading coffee types:', error);
      toast.error('Gabim në ngarkimin e kafeve');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    const trimmed = newCoffeeTypeName.trim();
    if (!trimmed) {
      toast.error("Shkruaj emrin e kafes!");
      return;
    }

    if (coffeeTypes.some(c => c.name === trimmed)) {
      toast.error("Kjo kafë ekziston tashmë!");
      return;
    }

    try {
      const maxSortOrder = Math.max(...coffeeTypes.map(c => c.sort_order), 0);
      const { error } = await supabase
        .from('coffee_types')
        .insert({
          name: trimmed,
          purchase_price: parseFloat(newPurchasePrice) || 0,
          sort_order: maxSortOrder + 1
        });

      if (error) throw error;
      
      toast.success("Lloji i kafes u shtua!");
      setNewCoffeeTypeName("");
      setNewPurchasePrice("");
      loadCoffeeTypes();
    } catch (error) {
      console.error('Error adding coffee type:', error);
      toast.error("Gabim në shtimin e kafes");
    }
  };

  const startEdit = (coffeeType: CoffeeType) => {
    setEditingCoffeeType(coffeeType.id);
    setEditedName(coffeeType.name);
    setEditedPrice(String(coffeeType.purchase_price || 0));
  };

  const saveEdit = async (coffeeTypeId: string) => {
    const trimmed = editedName.trim();
    if (!trimmed) {
      toast.error("Emri nuk mund të jetë bosh!");
      return;
    }

    try {
      const { error } = await supabase
        .from('coffee_types')
        .update({
          name: trimmed,
          purchase_price: parseFloat(editedPrice) || 0
        })
        .eq('id', coffeeTypeId);

      if (error) throw error;
      
      toast.success("Kafeja u përditësua!");
      setEditingCoffeeType(null);
      loadCoffeeTypes();
    } catch (error) {
      console.error('Error updating coffee type:', error);
      toast.error("Gabim në përditësim");
    }
  };

  const cancelEdit = () => {
    setEditingCoffeeType(null);
    setEditedName("");
    setEditedPrice("");
  };

  const deleteCoffeeType = async (coffeeTypeId: string) => {
    try {
      const { error } = await supabase
        .from('coffee_types')
        .delete()
        .eq('id', coffeeTypeId);

      if (error) throw error;
      
      toast.success("Kafeja u fshi!");
      loadCoffeeTypes();
    } catch (error) {
      console.error('Error deleting coffee type:', error);
      toast.error("Gabim në fshirje");
    }
  };

  const updatePrice = async (coffeeTypeId: string, price: number) => {
    try {
      const { error } = await supabase
        .from('coffee_types')
        .update({ purchase_price: price })
        .eq('id', coffeeTypeId);

      if (error) throw error;
      loadCoffeeTypes();
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error("Gabim në përditësimin e çmimit");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            Llojet e Kafeve
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
          <Coffee className="h-5 w-5" />
          Llojet e Kafeve
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Menaxho llojet e kafeve dhe çmimet e blerjes
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add New Coffee Type */}
          <div className="flex gap-2">
            <Input
              placeholder="Emri i llojit të kafes..."
              value={newCoffeeTypeName}
              onChange={(e) => setNewCoffeeTypeName(e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Çmim blerje"
              value={newPurchasePrice}
              onChange={(e) => setNewPurchasePrice(e.target.value)}
              className="w-28"
            />
            <Button onClick={handleAdd}>+ Shto</Button>
          </div>

          {/* Coffee Types Table */}
          {coffeeTypes.length > 0 ? (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lloji i Kafes</TableHead>
                    <TableHead className="w-32">Çmim Blerje (ALL)</TableHead>
                    <TableHead className="w-24">Veprime</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coffeeTypes.map((coffeeType) => (
                    <TableRow key={coffeeType.id}>
                      <TableCell className="font-medium">
                        {editingCoffeeType === coffeeType.id ? (
                          <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="h-8"
                            autoFocus
                          />
                        ) : (
                          coffeeType.name
                        )}
                      </TableCell>
                      <TableCell>
                        {editingCoffeeType === coffeeType.id ? (
                          <Input
                            type="number"
                            value={editedPrice}
                            onChange={(e) => setEditedPrice(e.target.value)}
                            className="h-8 w-24"
                          />
                        ) : (
                          <Input
                            type="number"
                            defaultValue={coffeeType.purchase_price || 0}
                            className="h-8 w-24"
                            onBlur={(e) => {
                              const newPrice = parseFloat(e.target.value) || 0;
                              if (newPrice !== coffeeType.purchase_price) {
                                updatePrice(coffeeType.id, newPrice);
                              }
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {editingCoffeeType === coffeeType.id ? (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => saveEdit(coffeeType.id)}
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
                              onClick={() => startEdit(coffeeType)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCoffeeType(coffeeType.id)}
                              className="h-8 w-8 p-0 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nuk ka lloje kafeje. Shto llojin e parë të kafes!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
