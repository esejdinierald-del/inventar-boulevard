import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";

interface StaffOnboardingDialogProps {
  open: boolean;
  onAcknowledge: () => void;
}

/**
 * Dialog që shfaqet pas verifikimit të PIN-it të stafit me udhëzimet
 * "Hapat para konfirmimit". Mbyllet vetëm me butonin "OK, kuptova".
 */
export const StaffOnboardingDialog = ({ open, onAcknowledge }: StaffOnboardingDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="[&>button]:hidden"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Hapat para konfirmimit
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Ngarko furnizimet (faturat) — nëse ka.</li>
            <li>Numëro fizikisht gjendjen e secilit produkt.</li>
            <li>
              Shtyp <strong>Ngarko Gjendjen</strong> për të zbuluar{" "}
              <strong>Stok Fillim</strong> dhe <strong>Dif</strong>.
            </li>
          </ol>
          <div className="flex justify-end">
            <Button onClick={onAcknowledge} autoFocus>
              OK, kuptova
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
