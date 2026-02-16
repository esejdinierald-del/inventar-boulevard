import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MappingData } from "@/types/mapping.types";
import { findBestMapping } from "@/utils/invoiceMatching";

export interface InvoiceProduct {
  name: string;
  originalName: string;
  invoiceQuantity: number;  // Sasia nga fatura
  invoicePrice: number;     // Çmimi total nga fatura
}

type InvoiceMapping = { 
  [key: string]: { 
    type: 'product' | 'kitchen' | 'alcoholic_drink'; 
    name: string; 
    quantity: number;  // Sa copë për njësi (mapping quantity)
  } 
};

export const useInvoiceMappings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [detectedProducts, setDetectedProducts] = useState<InvoiceProduct[]>([]);
  const [invoiceMapping, setInvoiceMapping] = useState<InvoiceMapping>({});
  const [step, setStep] = useState<'upload' | 'mapping'>('upload');
  const [invoiceTotal, setInvoiceTotal] = useState<number>(0);

  const loadSavedMapping = async () => {
    try {
      const { data, error } = await supabase
        .from('invoice_mappings')
        .select('*');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const mapping: InvoiceMapping = {};
        data.forEach(item => {
          if (item.product_type !== 'coffee') {
            mapping[item.invoice_name] = {
              type: item.product_type as 'product' | 'kitchen' | 'alcoholic_drink',
              name: item.product_name,
              quantity: item.quantity || 1
            };
          }
        });
        setInvoiceMapping(mapping);
        toast.success("Mapimi i faturave u ngarkua!");
      }
    } catch (error) {
      console.error("Error loading invoice mapping:", error);
      toast.error("Gabim gjatë ngarkimit të mapimit");
    }
  };

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imagePromises = Array.from(files).map(file => {
      return new Promise<string>((resolve, reject) => {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} është shumë e madhe! Maksimumi 5MB`);
          reject();
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    try {
      const images = await Promise.all(imagePromises);
      setUploadedImages(images);
      toast.success(`${images.length} foto u ngarkuan!`);
    } catch (error) {
      console.error("Error uploading images:", error);
    }
  };

  const analyzeAllInvoices = async () => {
    if (uploadedImages.length === 0) {
      toast.error("Ngarko të paktën një foto!");
      return;
    }

    setIsProcessing(true);
    const productMap = new Map<string, { totalQty: number; totalPrice: number }>();
    let totalFromInvoices = 0;

    try {
      toast.info(`Po analizon ${uploadedImages.length} fatura...`);

      for (let i = 0; i < uploadedImages.length; i++) {
        const image = uploadedImages[i];
        
        const { data, error } = await supabase.functions.invoke('analyze-invoice', {
          body: { imageBase64: image }
        });

        if (error) {
          console.error(`Error analyzing invoice ${i + 1}:`, error);
          continue;
        }

        if (data && data.success && data.data) {
          if (data.data.total) {
            totalFromInvoices += data.data.total;
          }
          if (data.data.items) {
            data.data.items.forEach((item: { name: string; price?: number }) => {
              if (!productMap.has(item.name)) {
                productMap.set(item.name, { totalQty: 0, totalPrice: item.price || 0 });
              }
            });
          }
        }

        toast.info(`Analizuar ${i + 1}/${uploadedImages.length} fatura...`);
      }

      const uniqueProducts: InvoiceProduct[] = Array.from(productMap.entries()).map(([name, info]) => ({
        name,
        originalName: name,
        invoiceQuantity: info.totalQty,
        invoicePrice: info.totalPrice,
      }));

      setDetectedProducts(uniqueProducts);
      setInvoiceTotal(totalFromInvoices);
      // Auto-map with saved mappings
      const { data: savedMappingsData } = await supabase
        .from('invoice_mappings')
        .select('*');
      
      let savedMapping: MappingData | null = null;
      if (savedMappingsData && savedMappingsData.length > 0) {
        savedMapping = {};
        savedMappingsData.forEach(item => {
          if (item.product_type !== 'coffee') {
            savedMapping![item.invoice_name] = {
              type: item.product_type as 'product' | 'kitchen' | 'alcoholic_drink',
              name: item.product_name,
              quantity: item.quantity || 1
            };
          }
        });
      }
      
      if (savedMapping) {
        const autoMapped: InvoiceMapping = {};
        const matchedProducts: string[] = [];
        
        uniqueProducts.forEach(product => {
          const bestMatch = findBestMapping(product.name, savedMapping);
          if (bestMatch && bestMatch.type !== 'coffee') {
            autoMapped[product.name] = {
              type: bestMatch.type as 'product' | 'kitchen' | 'alcoholic_drink',
              name: bestMatch.name,
              quantity: bestMatch.quantity
            };
            matchedProducts.push(product.name);
          }
        });
        
        setInvoiceMapping(autoMapped);
        
        if (matchedProducts.length > 0) {
          toast.success(`U gjetën ${uniqueProducts.length} produkte! ${matchedProducts.length} u mapuan automatikisht.`);
        } else {
          toast.info(`U gjetën ${uniqueProducts.length} produkte, por asnjë nuk është i mapuar.`);
        }
      } else {
        toast.info(`U gjetën ${uniqueProducts.length} produkte. Admini duhet të krijojë mapping.`);
      }
      
      setStep('mapping');
    } catch (error) {
      console.error("Error analyzing invoices:", error);
      toast.error("Gabim gjatë analizimit të faturave");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMappingChange = (
    invoiceProduct: string, 
    type: 'product' | 'kitchen' | 'alcoholic_drink', 
    name: string
  ) => {
    setInvoiceMapping(prev => ({
      ...prev,
      [invoiceProduct]: { type, name, quantity: prev[invoiceProduct]?.quantity || 1 }
    }));
  };

  const handleQuantityChange = (invoiceProduct: string, quantity: number) => {
    if (invoiceMapping[invoiceProduct]) {
      setInvoiceMapping(prev => ({
        ...prev,
        [invoiceProduct]: { ...prev[invoiceProduct], quantity: quantity || 1 }
      }));
    }
  };

  const handleInvoiceQuantityChange = (productName: string, newQty: number) => {
    setDetectedProducts(prev => prev.map(p => 
      p.name === productName ? { ...p, invoiceQuantity: newQty } : p
    ));
  };

  const saveMapping = async (isAdmin: boolean) => {
    if (!isAdmin) {
      toast.error("Vetëm admin mund të ruajë mapimin!");
      return false;
    }
    
    if (Object.keys(invoiceMapping).length === 0) {
      toast.error("Nuk ka asnjë mapping për të ruajtur!");
      return false;
    }
    
    try {
      for (const [invoiceName, mapping] of Object.entries(invoiceMapping)) {
        const { data: existing } = await supabase
          .from('invoice_mappings')
          .select('id')
          .eq('invoice_name', invoiceName)
          .maybeSingle();
        
        if (existing) {
          const { error: updateError } = await supabase
            .from('invoice_mappings')
            .update({
              product_type: mapping.type,
              product_name: mapping.name,
              quantity: mapping.quantity || 1,
              updated_at: new Date().toISOString()
            })
            .eq('invoice_name', invoiceName);
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from('invoice_mappings')
            .insert({
              invoice_name: invoiceName,
              product_type: mapping.type,
              product_name: mapping.name,
              quantity: mapping.quantity || 1
            });
          if (insertError) throw insertError;
        }
      }
      
      toast.success("Mapimi i faturave u ruajt me sukses!");
      return true;
    } catch (error) {
      console.error("Error saving invoice mapping:", error);
      toast.error("Gabim gjatë ruajtjes së mapimit: " + (error as Error).message);
      return false;
    }
  };

  /**
   * Apliko furnizime duke llogaritue: furnizime_total = sasia_fatures × sasia_mapimit
   * Çmimi mesatar llogaritet kur disa artikuj mapohen tek i njëjti produkt
   */
  const applySupplies = (onApplySupplies?: (mapping: MappingData, invoiceItems?: InvoiceProduct[]) => void) => {
    const mappedProducts = detectedProducts.filter(p => invoiceMapping[p.name]);
    if (mappedProducts.length === 0) {
      toast.error("Nuk ka produkte të mapuara për t'u aplikuar!");
      return false;
    }

    // Llogarit furnizime totale dhe çmim mesatar për çdo produkt destinacion
    const aggregated: { [productName: string]: { type: string; totalUnits: number; totalCost: number } } = {};
    
    mappedProducts.forEach(p => {
      const mapping = invoiceMapping[p.name];
      const totalUnits = p.invoiceQuantity * mapping.quantity;
      const key = `${mapping.type}:${mapping.name}`;
      
      if (aggregated[key]) {
        aggregated[key].totalUnits += totalUnits;
        aggregated[key].totalCost += p.invoicePrice;
      } else {
        aggregated[key] = {
          type: mapping.type,
          totalUnits,
          totalCost: p.invoicePrice,
        };
      }
    });

    // Krijo mapping final me sasinë totale të llogarituar
    const finalMapping: MappingData = {};
    for (const [key, agg] of Object.entries(aggregated)) {
      const [type, name] = [key.substring(0, key.indexOf(':')), key.substring(key.indexOf(':') + 1)];
      const avgPrice = agg.totalUnits > 0 ? Math.round(agg.totalCost / agg.totalUnits) : 0;
      finalMapping[name] = {
        type: type as any,
        name,
        quantity: agg.totalUnits,
      };
      console.log(`📦 ${name}: ${agg.totalUnits} copë, çmim mesatar: ${avgPrice} lekë/copë`);
    }

    if (onApplySupplies) {
      onApplySupplies(finalMapping, mappedProducts);
    }

    // Shfaq përmbythjen
    const summaryLines = Object.entries(aggregated).map(([key, agg]) => {
      const name = key.substring(key.indexOf(':') + 1);
      const avgPrice = agg.totalUnits > 0 ? Math.round(agg.totalCost / agg.totalUnits) : 0;
      return `${name}: ${agg.totalUnits} copë (${avgPrice} lekë/copë)`;
    });

    toast.success(`${Object.keys(aggregated).length} produkte u aplikuan në stok!`, {
      description: summaryLines.join(", "),
      duration: 6000,
    });
    return true;
  };

  const deleteMapping = async (isAdmin: boolean) => {
    if (!isAdmin) {
      toast.error("Vetëm admin mund të fshijë mapimin!");
      return;
    }
    try {
      const { error } = await supabase
        .from('invoice_mappings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) throw error;
      
      setInvoiceMapping({});
      toast.success("Të gjitha mapingjet u fshinë!");
    } catch (error) {
      console.error("Error deleting invoice mapping:", error);
      toast.error("Gabim gjatë fshirjes së mapimit");
    }
  };

  const resetState = () => {
    setUploadedImages([]);
    setDetectedProducts([]);
    setInvoiceMapping({});
    setStep('upload');
    setInvoiceTotal(0);
  };

  const handleOpen = async () => {
    await loadSavedMapping();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetState();
  };

  return {
    isOpen,
    isProcessing,
    uploadedImages,
    detectedProducts,
    invoiceMapping,
    invoiceTotal,
    step,
    setStep,
    handleImagesUpload,
    analyzeAllInvoices,
    handleMappingChange,
    handleQuantityChange,
    handleInvoiceQuantityChange,
    saveMapping,
    applySupplies,
    deleteMapping,
    handleOpen,
    handleClose,
  };
};
