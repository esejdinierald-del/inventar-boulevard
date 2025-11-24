import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChefHat, Trash2, Edit2, Check, X } from "lucide-react";
import { useKitchenProducts } from "@/hooks/useKitchenProducts";

export const KitchenProductsManager = () => {
  const { kitchenProducts, addKitchenProduct, deleteKitchenProduct, updateKitchenProduct, isLoading } = useKitchenProducts();
  const [newProductName, setNewProductName] = useState("");
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");

  const handleAdd = async () => {
    const success = await addKitchenProduct(newProductName);
    if (success) {
      setNewProductName("");
    }
  };

  const startEdit = (productName: string) => {
    setEditingProduct(productName);
    setEditedName(productName);
  };

  const saveEdit = async (oldName: string) => {
    const success = await updateKitchenProduct(oldName, editedName);
    if (success) {
      setEditingProduct(null);
      setEditedName("");
    }
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setEditedName("");
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
              placeholder="Emri i produktit të ri..."
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
            />
            <Button onClick={handleAdd} variant="default">
              + Shto
            </Button>
          </div>

          {/* Products Table */}
          {kitchenProducts.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produkti</TableHead>
                    <TableHead className="w-[100px]">Veprime</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kitchenProducts.map((product) => (
                    <TableRow key={product}>
                      <TableCell className="font-medium">
                        {editingProduct === product ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className="h-8"
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => saveEdit(product)}
                              className="h-8 w-8 p-0 text-success"
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
                          <span>{product}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingProduct !== product && (
                          <div className="flex gap-2">
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
                              onClick={() => deleteKitchenProduct(product)}
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
