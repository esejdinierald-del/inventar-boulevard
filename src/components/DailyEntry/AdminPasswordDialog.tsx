import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with admin email + password. Validation is done by the parent (Supabase Auth). */
  onSubmit: (email: string, password: string) => unknown | Promise<unknown>;
  title?: string;
  description?: string;
  isBusy?: boolean;
}

/**
 * Admin authentication dialog. Collects email + password and delegates verification
 * to the parent, which must call Supabase Auth (no more hardcoded passwords).
 */
export const AdminPasswordDialog = ({
  isOpen,
  onClose,
  onSubmit,
  title = "Hyrje Admin",
  description = "Hyr me email-in dhe fjalëkalimin e adminit",
  isBusy = false,
}: AdminPasswordDialogProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    await onSubmit(email.trim(), password);
    setPassword("");
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="username"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="admin-password">Fjalëkalimi</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => { setPassword(""); }}>Anulo</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={isBusy}>
            {isBusy ? "Duke verifikuar..." : "Vazhdo"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
