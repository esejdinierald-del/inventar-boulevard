import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Coffee, Trash2, Edit2, Check, X } from "lucide-react";
import { useProductList } from "@/hooks/useProductList";

export const CoffeeTypesManager = () => {
  const { coffeeTypes, addCoffeeType, deleteCoffeeType, updateCoffeeType, isLoading } = useProductList();
  const [newCoffeeTypeName, setNewCoffeeTypeName] = useState("");
  const [editingCoffeeType, setEditingCoffeeType] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");

  const handleAdd = async () => {
    const success = await addCoffeeType(newCoffeeTypeName);
    if (success) {
      setNewCoffeeTypeName("");
    }
  };

  const startEdit = (coffeeTypeName: string) => {
    setEditingCoffeeType(coffeeTypeName);
    setEditedName(coffeeTypeName);
  };

  const saveEdit = async (oldName: string) => {
    const success = await updateCoffeeType(oldName, editedName);
    if (success) {
      setEditingCoffeeType(null);
      setEditedName("");
    }
  };

  const cancelEdit = () => {
    setEditingCoffeeType(null);
    setEditedName("");
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
          Menaxho llojet e kafeve që shfaqen në tabelë
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add New Coffee Type */}
          <div className="flex gap-2">
            <Input
              placeholder="Emri i llojit të ri të kafes..."
              value={newCoffeeTypeName}
              onChange={(e) => setNewCoffeeTypeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
            />
            <Button onClick={handleAdd} variant="default">
              + Shto
            </Button>
          </div>

          {/* Coffee Types Table */}
          {coffeeTypes.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lloji i Kafes</TableHead>
                    <TableHead className="w-[100px]">Veprime</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coffeeTypes.map((coffeeType) => (
                    <TableRow key={coffeeType}>
                      <TableCell className="font-medium">
                        {editingCoffeeType === coffeeType ? (
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
                              onClick={() => saveEdit(coffeeType)}
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
                          <span>{coffeeType}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingCoffeeType !== coffeeType && (
                          <div className="flex gap-2">
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
                              onClick={() => deleteCoffeeType(coffeeType)}
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
