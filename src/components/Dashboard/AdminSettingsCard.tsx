import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const AdminSettingsCard = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleChangePassword = async () => {
    // Validim
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Plotëso të gjitha fushat");
      return;
    }

    if (currentPassword !== "1983") {
      toast.error("Fjalëkalimi aktual është i gabuar");
      return;
    }

    if (newPassword.length < 4) {
      toast.error("Fjalëkalimi i ri duhet të jetë të paktën 4 karaktere");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Fjalëkalimi i ri dhe konfirmimi nuk përputhen");
      return;
    }

    setIsSaving(true);
    
    // Për tani, ruajmë në localStorage
    // Në të ardhmen mund të përdoret Supabase Edge Function
    try {
      localStorage.setItem('admin_password', newPassword);
      toast.success("Fjalëkalimi u ndryshua me sukses!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
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
          Ndrysho fjalëkalimin e adminit për Dashboard
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="current-password">Fjalëkalimi Aktual</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="****"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Fjalëkalimi i Ri</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="****"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Konfirmo Fjalëkalimin e Ri</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="****"
            />
          </div>
          <Button 
            onClick={handleChangePassword} 
            disabled={isSaving}
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