import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Lets the signed-in admin update their Supabase Auth password.
 * Replaces the legacy localStorage-based password change.
 */
export const AdminSettingsCard = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !user.is_anonymous) setAdminEmail(user.email ?? null);
    })();
  }, []);

  const handleChangePassword = async () => {
    if (!adminEmail) {
      toast.error("Nuk je i loguar si admin. Bëj logout dhe hyr përsëri.");
      return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Plotëso të gjitha fushat");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Fjalëkalimi i ri duhet të ketë të paktën 6 karaktere");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Fjalëkalimi i ri dhe konfirmimi nuk përputhen");
      return;
    }

    setIsSaving(true);
    try {
      // Re-verify current password by signing in again.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: currentPassword,
      });
      if (signInError) {
        toast.error("Fjalëkalimi aktual është i gabuar");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        toast.error(`Gabim: ${updateError.message}`);
        return;
      }

      toast.success("Fjalëkalimi u ndryshua me sukses!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error('Password change error:', err);
      toast.error("Gabim gjatë ndryshimit të fjalëkalimit");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <CardTitle>Cilësimet e Adminit</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Ndrysho fjalëkalimin e llogarisë admin {adminEmail ? `(${adminEmail})` : ""}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="current-password">Fjalëkalimi Aktual</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Fjalëkalimi i Ri (min. 6 karaktere)</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Konfirmo Fjalëkalimin e Ri</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={isSaving || !adminEmail}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Duke ruajtur..." : "Ruaj Fjalëkalimin"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
