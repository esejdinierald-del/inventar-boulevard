import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface GrinderPhotoScannerProps {
  onValueExtracted: (value: number) => void;
  turnName: string;
}

export const GrinderPhotoScanner = ({ onValueExtracted, turnName }: GrinderPhotoScannerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedValue, setExtractedValue] = useState<number | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fotoja është shumë e madhe! Maksimumi 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target?.result as string;
      setSelectedImage(imageData);
      setIsProcessing(true);

      try {
        toast.info("Po analizon foton e mullirit...");
        
        const { data, error } = await supabase.functions.invoke('analyze-grinder', {
          body: { imageBase64: imageData }
        });

        if (error) {
          console.error("Error calling analyze-grinder:", error);
          throw new Error(error.message || "Failed to analyze grinder photo");
        }

        if (!data || typeof data.total !== 'number') {
          throw new Error("Invalid response from AI");
        }

        console.log("Grinder total:", data.total);
        setExtractedValue(data.total);
        toast.success(`U lexua: TOTALE ${data.total}`);
      } catch (error) {
        console.error("Error processing image:", error);
        toast.error(error instanceof Error ? error.message : "Gabim gjatë analizimit të fotos");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyValue = () => {
    if (extractedValue === null) {
      toast.error("Nuk ka vlerë për t'u aplikuar");
      return;
    }

    onValueExtracted(extractedValue);
    toast.success(`Vlera ${extractedValue} u vendos në Mulliri Perfund!`);
    setIsOpen(false);
    resetState();
  };

  const resetState = () => {
    setSelectedImage(null);
    setExtractedValue(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetState();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-xs"
        type="button"
      >
        <Camera className="h-3 w-3 mr-1" />
        📸 Ngarko Foto Mulliri
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ngarko Foto të Mullirit - {turnName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Ngarko foton e ekranit të mullirit</Label>
              <p className="text-xs text-muted-foreground">
                Fotoja duhet të tregojë qartë vlerën TOTALE
              </p>
            </div>

            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              {!selectedImage ? (
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isProcessing}
                  />
                  <div className="space-y-2">
                    <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Kliko për të ngarkuar foton e mullirit
                    </p>
                    <p className="text-xs text-muted-foreground">
                      (Maksimumi 5MB - JPG, PNG)
                    </p>
                  </div>
                </label>
              ) : (
                <div className="relative">
                  <img
                    src={selectedImage}
                    alt="Grinder"
                    className="w-full h-auto rounded"
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {extractedValue !== null && (
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <p className="text-sm font-medium">Vlera e lexuar:</p>
                <p className="text-2xl font-bold text-green-600">TOTALE: {extractedValue}</p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleApplyValue}
                className="flex-1"
                disabled={isProcessing || extractedValue === null}
              >
                ✓ Apliko Vlerën
              </Button>
              <Button onClick={handleClose} variant="outline">
                Anulo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
