import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Upload } from "lucide-react";

interface InvoiceUploadStepProps {
  uploadedImages: string[];
  isProcessing: boolean;
  onImagesUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void;
}

export const InvoiceUploadStep = ({
  uploadedImages,
  isProcessing,
  onImagesUpload,
  onAnalyze,
}: InvoiceUploadStepProps) => {
  return (
    <div className="flex-1 space-y-4">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label>Ngarko disa foto të faturave për të krijuar listën e produkteve</Label>
            <p className="text-xs text-muted-foreground">
              AI do të analizojë të gjitha faturat dhe do të krijojë një listë unike produktesh
            </p>
          </div>
          
          <label className="border-2 border-dashed rounded-lg p-8 text-center block cursor-pointer hover:bg-accent/50 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onImagesUpload}
              className="hidden"
              disabled={isProcessing}
            />
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">
              Kliko për të ngarkuar foto (mund të zgjedhësh shumë)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Maksimumi 5MB për foto - JPG, PNG
            </p>
          </label>

          {uploadedImages.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {uploadedImages.length} foto u ngarkuan
              </p>
              <div className="grid grid-cols-4 gap-2">
                {uploadedImages.slice(0, 8).map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Invoice ${i + 1}`}
                    className="w-full h-24 object-cover rounded border"
                  />
                ))}
              </div>
              {uploadedImages.length > 8 && (
                <p className="text-xs text-muted-foreground">
                  +{uploadedImages.length - 8} foto të tjera...
                </p>
              )}
            </div>
          )}

          <Button
            onClick={onAnalyze}
            disabled={isProcessing || uploadedImages.length === 0}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Po analizon...
              </>
            ) : (
              <>Analizo Faturat dhe Vazhdo →</>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};
