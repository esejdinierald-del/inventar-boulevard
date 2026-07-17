import { useState, useCallback, useEffect } from 'react';
import { StorageService } from '@/services/storage.service';
import { toast } from 'sonner';

const DEFAULT_PRODUCTS = [
  "Kanace", "Uje .vit", "Heineken shishe", "Korona", "Paulaner", 
  "Rose", "Red.bull", "B 52", "Crodino", "Biter", 
  "Bustina", "Uje", "Caj", "Caj bio", "Paulaner Kristal"
];

const DEFAULT_COFFEE_TYPES = [
  "KAFE", "KORRETO", "LATE", "AMERIKANE", "LECE.LECE", "KAPUCIN KAFE"
];

// Normalizimi i emrave të vjetër në të rinj
const PRODUCT_NAME_MIGRATION: { [key: string]: string } = {
  "u.vit": "Uje .vit",
  "heineken 330": "Heineken shishe",
  "korona": "Korona",
  "paulaner": "Paulaner",
  "rose": "Rose",
  "r.bull": "Red.bull",
  "b.52": "B 52",
  "crodino": "Crodino",
  "biter": "Biter",
  "uje": "Uje",
  "caj": "Caj",
  "caj bio": "Caj bio"
};

const normalizeProductName = (name: string): string => {
  return PRODUCT_NAME_MIGRATION[name] || name;
};

/**
 * Hook për listën e produkteve dhe llojeve të kafeve.
 * @param options.dailyOnly Kur true, filtron vetëm produktet/kafet me `track_daily=true`
 *   (përdoret nga faqja e Regjistrimit Ditor). Default: false (kthen të gjitha).
 */
export const useProductList = (options: { dailyOnly?: boolean } = {}) => {
  const { dailyOnly = false } = options;
  const [products, setProducts] = useState<string[]>(DEFAULT_PRODUCTS);
  const [isLoading, setIsLoading] = useState(true);

  const [coffeeTypes, setCoffeeTypes] = useState<string[]>(DEFAULT_COFFEE_TYPES);

  // Load products dhe coffee types nga Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        if (dailyOnly) {
          // Kur filtron sipas track_daily, kërko direkt nga Supabase (StorageService nuk filtron).
          const { supabase } = await import('@/integrations/supabase/client');
          const [{ data: prodData }, { data: coffeeData }] = await Promise.all([
            supabase
              .from('products')
              .select('name')
              .eq('track_daily', true)
              .order('sort_order', { ascending: true }),
            supabase
              .from('coffee_types')
              .select('name')
              .eq('track_daily', true)
              .order('sort_order', { ascending: true }),
          ]);
          if (prodData) {
            const normalized = prodData.map((p) => normalizeProductName(p.name));
            setProducts(normalized);
          }
          if (coffeeData) {
            setCoffeeTypes(coffeeData.map((c) => c.name));
          }
        } else {
          const [savedProducts, savedCoffeeTypes] = await Promise.all([
            StorageService.getProducts(),
            StorageService.getCoffeeTypes()
          ]);

          if (savedProducts && savedProducts.length > 0) {
            // Migro emrat e vjetër në të rinj
            const normalized = savedProducts.map(p => normalizeProductName(p));
            setProducts(normalized);
            // Ruaj emrat e normalizuar
            await StorageService.setProducts(normalized);
          }

          if (savedCoffeeTypes && savedCoffeeTypes.length > 0) {
            setCoffeeTypes(savedCoffeeTypes);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [dailyOnly]);

  const addProduct = useCallback(async (productName: string) => {
    const trimmed = productName.trim();
    
    if (!trimmed) {
      toast.error("Shkruaj emrin e produktit!");
      return false;
    }

    if (products.includes(trimmed)) {
      toast.error("Produkti ekziston tashmë!");
      return false;
    }

    const updatedProducts = [...products, trimmed];
    setProducts(updatedProducts);
    await StorageService.setProducts(updatedProducts);
    toast.success("Produkti u shtua!");
    return true;
  }, [products]);

  const deleteProduct = useCallback(async (productName: string) => {
    const updatedProducts = products.filter(p => p !== productName);
    setProducts(updatedProducts);
    await StorageService.setProducts(updatedProducts);
    toast.success("Produkti u fshi!");
  }, [products]);

  const updateProduct = useCallback(async (oldName: string, newName: string) => {
    const trimmed = newName.trim();

    if (!trimmed) {
      toast.error("Emri i produktit nuk mund të jetë bosh!");
      return false;
    }

    if (trimmed === oldName) {
      return true;
    }

    if (products.includes(trimmed)) {
      toast.error("Produkti me këtë emër ekziston tashmë!");
      return false;
    }

    const updatedProducts = products.map(p => p === oldName ? trimmed : p);
    setProducts(updatedProducts);
    await StorageService.setProducts(updatedProducts);

    // Update product mapping as well
    const mapping = await StorageService.getProductMapping();
    if (mapping) {
      const updatedMapping = { ...mapping };
      Object.entries(mapping).forEach(([key, value]) => {
        if (value.type === 'product' && value.name === oldName) {
          updatedMapping[key] = { type: 'product', name: trimmed, quantity: value.quantity || 1 };
        }
      });
      await StorageService.setProductMapping(updatedMapping);
    }

    toast.success("Emri i produktit dhe mapimet u përditësuan!");
    return true;
  }, [products]);

  const addCoffeeType = useCallback(async (coffeeTypeName: string) => {
    const trimmed = coffeeTypeName.trim();
    
    if (!trimmed) {
      toast.error("Shkruaj emrin e kafes!");
      return false;
    }

    if (coffeeTypes.includes(trimmed)) {
      toast.error("Kjo kafë ekziston tashmë!");
      return false;
    }

    const updatedCoffeeTypes = [...coffeeTypes, trimmed];
    setCoffeeTypes(updatedCoffeeTypes);
    await StorageService.setCoffeeTypes(updatedCoffeeTypes);
    toast.success("Lloji i kafes u shtua!");
    return true;
  }, [coffeeTypes]);

  const deleteCoffeeType = useCallback(async (coffeeTypeName: string) => {
    const updatedCoffeeTypes = coffeeTypes.filter(c => c !== coffeeTypeName);
    setCoffeeTypes(updatedCoffeeTypes);
    await StorageService.setCoffeeTypes(updatedCoffeeTypes);
    toast.success("Lloji i kafes u fshi!");
  }, [coffeeTypes]);

  const updateCoffeeType = useCallback(async (oldName: string, newName: string) => {
    const trimmed = newName.trim();

    if (!trimmed) {
      toast.error("Emri i kafes nuk mund të jetë bosh!");
      return false;
    }

    if (trimmed === oldName) {
      return true;
    }

    if (coffeeTypes.includes(trimmed)) {
      toast.error("Kjo kafë ekziston tashmë!");
      return false;
    }

    const updatedCoffeeTypes = coffeeTypes.map(c => c === oldName ? trimmed : c);
    setCoffeeTypes(updatedCoffeeTypes);
    await StorageService.setCoffeeTypes(updatedCoffeeTypes);

    // Update coffee mapping as well
    const mapping = await StorageService.getProductMapping();
    if (mapping) {
      const updatedMapping = { ...mapping };
      Object.entries(mapping).forEach(([key, value]) => {
        if (value.type === 'coffee' && value.name === oldName) {
          updatedMapping[key] = { type: 'coffee', name: trimmed, quantity: value.quantity || 1 };
        }
      });
      await StorageService.setProductMapping(updatedMapping);
    }

    toast.success("Emri i kafes dhe mapimet u përditësuan!");
    return true;
  }, [coffeeTypes]);

  return {
    products,
    coffeeTypes,
    addProduct,
    deleteProduct,
    updateProduct,
    addCoffeeType,
    deleteCoffeeType,
    updateCoffeeType,
    isLoading,
  };
};
