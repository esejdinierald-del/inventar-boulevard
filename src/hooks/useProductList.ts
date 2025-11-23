import { useState, useCallback, useEffect } from 'react';
import { StorageService } from '@/services/storage.service';
import { toast } from 'sonner';

const DEFAULT_PRODUCTS = [
  "Kanace", "Uje .vit", "Heineken shishe", "Korona", "Paulaner", 
  "Rose", "Red.bull", "B 52", "Crodino", "Biter", 
  "Bustina", "Uje", "Caj", "Caj bio"
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

export const useProductList = () => {
  const [products, setProducts] = useState<string[]>(DEFAULT_PRODUCTS);
  const [isLoading, setIsLoading] = useState(true);

  // Load products nga Supabase
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const saved = await StorageService.getProducts();
        if (saved && saved.length > 0) {
          // Migro emrat e vjetër në të rinj
          const normalized = saved.map(p => normalizeProductName(p));
          setProducts(normalized);
          // Ruaj emrat e normalizuar
          await StorageService.setProducts(normalized);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  const [coffeeTypes] = useState<string[]>(DEFAULT_COFFEE_TYPES);

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

  return {
    products,
    coffeeTypes,
    addProduct,
    deleteProduct,
    updateProduct,
    isLoading,
  };
};
