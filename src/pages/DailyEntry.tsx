import { useState, useCallback, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Lock, Unlock, Printer, LockKeyhole, UnlockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { ProductMappingManager } from "@/components/ProductMappingManager";
import { InvoiceMappingManager } from "@/components/InvoiceMappingManager";
import { AdminPasswordDialog } from "@/components/DailyEntry/AdminPasswordDialog";
import { StaffPinVerifyDialog } from "@/components/DailyEntry/StaffPinVerifyDialog";
import { TurnSection } from "@/components/DailyEntry/TurnSection";
import { PrintableTurnReport } from "@/components/DailyEntry/PrintableTurnReport";
import { useAuth } from "@/hooks/useAuth";
import { useProductList } from "@/hooks/useProductList";
import { useTurnData } from "@/hooks/useTurnData";
import { useTurnLock } from "@/hooks/useTurnLock";
import { useKitchenProducts } from "@/hooks/useKitchenProducts";
import { useAlcoholicDrinksList } from "@/hooks/useAlcoholicDrinksList";
import { useAlcoholicDrinks } from "@/hooks/useAlcoholicDrinks";
import { AlcoholicDrinksService } from "@/services/alcoholic-drinks.service";
import { TurnData } from "@/types/turn.types";

const DailyEntry = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editedProductName, setEditedProductName] = useState("");
  const [activeTurn, setActiveTurn] = useState<"turn1" | "turn2">("turn1");
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [verifiedStaff, setVerifiedStaff] = useState<string | null>(null);

  // Custom hooks
  const { isAdminUnlocked, showPasswordDialog, validatePassword, toggleAdminMode, closePasswordDialog, isWithinStaffEditWindow } = useAuth();
  const { products, coffeeTypes, addProduct: originalAddProduct, deleteProduct: originalDeleteProduct, updateProduct, addCoffeeType: originalAddCoffeeType, deleteCoffeeType: originalDeleteCoffeeType } = useProductList();
  const { kitchenProducts } = useKitchenProducts();
  const { alcoholicDrinks } = useAlcoholicDrinksList();
  const { turn1Drinks, turn2Drinks, setTurn1Drinks, setTurn2Drinks } = useAlcoholicDrinks(selectedDate);
  const { lockState, lockTurn, unlockTurn, isTurnLocked, getLockedBy } = useTurnLock(selectedDate);
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
    saveStatus,
  } = useTurnData({ products, coffeeTypes, selectedDate });

  // Wrapper për addProduct që përditëson edhe turn data
  const addProduct = useCallback(async (productName: string) => {
    const success = await originalAddProduct(productName);
    if (success) {
      // Shto produktin e ri në turn1 dhe turn2 me vlera 0
      const newProductData = {
        stokFillim: 0,
        gjendje: 0,
        shiriti: 0,
        furnizime: 0
      };
      setTurn1(prev => ({
        ...prev,
        products: { ...prev.products, [productName.trim()]: newProductData }
      }));
      setTurn2(prev => ({
        ...prev,
        products: { ...prev.products, [productName.trim()]: newProductData }
      }));
    }
    return success;
  }, [originalAddProduct, setTurn1, setTurn2]);

  // Wrapper për deleteProduct që përditëson edhe turn data
  const deleteProduct = useCallback(async (productName: string) => {
    await originalDeleteProduct(productName);
    setTurn1(prev => {
      const newProducts = { ...prev.products };
      delete newProducts[productName];
      return { ...prev, products: newProducts };
    });
    setTurn2(prev => {
      const newProducts = { ...prev.products };
      delete newProducts[productName];
      return { ...prev, products: newProducts };
    });
  }, [originalDeleteProduct, setTurn1, setTurn2]);

  // Wrapper për addCoffeeType që përditëson edhe turn data
  const addCoffeeType = useCallback(async (coffeeName: string) => {
    const success = await originalAddCoffeeType(coffeeName);
    if (success) {
      // Shto kafenë e re në turn1 dhe turn2 me vlera 0
      setTurn1(prev => ({
        ...prev,
        coffee: { ...prev.coffee, [coffeeName.trim()]: 0 }
      }));
      setTurn2(prev => ({
        ...prev,
        coffee: { ...prev.coffee, [coffeeName.trim()]: 0 }
      }));
    }
    return success;
  }, [originalAddCoffeeType, setTurn1, setTurn2]);

  // Wrapper për deleteCoffeeType që përditëson edhe turn data
  const deleteCoffeeType = useCallback(async (coffeeName: string) => {
    await originalDeleteCoffeeType(coffeeName);
    setTurn1(prev => {
      const newCoffee = { ...prev.coffee };
      delete newCoffee[coffeeName];
      return { ...prev, coffee: newCoffee };
    });
    setTurn2(prev => {
      const newCoffee = { ...prev.coffee };
      delete newCoffee[coffeeName];
      return { ...prev, coffee: newCoffee };
    });
  }, [originalDeleteCoffeeType, setTurn1, setTurn2]);

  // Reset staff verification when date changes
  useEffect(() => {
    setVerifiedStaff(null);
    setShowPinDialog(true);
  }, [selectedDate]);

  // Check staff verification when switching turns
  const handleTurnChange = (turnValue: string) => {
    if (!verifiedStaff) {
      setShowPinDialog(true);
    } else {
      setActiveTurn(turnValue as "turn1" | "turn2");
    }
  };

  const handlePinVerified = (staffName: string) => {
    console.log('✅ PIN verified for:', staffName);
    setVerifiedStaff(staffName);
    // Dialog do të mbyllet automatikisht nga StaffPinVerifyDialog
  };

  const handlePinDialogClose = (open: boolean) => {
    console.log('🚪 Dialog close event:', open, 'verifiedStaff:', verifiedStaff);
    
    setShowPinDialog(open);
    
    if (!open && !verifiedStaff) {
      // Dialogi u mbyll pa verifikim - useri anuloi
      console.log('⚠️ Dialog closed without verification');
    }
  };

  // Date validation
  const isPastDate = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return selectedDate < today;
  }, [selectedDate]);

  const isYesterday = useCallback(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];
    return selectedDate === yesterdayDate;
  }, [selectedDate]);

  const isFieldDisabled = useCallback(() => {
    // Nëse është admin, nuk ka kufizime
    if (isAdminUnlocked) return false;
    
    // Nëse stafi nuk ka bërë verifikimin me PIN, blloko të gjitha field-et
    if (!verifiedStaff) return true;
    
    // Kontrollo nëse turni aktiv është i kyçur
    const currentTurnNumber = activeTurn === 'turn1' ? 1 : 2;
    if (isTurnLocked(currentTurnNumber as 1 | 2)) {
      return true;
    }
    
    // Nëse është dita e djeshme dhe jemi brenda 10 minutave pas mesnatës, lejo modifikimin
    if (isYesterday() && isWithinStaffEditWindow()) {
      return false;
    }
    
    // Përndryshe, blloko nëse është datë e kaluar
    return isPastDate();
  }, [isPastDate, isYesterday, isAdminUnlocked, isWithinStaffEditWindow, verifiedStaff, activeTurn, isTurnLocked]);

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

  const handleApplySupplies = useCallback((mapping: any) => {
    console.log("Applying supplies from mapping:", mapping);
    console.log("Active turn:", activeTurn);
    
    for (const [invoiceName, mappedItem] of Object.entries(mapping)) {
      const item = mappedItem as any;
      if (!item.name) continue;
      
      const quantity = item.quantity || 1;
      console.log(`Applying ${quantity} of ${item.name} (type: ${item.type}) to ${activeTurn}`);
      
      if (item.type === 'product') {
        // Update product furnizime in active turn
        if (activeTurn === 'turn1') {
          updateTurn1Product(item.name, 'furnizime', quantity);
        } else {
          updateTurn2Product(item.name, 'furnizime', quantity);
        }
      } else if (item.type === 'coffee') {
        // For coffee, we don't have furnizime field in the current structure
        console.log("Coffee supplies not yet implemented");
      } else if (item.type === 'kitchen') {
        console.log("Kitchen supplies not yet implemented");
      } else if (item.type === 'alcoholic') {
        console.log("Alcoholic supplies not yet implemented");
      }
    }
  }, [updateTurn1Product, updateTurn2Product, activeTurn]);

  // Test localStorage
  const testLocalStorage = useCallback(() => {
    try {
      const testKey = 'test_storage_key';
      const testValue = { test: 'data', time: new Date().toISOString() };
      
      // Try to write
      localStorage.setItem(testKey, JSON.stringify(testValue));
      
      // Try to read
      const retrieved = localStorage.getItem(testKey);
      
      if (retrieved) {
        const parsed = JSON.parse(retrieved);
        localStorage.removeItem(testKey);
        toast.success('✅ localStorage PUNON!');
      } else {
        toast.error('❌ localStorage NUK punon - nuk lexon dot!');
      }
    } catch (error) {
      toast.error(`❌ localStorage ERROR: ${error}`);
    }
  }, []);

  // Save handler
  const handleSave = useCallback(async () => {
    saveForNextDay();
    
    // Apliko zbritjet e pijeve alkoolike
    await AlcoholicDrinksService.applyAlcoholicDrinksSales(selectedDate);
    
    toast.success(`Të dhënat u ruajtën! Xhiro totale: ${totalXhiro.toLocaleString()} ALL`);
  }, [saveForNextDay, totalXhiro, selectedDate]);

  // Print and lock handler
  const handlePrintAndLock = useCallback(async () => {
    const currentTurnNumber = activeTurn === 'turn1' ? 1 : 2;
    
    // Ruaj të dhënat para printimit
    await handleSave();
    
    // Kyç turnin
    if (verifiedStaff) {
      await lockTurn(currentTurnNumber as 1 | 2, verifiedStaff);
    }
    
    // Printo
    window.print();
  }, [activeTurn, verifiedStaff, handleSave, lockTurn]);

  // Unlock handler (admin only)
  const handleUnlockTurn = useCallback(async (turnNumber: 1 | 2) => {
    if (!isAdminUnlocked) {
      toast.error('Vetëm admini mund të zhbllokojë turnin');
      return;
    }
    await unlockTurn(turnNumber);
  }, [isAdminUnlocked, unlockTurn]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('sq-AL', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Layout>
      <div className="space-y-6 pb-20 md:pb-6">
        {/* Printable Turn Report - shfaqet vetëm kur printohet */}
        <PrintableTurnReport
          turnName={activeTurn === 'turn1' ? '1' : '2'}
          turnData={activeTurn === 'turn1' ? turn1 : turn2}
          products={products}
          coffeeTypes={coffeeTypes}
          selectedDate={selectedDate}
          verifiedStaff={verifiedStaff}
        />
        {/* Past date warning */}
        {isPastDate() && !isAdminUnlocked && !isFieldDisabled() && (
          <div className="rounded-lg border border-success/50 bg-success/10 p-4 print:hidden">
            <p className="text-sm font-medium text-success">
              ✅ Jeni brenda 10 minutave pas mesnatës - mund të modifikoni të dhënat e djeshme.
            </p>
          </div>
        )}
        {isPastDate() && !isAdminUnlocked && isFieldDisabled() && (
          <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 print:hidden">
            <p className="text-sm font-medium text-warning">
              🔒 Po shikon të dhëna nga e kaluara. Vetëm shikimi është i lejuar. Për të modifikuar, hyr si Admin.
            </p>
          </div>
        )}

        {/* Header - Hide most controls when printing */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Regjistrimi Ditor</h2>
            <p className="text-muted-foreground">Regjistro shitjet dhe inventarin për secilin turn</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <InvoiceMappingManager products={products} kitchenProducts={kitchenProducts} alcoholicDrinks={alcoholicDrinks} isAdmin={isAdminUnlocked} onApplySupplies={handleApplySupplies} />
            <ProductMappingManager products={products} coffeeTypes={coffeeTypes} kitchenProducts={kitchenProducts} alcoholicDrinks={alcoholicDrinks} />
            <Button
              variant={isAdminUnlocked ? "default" : "outline"}
              size="sm"
              onClick={toggleAdminMode}
              className="text-xs"
            >
              {isAdminUnlocked ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
              {isAdminUnlocked ? "Admin (Mbyll)" : "Admin"}
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
        <Tabs defaultValue="turn1" className="w-full" value={activeTurn} onValueChange={handleTurnChange}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="turn1" className="flex items-center gap-1">
              {isTurnLocked(1) && <LockKeyhole className="h-3 w-3 text-destructive" />}
              Turni 1 {verifiedStaff && <span className="text-xs ml-1">({verifiedStaff})</span>}
            </TabsTrigger>
            <TabsTrigger value="turn2" className="flex items-center gap-1">
              {isTurnLocked(2) && <LockKeyhole className="h-3 w-3 text-destructive" />}
              Turni 2 {verifiedStaff && <span className="text-xs ml-1">({verifiedStaff})</span>}
            </TabsTrigger>
          </TabsList>

          {/* Turn Lock Warning */}
          {isTurnLocked(activeTurn === 'turn1' ? 1 : 2) && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 mt-4 print:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LockKeyhole className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-sm font-medium text-destructive">
                      🔒 Turni {activeTurn === 'turn1' ? '1' : '2'} është i kyçur
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Kyçur nga: {getLockedBy(activeTurn === 'turn1' ? 1 : 2)} - Nuk mund të modifikohen sasitë
                    </p>
                  </div>
                </div>
                {isAdminUnlocked && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnlockTurn(activeTurn === 'turn1' ? 1 : 2)}
                    className="text-xs"
                  >
                    <UnlockKeyhole className="h-3 w-3 mr-1" />
                    Zhblloko
                  </Button>
                )}
              </div>
            </div>
          )}

          <TabsContent value="turn1" className="space-y-4">
            <TurnSection
              turnName="1"
              turnData={turn1}
              products={products}
              coffeeTypes={coffeeTypes}
              alcoholicDrinks={alcoholicDrinks}
              isAdminUnlocked={isAdminUnlocked}
              isFieldDisabled={isFieldDisabled()}
              isTurnLocked={isTurnLocked(1)}
              showCopyButton
              onProductUpdate={updateTurn1Product}
              onCoffeeUpdate={updateTurn1Coffee}
              onTurnUpdate={updateTurn1Field}
              onMulliriPerfundUpdate={handleMulliriT1Update}
              onCopyToNextTurn={copyT1ToT2}
              onReceiptData={handleReceiptDataT1}
              onAlcoholicDrinksSalesUpdate={setTurn1Drinks}
              alcoholicDrinksSales={turn1Drinks}
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
              alcoholicDrinks={alcoholicDrinks}
              isAdminUnlocked={isAdminUnlocked}
              isFieldDisabled={isFieldDisabled()}
              isTurnLocked={isTurnLocked(2)}
              mulliriFillimDisabled
              onProductUpdate={updateTurn2Product}
              onCoffeeUpdate={updateTurn2Coffee}
              onTurnUpdate={updateTurn2Field}
              onMulliriPerfundUpdate={(value) => updateTurn2Field('mulliriPerfund', value)}
              onReceiptData={handleReceiptDataT2}
              onAlcoholicDrinksSalesUpdate={setTurn2Drinks}
              alcoholicDrinksSales={turn2Drinks}
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

        {/* Summary Card - Printable */}
        <Card className="print-summary">
          <CardHeader className="print:hidden">
            <CardTitle>Përmbledhje</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Print version of summary */}
            <div className="hidden print:block">
              <h4 className="text-lg font-bold mb-4">Përmbledhje e Xhiros</h4>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3 print:grid-cols-3">
              <div className="space-y-1 print:border-r print:border-gray-300 print:pr-4">
                <p className="text-sm text-muted-foreground print:text-gray-600">Xhiro Totale</p>
                <p className="text-2xl font-bold print:text-3xl">{totalXhiro.toLocaleString()} ALL</p>
              </div>
              <div className="space-y-1 print:border-r print:border-gray-300 print:px-4">
                <p className="text-sm text-muted-foreground print:text-gray-600">Xhiro T1</p>
                <p className="text-xl font-semibold">{turn1.xhiro.toLocaleString()} ALL</p>
              </div>
              <div className="space-y-1 print:pl-4">
                <p className="text-sm text-muted-foreground print:text-gray-600">Xhiro T2</p>
                <p className="text-xl font-semibold">{turn2.xhiro.toLocaleString()} ALL</p>
              </div>
            </div>
            
            {/* Storage Test Alert - Hide when printing */}
            <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/50 print:hidden">
              <p className="text-sm font-medium text-warning">
                ⚠️ Nëse të dhënat nuk po ruhen, provo këto:
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1 ml-4">
                <li>• Mbyll tabs të tjera të kësaj faqeje</li>
                <li>• Rifresko faqen (tërhiq poshtë)</li>
                <li>• Kontrollo që "Private Browsing" të jetë OFF</li>
              </ul>
            </div>

            <div className="mt-4 flex gap-2 flex-wrap items-center print:hidden">
              <Button onClick={handleSave} className="flex-1 md:flex-initial">
                💾 Ruaj të Dhënat
              </Button>
              
              {/* Print button - kyç turnin kur printo */}
              {!isTurnLocked(activeTurn === 'turn1' ? 1 : 2) ? (
                <Button onClick={handlePrintAndLock} variant="default" className="flex-1 md:flex-initial bg-primary">
                  <Printer className="h-4 w-4 mr-2" />
                  Printo & Kyç Turnin
                </Button>
              ) : (
                <Button onClick={() => window.print()} variant="outline" className="flex-1 md:flex-initial">
                  <Printer className="h-4 w-4 mr-2" />
                  Riprinto
                </Button>
              )}
              
              <Button onClick={testLocalStorage} variant="outline" className="flex-1 md:flex-initial">
                🔍 Test Storage
              </Button>
              {saveStatus === 'saving' && (
                <span className="text-sm text-muted-foreground">💾 Duke ruajtur...</span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-sm text-success">✅ Ruajtur!</span>
              )}
            </div>
          </CardContent>
        </Card>


        {/* Admin Password Dialog */}
        <AdminPasswordDialog
          isOpen={showPasswordDialog}
          onClose={closePasswordDialog}
          onSubmit={validatePassword}
        />

        {/* Staff PIN Verification Dialog */}
        <StaffPinVerifyDialog
          open={showPinDialog}
          onOpenChange={handlePinDialogClose}
          onVerified={handlePinVerified}
        />
      </div>
    </Layout>
  );
};

export default DailyEntry;
