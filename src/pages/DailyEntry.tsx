import { useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, History } from "lucide-react";
import { toast } from "sonner";
import { ProductMappingManager } from "@/components/ProductMappingManager";

import { TurnSection } from "@/components/DailyEntry/TurnSection";
import { HistoryDialog } from "@/components/DailyEntry/HistoryDialog";
import { useProductList } from "@/hooks/useProductList";
import { useTurnData } from "@/hooks/useTurnData";
import { TurnData } from "@/types/turn.types";

const DailyEntry = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editedProductName, setEditedProductName] = useState("");
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [historyTurn, setHistoryTurn] = useState<1 | 2>(1);
  const [currentTab, setCurrentTab] = useState<"turn1" | "turn2">("turn1");

  // Custom hooks
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
    return false; // No restrictions now
  }, []);

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

  const handleShowHistory = useCallback((turnNumber: 1 | 2) => {
    setHistoryTurn(turnNumber);
    setShowHistoryDialog(true);
  }, []);

  const handleRestoreHistory = useCallback((data: TurnData) => {
    if (historyTurn === 1) {
      setTurn1(data);
    } else {
      setTurn2(data);
    }
  }, [historyTurn, setTurn1, setTurn2]);

  // Save handler
  const handleSave = useCallback(() => {
    saveForNextDay();
    toast.success(`Të dhënat u ruajtën! Xhiro totale: ${totalXhiro.toLocaleString()} ALL`);
  }, [saveForNextDay, totalXhiro]);

  return (
    <Layout>
      <div className="space-y-6 pb-20 md:pb-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Regjistrimi Ditor</h2>
              <p className="text-sm text-muted-foreground">Regjistro shitjet dhe inventarin për secilin turn</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ProductMappingManager products={products} coffeeTypes={coffeeTypes} />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadFromPreviousDay} 
              className="text-xs touch-manipulation min-h-[44px] sm:min-h-0"
            >
              📥 Ngarko nga dje
            </Button>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full sm:w-auto touch-manipulation min-h-[44px] sm:min-h-0"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as "turn1" | "turn2")} className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-2">
              <TabsTrigger value="turn1">Turni 1</TabsTrigger>
              <TabsTrigger value="turn2">Turni 2</TabsTrigger>
            </TabsList>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShowHistory(currentTab === "turn1" ? 1 : 2)}
              className="w-full sm:w-auto"
            >
              <History className="h-4 w-4 mr-2" />
              Shiko Historikun
            </Button>
          </div>

          <TabsContent value="turn1" className="space-y-4">
            <TurnSection
              turnName="1"
              turnData={turn1}
              products={products}
              coffeeTypes={coffeeTypes}
              isAdminUnlocked={true}
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
              isAdminUnlocked={true}
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
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={handleSave} 
                className="w-full sm:w-auto touch-manipulation min-h-[44px] sm:min-h-0"
              >
                💾 Ruaj të Dhënat
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* History Dialog */}
        <HistoryDialog
          isOpen={showHistoryDialog}
          onClose={() => setShowHistoryDialog(false)}
          selectedDate={selectedDate}
          turnNumber={historyTurn}
          onRestore={handleRestoreHistory}
        />
      </div>
    </Layout>
  );
};

export default DailyEntry;
