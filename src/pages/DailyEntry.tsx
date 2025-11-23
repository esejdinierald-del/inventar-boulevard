import { useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { ProductMappingManager } from "@/components/ProductMappingManager";
import { AdminPasswordDialog } from "@/components/DailyEntry/AdminPasswordDialog";
import { TurnSection } from "@/components/DailyEntry/TurnSection";
import { useAuth } from "@/hooks/useAuth";
import { useProductList } from "@/hooks/useProductList";
import { useTurnData } from "@/hooks/useTurnData";
import { TurnData } from "@/types/turn.types";

const DailyEntry = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editedProductName, setEditedProductName] = useState("");

  // Custom hooks
  const { isAdminUnlocked, showPasswordDialog, validatePassword, toggleAdminMode, closePasswordDialog } = useAuth();
  const { products, coffeeTypes, addProduct, deleteProduct, updateProduct } = useProductList();
  const {
    turn1,
    turn2,
    setTurn1,
    setTurn2,
    updateTurn1Product,
    updateTurn2Product,
    syncMulliriT1ToT2,
    copyT1ToT2,
    saveForNextDay,
    loadFromPreviousDay,
    handleReceiptDataT1,
    handleReceiptDataT2,
    totalXhiro,
  } = useTurnData({ products, coffeeTypes, selectedDate });

  // Date validation
  const isPastDate = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return selectedDate < today;
  }, [selectedDate]);

  const isFieldDisabled = useCallback(() => {
    return isPastDate() && !isAdminUnlocked;
  }, [isPastDate, isAdminUnlocked]);

  // Product editing
  const startEditingProduct = useCallback((productName: string) => {
    setEditingProduct(productName);
    setEditedProductName(productName);
  }, []);

  const cancelEditingProduct = useCallback(() => {
    setEditingProduct(null);
    setEditedProductName("");
  }, []);

  const saveEditedProduct = useCallback((oldName: string) => {
    if (updateProduct(oldName, editedProductName)) {
      // Update turn data
      setTurn1(prev => {
        const newProducts = { ...prev.products };
        const oldData = newProducts[oldName];
        delete newProducts[oldName];
        newProducts[editedProductName.trim()] = oldData;
        return { ...prev, products: newProducts };
      });
      setTurn2(prev => {
        const newProducts = { ...prev.products };
        const oldData = newProducts[oldName];
        delete newProducts[oldName];
        newProducts[editedProductName.trim()] = oldData;
        return { ...prev, products: newProducts };
      });
      cancelEditingProduct();
    }
  }, [editedProductName, updateProduct, cancelEditingProduct]);

  // Update turn data
  const updateTurn1Field = useCallback((field: keyof TurnData, value: number) => {
    setTurn1(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateTurn2Field = useCallback((field: keyof TurnData, value: number) => {
    setTurn2(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateTurn1Coffee = useCallback((coffee: string, value: number) => {
    setTurn1(prev => ({
      ...prev,
      coffee: { ...prev.coffee, [coffee]: value }
    }));
  }, []);

  const updateTurn2Coffee = useCallback((coffee: string, value: number) => {
    setTurn2(prev => ({
      ...prev,
      coffee: { ...prev.coffee, [coffee]: value }
    }));
  }, []);

  const handleMulliriT1Update = useCallback((value: number) => {
    updateTurn1Field('mulliriPerfund', value);
    syncMulliriT1ToT2(value);
  }, [updateTurn1Field, syncMulliriT1ToT2]);

  // Save handler
  const handleSave = useCallback(() => {
    saveForNextDay();
    toast.success(`Të dhënat u ruajtën! Xhiro totale: ${totalXhiro.toLocaleString()} ALL`);
  }, [saveForNextDay, totalXhiro]);

  return (
    <Layout>
      <div className="space-y-6 pb-20 md:pb-6">
        {/* Past date warning */}
        {isPastDate() && !isAdminUnlocked && (
          <div className="rounded-lg border border-warning/50 bg-warning/10 p-4">
            <p className="text-sm font-medium text-warning">
              🔒 Po shikon të dhëna nga e kaluara. Vetëm shikimi është i lejuar. Për të modifikuar, hyr si Admin.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Regjistrimi Ditor</h2>
            <p className="text-muted-foreground">Regjistro shitjet dhe inventarin për secilin turn</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ProductMappingManager products={products} coffeeTypes={coffeeTypes} />
            <Button
              variant={isAdminUnlocked ? "default" : "outline"}
              size="sm"
              onClick={toggleAdminMode}
              className="text-xs"
            >
              {isAdminUnlocked ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
              {isAdminUnlocked ? "Admin (Mbyll)" : "Admin"}
            </Button>
            <Button variant="outline" size="sm" onClick={loadFromPreviousDay} className="text-xs">
              📥 Ngarko nga dje
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="turn1" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="turn1">Turni 1</TabsTrigger>
            <TabsTrigger value="turn2">Turni 2</TabsTrigger>
          </TabsList>

          <TabsContent value="turn1" className="space-y-4">
            <TurnSection
              turnName="1"
              turnData={turn1}
              products={products}
              coffeeTypes={coffeeTypes}
              isAdminUnlocked={isAdminUnlocked}
              isFieldDisabled={isFieldDisabled()}
              showCopyButton
              onProductUpdate={updateTurn1Product}
              onCoffeeUpdate={updateTurn1Coffee}
              onTurnUpdate={updateTurn1Field}
              onMulliriPerfundUpdate={handleMulliriT1Update}
              onCopyToNextTurn={copyT1ToT2}
              onReceiptData={handleReceiptDataT1}
              onProductDelete={deleteProduct}
              onProductAdd={addProduct}
              onProductEdit={startEditingProduct}
              editingProduct={editingProduct}
              editedProductName={editedProductName}
              onEditedNameChange={setEditedProductName}
              onSaveEdit={saveEditedProduct}
              onCancelEdit={cancelEditingProduct}
            />
          </TabsContent>

          <TabsContent value="turn2" className="space-y-4">
            <TurnSection
              turnName="2"
              turnData={turn2}
              products={products}
              coffeeTypes={coffeeTypes}
              isAdminUnlocked={isAdminUnlocked}
              isFieldDisabled={isFieldDisabled()}
              mulliriFillimDisabled
              onProductUpdate={updateTurn2Product}
              onCoffeeUpdate={updateTurn2Coffee}
              onTurnUpdate={updateTurn2Field}
              onMulliriPerfundUpdate={(value) => updateTurn2Field('mulliriPerfund', value)}
              onReceiptData={handleReceiptDataT2}
              onProductDelete={deleteProduct}
              onProductAdd={addProduct}
              onProductEdit={startEditingProduct}
              editingProduct={editingProduct}
              editedProductName={editedProductName}
              onEditedNameChange={setEditedProductName}
              onSaveEdit={saveEditedProduct}
              onCancelEdit={cancelEditingProduct}
            />
          </TabsContent>
        </Tabs>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Përmbledhje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Xhiro Totale</p>
                <p className="text-2xl font-bold">{totalXhiro.toLocaleString()} ALL</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Xhiro T1</p>
                <p className="text-xl font-semibold">{turn1.xhiro.toLocaleString()} ALL</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Xhiro T2</p>
                <p className="text-xl font-semibold">{turn2.xhiro.toLocaleString()} ALL</p>
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={handleSave} className="w-full md:w-auto">
                💾 Ruaj të Dhënat
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Admin Password Dialog */}
        <AdminPasswordDialog
          isOpen={showPasswordDialog}
          onClose={closePasswordDialog}
          onSubmit={validatePassword}
        />
      </div>
    </Layout>
  );
};

export default DailyEntry;
