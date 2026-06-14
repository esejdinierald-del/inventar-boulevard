import { useState, useCallback, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Lock, Unlock, Printer, LockKeyhole, UnlockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProductMappingManager } from "@/components/ProductMappingManager";
import { InvoiceMappingManager } from "@/components/InvoiceMappingManager";
import { AdminPasswordDialog } from "@/components/DailyEntry/AdminPasswordDialog";
import { StaffPinVerifyDialog, VerifiedStaffData } from "@/components/DailyEntry/StaffPinVerifyDialog";
import { TurnSection } from "@/components/DailyEntry/TurnSection";
import { PrintableTurnReport } from "@/components/DailyEntry/PrintableTurnReport";
import { useAuth } from "@/hooks/useAuth";
import { useProductList } from "@/hooks/useProductList";
import { useTurnData } from "@/hooks/useTurnData";
import { useTurnLock } from "@/hooks/useTurnLock";
import { useKitchenProducts } from "@/hooks/useKitchenProducts";
import { useAlcoholicDrinksList } from "@/hooks/useAlcoholicDrinksList";
import { AlcoholicDrinksService } from "@/services/alcoholic-drinks.service";
import { TurnData, ShpenzimiData } from "@/types/turn.types";

const TODAY = () => new Date().toISOString().split('T')[0];

const DailyEntry = () => {
  const [selectedDate, setSelectedDate] = useState(TODAY());
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editedProductName, setEditedProductName] = useState("");
  const [activeTurn, setActiveTurn] = useState<"turn1" | "turn2">("turn1");
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [verifiedStaff, setVerifiedStaff] = useState<string | null>(null);
  const [verifiedStaffData, setVerifiedStaffData] = useState<VerifiedStaffData | null>(null);
  // Gjendje e konfirmuar nga stafi për ditën/turnin aktual (ruhet në localStorage)
  const [gjendjeUploaded, setGjendjeUploaded] = useState<{ turn1: boolean; turn2: boolean }>({ turn1: false, turn2: false });
  // Kyçja 10-orëshe e kolonës Gjendje pas printit (timestamp ms i skadimit, per turn)
  const [gjendjePrintLockUntil, setGjendjePrintLockUntil] = useState<{ turn1: number | null; turn2: number | null }>({ turn1: null, turn2: null });
  // Ticker që rifreskon UI-në kur skadon kyçja
  const [nowTick, setNowTick] = useState<number>(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  // Lexo kyçjen e printit nga localStorage për datën aktuale
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`gjendjePrintLockUntil:${selectedDate}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        setGjendjePrintLockUntil({
          turn1: typeof parsed.turn1 === 'number' ? parsed.turn1 : null,
          turn2: typeof parsed.turn2 === 'number' ? parsed.turn2 : null,
        });
      } else {
        setGjendjePrintLockUntil({ turn1: null, turn2: null });
      }
    } catch {
      setGjendjePrintLockUntil({ turn1: null, turn2: null });
    }
  }, [selectedDate]);
  const isGjendjePrintLocked = (turn: 'turn1' | 'turn2') => {
    const until = gjendjePrintLockUntil[turn];
    return !!until && until > nowTick;
  };

  // Custom hooks
  const { isAdminUnlocked, isViewOnlyUnlocked, showPasswordDialog, showViewOnlyDialog, validatePassword, validateViewOnlyPassword, toggleAdminMode, requestViewOnly, closePasswordDialog, closeViewOnlyDialog, isWithinStaffEditWindow, unlockAdmin } = useAuth();
  const { products, coffeeTypes, addProduct: originalAddProduct, deleteProduct: originalDeleteProduct, updateProduct, addCoffeeType: originalAddCoffeeType, deleteCoffeeType: originalDeleteCoffeeType } = useProductList();
  const { kitchenProducts } = useKitchenProducts();
  const { alcoholicDrinks } = useAlcoholicDrinksList();
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
    forceSaveNextDayStock,
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
    setVerifiedStaffData(null);
    setShowPinDialog(true);
  }, [selectedDate]);

  // Lexo gjendjeUploaded nga localStorage për datën aktuale
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`gjendjeUploaded:${selectedDate}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        setGjendjeUploaded({ turn1: !!parsed.turn1, turn2: !!parsed.turn2 });
      } else {
        setGjendjeUploaded({ turn1: false, turn2: false });
      }
    } catch {
      setGjendjeUploaded({ turn1: false, turn2: false });
    }
  }, [selectedDate]);

  const confirmGjendje = useCallback((turn: 'turn1' | 'turn2') => {
    setGjendjeUploaded(prev => {
      const next = { ...prev, [turn]: true };
      try {
        localStorage.setItem(`gjendjeUploaded:${selectedDate}`, JSON.stringify(next));
      } catch (e) {
        console.warn('Nuk u ruajt gjendjeUploaded:', e);
      }
      return next;
    });
    toast.success(`Gjendja u ngarkua për Turnin ${turn === 'turn1' ? '1' : '2'}`);
  }, [selectedDate]);

  /** Admin-only: riaktivizon stafin që të modifikojë sërish Gjendjen e turnit. */
  const unlockGjendje = useCallback((turn: 'turn1' | 'turn2') => {
    if (!isAdminUnlocked) {
      toast.error("Vetëm admini mund të riaktivizojë stafin");
      return;
    }
    setGjendjeUploaded(prev => {
      const next = { ...prev, [turn]: false };
      try {
        localStorage.setItem(`gjendjeUploaded:${selectedDate}`, JSON.stringify(next));
      } catch (e) {
        console.warn('Nuk u ruajt gjendjeUploaded:', e);
      }
      return next;
    });
    toast.success(`Stafi u riaktivizua të modifikojë Gjendjen e Turnit ${turn === 'turn1' ? '1' : '2'}`);
  }, [isAdminUnlocked, selectedDate]);

  // Check staff verification when switching turns
  const handleTurnChange = (turnValue: string) => {
    if (!verifiedStaff) {
      setShowPinDialog(true);
    } else {
      setActiveTurn(turnValue as "turn1" | "turn2");
    }
  };

  const handlePinVerified = (staffName: string, staffData?: VerifiedStaffData) => {
    console.log('✅ PIN verified for:', staffName, 'isManager:', staffData?.isManager);
    setVerifiedStaff(staffName);
    setVerifiedStaffData(staffData || null);
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

  const isFutureDate = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return selectedDate > today;
  }, [selectedDate]);

  const isToday = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return selectedDate === today;
  }, [selectedDate]);

  const isYesterday = useCallback(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];
    return selectedDate === yesterdayDate;
  }, [selectedDate]);

  // Check if user has elevated access (admin or manager with dashboard permission)
  const hasElevatedAccess = useCallback(() => {
    if (isAdminUnlocked) return true;
    if (verifiedStaffData?.isManager && verifiedStaffData?.permissions?.dashboard) return true;
    return false;
  }, [isAdminUnlocked, verifiedStaffData]);

  // Stafi nuk lejohet në data të kaluara ose të ardhshme — ridrejtoje në sot
  useEffect(() => {
    if (hasElevatedAccess()) return;
    const today = TODAY();
    if (selectedDate !== today) {
      toast.info("Stafi mund të punojë vetëm me datën e sotme");
      setSelectedDate(today);
    }
  }, [selectedDate, hasElevatedAccess]);

  const isFieldDisabled = useCallback(() => {
    // Nëse është admin ose menaxher me të drejta dashboard, nuk ka kufizime për datat
    if (hasElevatedAccess()) return false;
    
    // Nëse stafi nuk ka bërë verifikimin me PIN, blloko të gjitha field-et
    if (!verifiedStaff) return true;
    
    // Kontrollo nëse turni aktiv është i kyçur
    const currentTurnNumber = activeTurn === 'turn1' ? 1 : 2;
    if (isTurnLocked(currentTurnNumber as 1 | 2)) {
      return true;
    }
    
    // STAFI: Vetëm data aktuale ose e djeshme brenda 4 orëve pas mesnatës
    // Data e ardhshme dhe e kaluar (përveç dita djeshme brenda 4 orëve) janë të bllokuara
    
    // Nëse është dita e djeshme dhe jemi brenda 4 orëve pas mesnatës, lejo modifikimin
    if (isYesterday() && isWithinStaffEditWindow()) {
      return false;
    }
    
    // Nëse është sot, lejo modifikimin
    if (isToday()) {
      return false;
    }
    
    // Të gjitha datat e tjera (e kaluara dhe e ardhshme) janë të bllokuara për stafin
    return true;
  }, [isToday, isPastDate, isYesterday, hasElevatedAccess, isWithinStaffEditWindow, verifiedStaff, activeTurn, isTurnLocked]);

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

  // Shpenzime handlers for Turn 1
  const addShpenzimiT1 = useCallback((shpenzimi: ShpenzimiData) => {
    setTurn1(prev => ({
      ...prev,
      shpenzime: [...(prev.shpenzime || []), shpenzimi]
    }));
  }, []);

  const removeShpenzimiT1 = useCallback((index: number) => {
    setTurn1(prev => ({
      ...prev,
      shpenzime: (prev.shpenzime || []).filter((_, i) => i !== index)
    }));
  }, []);

  const updateShpenzimiT1 = useCallback((index: number, field: keyof ShpenzimiData, value: string | number) => {
    setTurn1(prev => ({
      ...prev,
      shpenzime: (prev.shpenzime || []).map((s, i) => 
        i === index ? { ...s, [field]: value } : s
      )
    }));
  }, []);

  // Shpenzime handlers for Turn 2
  const addShpenzimiT2 = useCallback((shpenzimi: ShpenzimiData) => {
    setTurn2(prev => ({
      ...prev,
      shpenzime: [...(prev.shpenzime || []), shpenzimi]
    }));
  }, []);

  const removeShpenzimiT2 = useCallback((index: number) => {
    setTurn2(prev => ({
      ...prev,
      shpenzime: (prev.shpenzime || []).filter((_, i) => i !== index)
    }));
  }, []);

  const updateShpenzimiT2 = useCallback((index: number, field: keyof ShpenzimiData, value: string | number) => {
    setTurn2(prev => ({
      ...prev,
      shpenzime: (prev.shpenzime || []).map((s, i) => 
        i === index ? { ...s, [field]: value } : s
      )
    }));
  }, []);

  const handleMulliriT1Update = useCallback((value: number) => {
    updateTurn1Field('mulliriPerfund', value);
    syncMulliriT1ToT2(value);
  }, [updateTurn1Field, syncMulliriT1ToT2]);

  const handleApplySupplies = useCallback(async (mapping: any) => {
    console.log("Applying supplies from mapping:", mapping);
    console.log("Active turn:", activeTurn);

    // Bllokim: stafi nuk mund të ngarkojë furnizime në data jo të sotme
    if (!hasElevatedAccess() && selectedDate !== TODAY()) {
      toast.error("Nuk mund të ngarkohen furnizime për data jo të sotme");
      return;
    }

    const alcoholicUpdates: { name: string; quantity: number }[] = [];
    
    
    for (const [invoiceName, mappedItem] of Object.entries(mapping)) {
      const item = mappedItem as any;
      if (!item.name) continue;
      
      const quantity = item.quantity || 1;
      console.log(`Applying ${quantity} of ${item.name} (type: ${item.type}) to ${activeTurn}`);
      
      if (item.type === 'product') {
        // ADD to existing furnizime (not replace)
        if (activeTurn === 'turn1') {
          const currentFurnizime = turn1.products[item.name]?.furnizime || 0;
          updateTurn1Product(item.name, 'furnizime', currentFurnizime + quantity);
        } else {
          const currentFurnizime = turn2.products[item.name]?.furnizime || 0;
          updateTurn2Product(item.name, 'furnizime', currentFurnizime + quantity);
        }
      } else if (item.type === 'coffee') {
        // Kafeja mbahet në copa - furnizimet janë kg kafe të bluar, jo copa
        // Do të implementohet si inventar i veçantë nëse nevojitet
        console.log(`Coffee supplies: ${item.name} x${quantity} (struktura aktuale nuk e mbështet)`);
        toast.info(`Kafe furnizime: ${item.name} - duhet inventar i veçantë për kg kafe`);
      } else if (item.type === 'kitchen') {
        // Kitchen products nuk kanë inventar në databazë aktualisht
        console.log(`Kitchen supplies: ${item.name} x${quantity}`);
      } else if (item.type === 'alcoholic_drink' || item.type === 'alcoholic') {
        // Grumbullo pijet alkoolike për t'i përditësuar në fund
        alcoholicUpdates.push({ name: item.name, quantity });
      }
    }
    
    // Përditëso furnizimet e pijeve alkoolike në databazë
    if (alcoholicUpdates.length > 0) {
      console.log("Applying alcoholic drinks furnizime:", alcoholicUpdates);
      let successCount = 0;
      
      for (const update of alcoholicUpdates) {
        try {
          // Merr gjendjen aktuale
          const { data: drink, error: fetchError } = await supabase
            .from('alcoholic_drinks_inventory')
            .select('*')
            .eq('drink_name', update.name)
            .single();
          
          if (fetchError || !drink) {
            console.warn(`Pije alkoolike nuk u gjet: ${update.name}`);
            toast.error(`Pije alkoolike nuk u gjet: ${update.name}`);
            continue;
          }
          
          // Shto furnizimin në gjendjen aktuale
          const newFurnizime = drink.furnizime + update.quantity;
          const newGjendje = newFurnizime - drink.shitje;
          
          const { error: updateError } = await supabase
            .from('alcoholic_drinks_inventory')
            .update({
              furnizime: newFurnizime,
              gjendje: newGjendje,
              updated_at: new Date().toISOString()
            })
            .eq('drink_name', update.name);
          
          if (updateError) {
            console.error(`Error updating ${update.name}:`, updateError);
            toast.error(`Gabim në përditësimin e ${update.name}`);
          } else {
            console.log(`✅ Furnizim shtuar: ${update.name} +${update.quantity}, total: ${newFurnizime}, gjendje: ${newGjendje}`);
            successCount++;
          }
        } catch (error) {
          console.error(`Error processing ${update.name}:`, error);
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} pije alkoolike u përditësuan me sukses!`);
      }
    }
  }, [updateTurn1Product, updateTurn2Product, activeTurn, turn1, turn2, hasElevatedAccess, selectedDate]);

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
    
    // KRITIKE: Forco ruajtjen e stokut për ditën tjetër para kyçjes
    await forceSaveNextDayStock();
    
    // Kyç turnin
    if (verifiedStaff) {
      await lockTurn(currentTurnNumber as 1 | 2, verifiedStaff);
    }

    // Risfumo Stok Fillim & Dif për stafin (që edhe me PIN tjetër mos i shikojë)
    setGjendjeUploaded(prev => {
      const next = { ...prev, [activeTurn]: false };
      try { localStorage.setItem(`gjendjeUploaded:${selectedDate}`, JSON.stringify(next)); } catch {}
      return next;
    });

    // Printo
    window.print();
  }, [activeTurn, verifiedStaff, handleSave, lockTurn, forceSaveNextDayStock, selectedDate]);

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
          isAdminUnlocked={isAdminUnlocked}
        />
        {/* Date restriction warnings for staff */}
        {isPastDate() && !isAdminUnlocked && !isFieldDisabled() && isYesterday() && (
          <div className="rounded-lg border border-success/50 bg-success/10 p-4 print:hidden">
            <p className="text-sm font-medium text-success">
              ✅ Jeni brenda 4 orëve pas mesnatës - mund të modifikoni të dhënat e djeshme.
            </p>
          </div>
        )}
        
        {/* Block past dates for staff - offer view-only unlock */}
        {!hasElevatedAccess() && verifiedStaff && (isPastDate() || isFutureDate()) && isFieldDisabled() && !isViewOnlyUnlocked && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 print:hidden">
            <div className="flex flex-col items-center gap-4">
              <Lock className="h-12 w-12 text-destructive" />
              <div className="text-center">
                <p className="text-lg font-semibold text-destructive">
                  🔒 Akses i Bllokuar
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {isPastDate() 
                    ? 'Stafi nuk ka akses në të dhënat e datave të kaluara.' 
                    : 'Stafi nuk ka akses në të dhënat e datave të ardhshme.'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Kërko lejen e adminit për të parë këto të dhëna (vetëm lexim).
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={requestViewOnly}>
                  👁️ Kërko Leje Shikimi
                </Button>
                <Button variant="outline" size="sm" onClick={toggleAdminMode}>
                  <Lock className="h-3 w-3 mr-1" />
                  Hyr si Admin
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* View-only mode banner */}
        {!hasElevatedAccess() && isViewOnlyUnlocked && (isPastDate() || isFutureDate()) && (
          <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-4 print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-lg">👁️</span>
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Modalitet Shikimi (Read-Only) — aktiv për 24 orë
                </p>
                <p className="text-xs text-muted-foreground">
                  Po shikon të dhënat e datës {formatDate(selectedDate)}. Nuk mund të bësh ndryshime.
                </p>
              </div>
            </div>
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
                title="Zgjidhni datën"
                min={hasElevatedAccess() ? undefined : TODAY()}
                max={hasElevatedAccess() ? undefined : TODAY()}
              />
            </div>
          </div>
        </div>

        {/* Tabs - Show if user has access or view-only is unlocked */}
        {(!verifiedStaff || hasElevatedAccess() || isViewOnlyUnlocked || !isFieldDisabled() || !(isPastDate() || isFutureDate())) && (
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
              gjendjeUploaded={gjendjeUploaded.turn1}
              onConfirmGjendje={() => confirmGjendje('turn1')}
              onUnlockGjendje={() => unlockGjendje('turn1')}
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
              onShpenzimiAdd={addShpenzimiT1}
              onShpenzimiRemove={removeShpenzimiT1}
              onShpenzimiUpdate={updateShpenzimiT1}
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
              gjendjeUploaded={gjendjeUploaded.turn2}
              onConfirmGjendje={() => confirmGjendje('turn2')}
              onUnlockGjendje={() => unlockGjendje('turn2')}
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
              onShpenzimiAdd={addShpenzimiT2}
              onShpenzimiRemove={removeShpenzimiT2}
              onShpenzimiUpdate={updateShpenzimiT2}
            />
          </TabsContent>
        </Tabs>
        )}

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
            
            {(() => {
              const totalShpenzimeT1 = (turn1.shpenzime || []).reduce((sum, s) => sum + (s.vlera || 0), 0);
              const totalShpenzimeT2 = (turn2.shpenzime || []).reduce((sum, s) => sum + (s.vlera || 0), 0);
              const totalShpenzime = totalShpenzimeT1 + totalShpenzimeT2;
              const xhiroNeto = totalXhiro - totalShpenzime;
              
              return (
                <>
                  {/* Llogaritja: Bruto - Shpenzime = Neto */}
                  <div className="space-y-4">
                    {/* Xhiro Bruto sipas turneve */}
                    <div className="grid gap-4 md:grid-cols-3 print:grid-cols-3">
                      <div className="space-y-1 print:border-r print:border-gray-300 print:pr-4">
                        <p className="text-sm text-muted-foreground print:text-gray-600">Xhiro Bruto</p>
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
                    
                    {/* Shpenzime sipas turneve */}
                    <div className="pt-4 border-t">
                      <div className="grid gap-4 md:grid-cols-3 print:grid-cols-3">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground print:text-gray-600">Shpenzime T1</p>
                          <p className="text-lg font-semibold text-destructive">- {totalShpenzimeT1.toLocaleString()} ALL</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground print:text-gray-600">Shpenzime T2</p>
                          <p className="text-lg font-semibold text-destructive">- {totalShpenzimeT2.toLocaleString()} ALL</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground print:text-gray-600">Total Shpenzime</p>
                          <p className="text-xl font-bold text-destructive">- {totalShpenzime.toLocaleString()} ALL</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Formula finale: Bruto - Shpenzime = Neto */}
                    <div className="pt-4 border-t bg-muted/30 rounded-lg p-4 print:bg-gray-100">
                      <div className="flex flex-wrap items-center justify-center gap-2 text-lg md:text-xl font-semibold">
                        <span>{totalXhiro.toLocaleString()}</span>
                        <span className="text-muted-foreground">−</span>
                        <span className="text-destructive">{totalShpenzime.toLocaleString()}</span>
                        <span className="text-muted-foreground">=</span>
                        <span className="text-primary text-2xl font-bold">{xhiroNeto.toLocaleString()} ALL</span>
                      </div>
                      <p className="text-center text-sm text-muted-foreground mt-2">Bruto − Shpenzime = Xhiro Neto</p>
                    </div>
                  </div>
                </>
              );
            })()}
            
            {/* Fsheh butonat ruaj/printo kur jemi në modalitet read-only */}
            {!(isViewOnlyUnlocked && !hasElevatedAccess() && (isPastDate() || isFutureDate())) && (
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
                
                {saveStatus === 'saving' && (
                  <span className="text-sm text-muted-foreground">💾 Duke ruajtur...</span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-sm text-success">✅ Ruajtur!</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>


        {/* Admin Password Dialog */}
        <AdminPasswordDialog
          isOpen={showPasswordDialog}
          onClose={closePasswordDialog}
          onSubmit={validatePassword}
        />

        {/* View-Only Password Dialog */}
        <AdminPasswordDialog
          isOpen={showViewOnlyDialog}
          onClose={closeViewOnlyDialog}
          onSubmit={validateViewOnlyPassword}
          title="👁️ Leje Shikimi"
          description="Vendos fjalëkalimin e adminit për të lejuar stafin të shikojë datat e kaluara (vetëm lexim)"
        />

        {/* Staff PIN Verification Dialog */}
        <StaffPinVerifyDialog
          open={showPinDialog}
          onOpenChange={handlePinDialogClose}
          onVerified={handlePinVerified}
          onAdminVerified={() => {
            unlockAdmin();
            setShowPinDialog(false);
            setVerifiedStaff("Admin");
          }}
        />
      </div>
    </Layout>
  );
};

export default DailyEntry;
