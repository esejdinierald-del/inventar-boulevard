import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

interface AdminPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
}

export const AdminPasswordDialog = ({ isOpen, onClose, onSubmit }: AdminPasswordDialogProps) => {
  const [password, setPassword] = useState("");

  const handleSubmit = () => {
    onSubmit(password);
    setPassword("");
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hyrje Admin</AlertDialogTitle>
          <AlertDialogDescription>
            Vendos fjalëkalimin për të hyrë si administrator
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          type="password"
          placeholder="Fjalëkalimi"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
        />
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPassword("")}>Anulo</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit}>Vazhdo</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
