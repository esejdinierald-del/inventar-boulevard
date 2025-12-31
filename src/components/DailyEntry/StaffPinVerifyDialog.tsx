import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock } from "lucide-react";

interface StaffPinVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: (staffName: string) => void;
}

export const StaffPinVerifyDialog = ({
  open,
  onOpenChange,
  onVerified,
}: StaffPinVerifyDialogProps) => {
  const [pin, setPin] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (!pin || pin.length !== 4) {
      toast.error("PIN duhet të jetë 4 shifra");
      return;
    }

    try {
      setIsVerifying(true);

      const { data, error } = await supabase
        .from('staff_turn_pins')
        .select('*')
        .eq('pin', pin)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error verifying PIN:', error);
        toast.error(`Gabim verifikimi: ${error.message}`);
        return;
      }

      if (!data) {
        toast.error("PIN i gabuar ose jo aktiv");
        setPin("");
        return;
      }

      toast.success(`Mirë se erdhe, ${data.staff_name}!`);
      onVerified(data.staff_name);
      setPin("");
      onOpenChange(false); // Mbyll dialogun pas verifikimit
    } catch (err) {
      console.error('Error verifying PIN:', err);
      toast.error(err instanceof Error ? err.message : 'Gabim gjatë verifikimit të PIN-it');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="[&>button]:hidden"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Verifikim Stafi
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            Fut PIN-in tënd 4-shifror për të filluar punën
          </p>
          <div className="space-y-2">
            <Label htmlFor="pin">PIN (4 shifra)</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setPin(value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && pin.length === 4) {
                  handleVerify();
                }
              }}
              placeholder="****"
              className="text-center text-2xl tracking-widest"
              autoFocus
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleVerify} disabled={isVerifying || pin.length !== 4}>
              {isVerifying ? 'Duke verifikuar...' : 'Verifiko'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};