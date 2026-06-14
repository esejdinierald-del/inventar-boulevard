import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, Shield } from "lucide-react";

const ADMIN_PASSWORD = "1983";
const SECRET_PASSWORD = "23061983";

export interface StaffPermissions {
  dashboard: boolean;
  products: boolean;
  expenses: boolean;
  staff: boolean;
}

export interface VerifiedStaffData {
  name: string;
  isManager: boolean;
  permissions: StaffPermissions;
}

interface StaffPinVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: (staffName: string, staffData?: VerifiedStaffData) => void;
  onAdminVerified?: () => void;
}

export const StaffPinVerifyDialog = ({
  open,
  onOpenChange,
  onVerified,
  onAdminVerified,
}: StaffPinVerifyDialogProps) => {
  const [pin, setPin] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [mode, setMode] = useState<"staff" | "admin">("staff");

  const handleVerifyStaff = async () => {
    if (!pin || pin.length !== 4) {
      toast.error("PIN duhet të jetë 4 shifra");
      return;
    }

    try {
      setIsVerifying(true);

      const { data, error } = await supabase
        .rpc('verify_staff_pin', { _pin: pin });

      if (error) {
        console.error('Error verifying PIN:', error);
        toast.error(`Gabim verifikimi: ${error.message}`);
        return;
      }

      const verifiedStaff = data?.[0];

      if (!verifiedStaff) {
        toast.error("PIN i gabuar ose jo aktiv");
        setPin("");
        return;
      }

      // Parse permissions from the database
      const perms = verifiedStaff.permissions as unknown;
      const defaultPerms: StaffPermissions = {
        dashboard: false,
        products: false,
        expenses: false,
        staff: false
      };
      
      const permissions: StaffPermissions = perms && typeof perms === 'object' && !Array.isArray(perms)
        ? { ...defaultPerms, ...(perms as StaffPermissions) }
        : defaultPerms;

      const staffData: VerifiedStaffData = {
        name: verifiedStaff.staff_name,
        isManager: verifiedStaff.is_manager,
        permissions
      };

      if (verifiedStaff.is_manager) {
        toast.success(`Mirë se erdhe, Menaxher ${verifiedStaff.staff_name}!`);
      } else {
        toast.success(`Mirë se erdhe, ${verifiedStaff.staff_name}!`);
      }
      
      onVerified(verifiedStaff.staff_name, staffData);
      setPin("");
      onOpenChange(false);
    } catch (err) {
      console.error('Error verifying PIN:', err);
      toast.error(err instanceof Error ? err.message : 'Gabim gjatë verifikimit të PIN-it');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyAdmin = () => {
    if (pin === ADMIN_PASSWORD || pin === SECRET_PASSWORD) {
      toast.success("Admin u hap me sukses!");
      setPin("");
      onOpenChange(false);
      onAdminVerified?.();
    } else {
      toast.error("Fjalëkalimi është gabim!");
      setPin("");
    }
  };

  const handleVerify = () => {
    if (mode === "staff") {
      handleVerifyStaff();
    } else {
      handleVerifyAdmin();
    }
  };

  const switchMode = () => {
    setPin("");
    setMode(mode === "staff" ? "admin" : "staff");
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
            {mode === "staff" ? (
              <>
                <Lock className="h-5 w-5 text-primary" />
                Verifikim Stafi
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 text-primary" />
                Hyrje Admin
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            {mode === "staff" 
              ? "Fut PIN-in tënd 4-shifror për të filluar punën"
              : "Fut fjalëkalimin e admin-it"
            }
          </p>
          <div className="space-y-2">
            <Label htmlFor="pin">
              {mode === "staff" ? "PIN (4 shifra)" : "Fjalëkalimi"}
            </Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={mode === "staff" ? 4 : 8}
              value={pin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setPin(value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (mode === "staff" && pin.length === 4) {
                    handleVerify();
                  } else if (mode === "admin" && pin.length >= 4) {
                    handleVerify();
                  }
                }
              }}
              placeholder={mode === "staff" ? "****" : "********"}
              className="text-center text-2xl tracking-widest"
              autoFocus
            />
          </div>
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={switchMode}
              className="text-muted-foreground"
            >
              {mode === "staff" ? "Hyr si Admin" : "Hyr si Staf"}
            </Button>
            <Button 
              onClick={handleVerify} 
              disabled={isVerifying || (mode === "staff" ? pin.length !== 4 : pin.length < 4)}
            >
              {isVerifying ? 'Duke verifikuar...' : 'Verifiko'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};