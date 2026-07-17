import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChefHat, Trash2, Edit2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminRowControls } from "./AdminRowControls";

interface KitchenProduct {
  id: string;
  name: string;
  purchase_price: number;
  sort_order: number;
  track_daily: boolean;
}

export const KitchenProductsManager = () => {
  const [products, setProducts] = useState<KitchenProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newProductName, setNewProductName] = useState("");
  const [newPurchasePrice, setNewPurchasePrice] = useState("");
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedPrice, setEditedPrice] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('kitchen_products')
        .select('id, name, purchase_price, sort_order')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading kitchen products:', error);
      toast.error('Gabim në ngarkimin e produkteve');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    const trimmed = newProductName.trim();
    if (!trimmed) {
      toast.error("Shkruaj emrin e produktit!");
      return;
    }

    if (products.some(p => p.name === trimmed)) {
      toast.error("Produkti ekziston tashmë!");
      return;
    }

    try {
      const maxSortOrder = Math.max(...products.map(p => p.sort_order), 0);
      const { error } = await supabase
        .from('kitchen_products')
        .insert({
          name: trimmed,
          purchase_price: parseFloat(newPurchasePrice) || 0,
          sort_order: maxSortOrder + 1
        });

      if (error) throw error;
      
      toast.success("Produkti u shtua!");
      setNewProductName("");
      setNewPurchasePrice("");
      loadProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error("Gabim në shtimin e produktit");
    }
  };

  const startEdit = (product: KitchenProduct) => {
    setEditingProduct(product.id);
    setEditedName(product.name);
    setEditedPrice(String(product.purchase_price || 0));
  };

  const saveEdit = async (productId: string) => {
    const trimmed = editedName.trim();
    if (!trimmed) {
      toast.error("Emri nuk mund të jetë bosh!");
      return;
    }

    try {
      const { error } = await supabase
        .from('kitchen_products')
        .update({
          name: trimmed,
          purchase_price: parseFloat(editedPrice) || 0
        })
        .eq('id', productId);

      if (error) throw error;
      
      toast.success("Produkti u përditësua!");
      setEditingProduct(null);
      loadProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error("Gabim në përditësim");
    }
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setEditedName("");
    setEditedPrice("");
  };

  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('kitchen_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      
      toast.success("Produkti u fshi!");
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error("Gabim në fshirje");
    }
  };

  const updatePrice = async (productId: string, price: number) => {
    try {
      const { error } = await supabase
        .from('kitchen_products')
        .update({ purchase_price: price })
        .eq('id', productId);

      if (error) throw error;
      loadProducts();
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
            <ChefHat className="h-5 w-5" />
            Produktet e Kuzhinës
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
          <ChefHat className="h-5 w-5" />
          Produktet e Kuzhinës
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Këta produkte shfaqen vetëm në faturë dhe nuk duken te kamarieri
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add New Product */}
          <div className="flex gap-2">
            <Input
              placeholder="Emri i produktit..."
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
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

          {/* Products Table */}
          {products.length > 0 ? (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produkti</TableHead>
                    <TableHead className="w-32">Çmim Blerje (ALL)</TableHead>
                    <TableHead className="w-24">Veprime</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {editingProduct === product.id ? (
                          <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="h-8"
                            autoFocus
                          />
                        ) : (
                          product.name
                        )}
                      </TableCell>
                      <TableCell>
                        {editingProduct === product.id ? (
                          <Input
                            type="number"
                            value={editedPrice}
                            onChange={(e) => setEditedPrice(e.target.value)}
                            className="h-8 w-24"
                          />
                        ) : (
                          <Input
                            type="number"
                            defaultValue={product.purchase_price || 0}
                            className="h-8 w-24"
                            onBlur={(e) => {
                              const newPrice = parseFloat(e.target.value) || 0;
                              if (newPrice !== product.purchase_price) {
                                updatePrice(product.id, newPrice);
                              }
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {editingProduct === product.id ? (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => saveEdit(product.id)}
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
                              onClick={() => startEdit(product)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteProduct(product.id)}
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
              Nuk ka produkte. Shto produktin e parë të kuzhinës!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
