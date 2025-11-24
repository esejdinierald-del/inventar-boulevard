import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useKitchenProducts = () => {
  const [kitchenProducts, setKitchenProducts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load kitchen products from Supabase
  useEffect(() => {
    const loadKitchenProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('kitchen_products')
          .select('name')
          .order('sort_order', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setKitchenProducts(data.map(p => p.name));
        }
      } catch (error) {
        console.error('Error loading kitchen products:', error);
        toast.error('Gabim në ngarkimin e produkteve të kuzhinës');
      } finally {
        setIsLoading(false);
      }
    };
    loadKitchenProducts();
  }, []);

  const addKitchenProduct = useCallback(async (productName: string) => {
    const trimmed = productName.trim();
    
    if (!trimmed) {
      toast.error("Shkruaj emrin e produktit!");
      return false;
    }

    if (kitchenProducts.includes(trimmed)) {
      toast.error("Produkti ekziston tashmë!");
      return false;
    }

    try {
      const { error } = await supabase
        .from('kitchen_products')
        .insert({
          name: trimmed,
          sort_order: kitchenProducts.length
        });
      
      if (error) throw error;
      
      setKitchenProducts(prev => [...prev, trimmed]);
      toast.success("Produkti u shtua!");
      return true;
    } catch (error) {
      console.error('Error adding kitchen product:', error);
      toast.error("Gabim në shtimin e produktit");
      return false;
    }
  }, [kitchenProducts]);

  const deleteKitchenProduct = useCallback(async (productName: string) => {
    try {
      const { error } = await supabase
        .from('kitchen_products')
        .delete()
        .eq('name', productName);
      
      if (error) throw error;
      
      setKitchenProducts(prev => prev.filter(p => p !== productName));
      toast.success("Produkti u fshi!");
    } catch (error) {
      console.error('Error deleting kitchen product:', error);
      toast.error("Gabim në fshirjen e produktit");
    }
  }, []);

  const updateKitchenProduct = useCallback(async (oldName: string, newName: string) => {
    const trimmed = newName.trim();

    if (!trimmed) {
      toast.error("Emri i produktit nuk mund të jetë bosh!");
      return false;
    }

    if (trimmed === oldName) {
      return true;
    }

    if (kitchenProducts.includes(trimmed)) {
      toast.error("Produkti me këtë emër ekziston tashmë!");
      return false;
    }

    try {
      const { error } = await supabase
        .from('kitchen_products')
        .update({ name: trimmed })
        .eq('name', oldName);
      
      if (error) throw error;
      
      setKitchenProducts(prev => prev.map(p => p === oldName ? trimmed : p));
      
      // Update product mapping for kitchen products
      const { data: mappings } = await supabase
        .from('product_mappings')
        .select('*')
        .eq('product_type', 'kitchen')
        .eq('product_name', oldName);
      
      if (mappings && mappings.length > 0) {
        await supabase
          .from('product_mappings')
          .update({ product_name: trimmed })
          .eq('product_type', 'kitchen')
          .eq('product_name', oldName);
      }
      
      toast.success("Produkti u përditësua!");
      return true;
    } catch (error) {
      console.error('Error updating kitchen product:', error);
      toast.error("Gabim në përditësimin e produktit");
      return false;
    }
  }, [kitchenProducts]);

  return {
    kitchenProducts,
    addKitchenProduct,
    deleteKitchenProduct,
    updateKitchenProduct,
    isLoading,
  };
};
