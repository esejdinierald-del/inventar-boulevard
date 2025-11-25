import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MappingData } from "@/types/mapping.types";
import { findBestMapping } from "@/utils/invoiceMatching";

interface InvoiceProduct {
  name: string;
  originalName: string;
}

type InvoiceMapping = { 
  [key: string]: { 
    type: 'product' | 'kitchen' | 'alcoholic_drink'; 
    name: string; 
    quantity: number 
  } 
};

export const useInvoiceMappings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [detectedProducts, setDetectedProducts] = useState<InvoiceProduct[]>([]);
  const [invoiceMapping, setInvoiceMapping] = useState<InvoiceMapping>({});
  const [step, setStep] = useState<'upload' | 'mapping'>('upload');

  const loadSavedMapping = async () => {
    try {
      const { data, error } = await supabase
        .from('invoice_mappings')
        .select('*');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const mapping: InvoiceMapping = {};
        data.forEach(item => {
          // Injoro mappings të kafesë (duhet të jenë vetëm për shitje)
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
    const allProducts = new Set<string>();

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

        if (data && data.success && data.data && data.data.items) {
          data.data.items.forEach((item: { name: string }) => {
            allProducts.add(item.name);
          });
        }

        toast.info(`Analizuar ${i + 1}/${uploadedImages.length} fatura...`);
      }

      const uniqueProducts: InvoiceProduct[] = Array.from(allProducts).map(name => ({
        name,
        originalName: name
      }));

      setDetectedProducts(uniqueProducts);
      
      // Ngarko mappings e ruajtura nga databaza dhe apliko automatikisht me fuzzy matching
      const { data: savedMappingsData } = await supabase
        .from('invoice_mappings')
        .select('*');
      
      let savedMapping: MappingData | null = null;
      if (savedMappingsData && savedMappingsData.length > 0) {
        savedMapping = {};
        savedMappingsData.forEach(item => {
          // Injoro mappings të kafesë (duhet të jenë vetëm për shitje)
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
        
        const mappedCount = matchedProducts.length;
        if (mappedCount > 0) {
          toast.success(`U gjetën ${uniqueProducts.length} produkte! ${mappedCount} u mapuan automatikisht.`, {
            description: matchedProducts.slice(0, 3).join(", ") + (mappedCount > 3 ? "..." : "")
          });
        } else {
          toast.info(`U gjetën ${uniqueProducts.length} produkte unike, por asnjë nuk është i mapuar.`);
        }
      } else {
        toast.info(`U gjetën ${uniqueProducts.length} produkte unike. Admini duhet të krijojë mapping.`);
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
    const newMapping = {
      ...invoiceMapping,
      [invoiceProduct]: { type, name, quantity: invoiceMapping[invoiceProduct]?.quantity || 1 }
    };
    setInvoiceMapping(newMapping);
  };

  const handleQuantityChange = (invoiceProduct: string, quantity: number) => {
    if (invoiceMapping[invoiceProduct]) {
      setInvoiceMapping({
        ...invoiceMapping,
        [invoiceProduct]: { ...invoiceMapping[invoiceProduct], quantity: quantity || 1 }
      });
    }
  };

  const saveMapping = async (isAdmin: boolean) => {
    if (!isAdmin) {
      toast.error("Vetëm admin mund të ruajë mapimin!");
      return;
    }
    
    if (Object.keys(invoiceMapping).length === 0) {
      toast.error("Nuk ka asnjë mapping për të ruajtur!");
      return;
    }
    
    try {
      // Konverto mapping object në array për insert
      const mappingsToInsert = Object.entries(invoiceMapping).map(([invoiceName, mapping]) => ({
        invoice_name: invoiceName,
        product_type: mapping.type,
        product_name: mapping.name,
        quantity: mapping.quantity || 1
      }));
      
      // Fshij mappings ekzistuese dhe shto të rejat
      const { error: deleteError } = await supabase
        .from('invoice_mappings')
        .delete()
        .in('invoice_name', Object.keys(invoiceMapping));
      
      if (deleteError) throw deleteError;
      
      const { error: insertError } = await supabase
        .from('invoice_mappings')
        .insert(mappingsToInsert);
      
      if (insertError) throw insertError;
      
      toast.success("Mapimi i faturave u ruajt me sukses!");
      return true;
    } catch (error) {
      console.error("Error saving invoice mapping:", error);
      toast.error("Gabim gjatë ruajtjes së mapimit: " + (error as Error).message);
      return false;
    }
  };

  const applySupplies = (onApplySupplies?: (mapping: MappingData) => void) => {
    const mappedProducts = detectedProducts.filter(p => invoiceMapping[p.name]);
    if (mappedProducts.length === 0) {
      toast.error("Nuk ka produkte të mapuara për t'u aplikuar!");
      return false;
    }

    if (onApplySupplies) {
      onApplySupplies(invoiceMapping);
    }

    toast.success(`${mappedProducts.length} produkte u aplikuan në stok!`, {
      description: mappedProducts.map(p => {
        const mapping = invoiceMapping[p.name];
        return `${mapping.name} (${mapping.quantity})`;
      }).join(", ")
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
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Fshij të gjitha
      
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
    // State
    isOpen,
    isProcessing,
    uploadedImages,
    detectedProducts,
    invoiceMapping,
    step,
    
    // Actions
    setStep,
    handleImagesUpload,
    analyzeAllInvoices,
    handleMappingChange,
    handleQuantityChange,
    saveMapping,
    applySupplies,
    deleteMapping,
    handleOpen,
    handleClose,
  };
};
