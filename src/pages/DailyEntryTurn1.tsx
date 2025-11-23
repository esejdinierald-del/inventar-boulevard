import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { TurnSection } from "@/components/DailyEntry/TurnSection";
import { AdminPasswordDialog } from "@/components/DailyEntry/AdminPasswordDialog";
import { ProductMappingManager } from "@/components/ProductMappingManager";
import { useAuth } from "@/hooks/useAuth";
import { useProductList } from "@/hooks/useProductList";
import { useTurnData } from "@/hooks/useTurnData";
import { TurnData } from "@/types/turn.types";
import { Card, CardContent } from "@/components/ui/card";

const DailyEntryTurn1 = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editedProductName, setEditedProductName] = useState("");
  const navigate = useNavigate();

  const { isAdminUnlocked, showPasswordDialog, validatePassword, toggleAdminMode, closePasswordDialog } = useAuth();
  const { products, coffeeTypes, addProduct, deleteProduct, updateProduct, resetToDefaults } = useProductList();

  const {
    turn1,
    setTurn1,
    updateTurn1Product,
    saveForNextDay,
    handleReceiptDataT1,
  } = useTurnData({ products, coffeeTypes, selectedDate });

  const isPastDate = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return selectedDate < today;
  }, [selectedDate]);

  const isFieldDisabled = useCallback(() => {
    return isPastDate() && !isAdminUnlocked;
  }, [isPastDate, isAdminUnlocked]);

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
      setTurn1(prev => {
        const newProducts = { ...prev.products };
        const oldData = newProducts[oldName];
        delete newProducts[oldName];
        newProducts[editedProductName.trim()] = oldData;
        return { ...prev, products: newProducts };
      });
      cancelEditingProduct();
    }
  }, [editedProductName, updateProduct, cancelEditingProduct, setTurn1]);

  const updateTurn1Field = useCallback((field: keyof TurnData, value: number) => {
    setTurn1(prev => ({ ...prev, [field]: value }));
  }, [setTurn1]);

  const updateTurn1Coffee = useCallback((coffee: string, value: number) => {
    setTurn1(prev => ({
      ...prev,
      coffee: { ...prev.coffee, [coffee]: value }
    }));
  }, [setTurn1]);

  const handleSave = useCallback(() => {
    saveForNextDay();
    toast.success(`Të dhënat u ruajtën! Xhiro: ${turn1.xhiro.toLocaleString()} ALL`);
  }, [saveForNextDay, turn1.xhiro]);

  return (
    <Layout>
      <div className="space-y-6 pb-20 md:pb-6">
        {isPastDate() && !isAdminUnlocked && (
          <div className="rounded-lg border border-warning/50 bg-warning/10 p-4">
            <p className="text-sm font-medium text-warning">
              🔒 Po shikon të dhëna nga e kaluara. Vetëm shikimi është i lejuar. Për të modifikuar, hyr si Admin.
            </p>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Turni 1</h2>
            <p className="text-muted-foreground">Regjistro shitjet dhe inventarin për turnin e parë</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/daily")}
              className="text-xs gap-2"
            >
              <LayoutGrid className="h-3 w-3" />
              Overview
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

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Xhiro Turni 1</p>
              <p className="text-2xl font-bold">{turn1.xhiro.toLocaleString()} ALL</p>
            </div>
          </CardContent>
        </Card>

        <TurnSection
          turnName="1"
          turnData={turn1}
          products={products}
          coffeeTypes={coffeeTypes}
          isAdminUnlocked={isAdminUnlocked}
          isFieldDisabled={isFieldDisabled()}
          showCopyButton={false}
          onProductUpdate={updateTurn1Product}
          onCoffeeUpdate={updateTurn1Coffee}
          onTurnUpdate={updateTurn1Field}
          onMulliriPerfundUpdate={(value) => updateTurn1Field('mulliriPerfund', value)}
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

        <div className="flex justify-end">
          <Button onClick={handleSave}>
            💾 Ruaj të Dhënat
          </Button>
        </div>

        <ProductMappingManager products={products} coffeeTypes={coffeeTypes} onResetProducts={resetToDefaults} />

        <AdminPasswordDialog
          isOpen={showPasswordDialog}
          onClose={closePasswordDialog}
          onSubmit={validatePassword}
        />
      </div>
    </Layout>
  );
};

export default DailyEntryTurn1;
