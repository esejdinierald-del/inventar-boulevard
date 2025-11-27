import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Loader2, Plus, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { validateField, pinSchema, staffNameSchema } from "@/lib/validation";

interface StaffPin {
  id: string;
  staff_name: string;
  pin: string;
  turn_number: number | null;
  is_active: boolean;
}

export const StaffTurnPinsManager = () => {
  const [pins, setPins] = useState<StaffPin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPin, setEditingPin] = useState<StaffPin | null>(null);
  const [formData, setFormData] = useState({
    staff_name: '',
    pin: '',
    is_active: true
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadPins();
  }, []);

  const loadPins = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('staff_turn_pins')
        .select('*')
        .order('turn_number', { ascending: true })
        .order('staff_name', { ascending: true });

      if (error) throw error;
      setPins(data || []);
    } catch (error) {
      toast.error('Gabim në ngarkimin e PIN-eve', {
        description: 'Të dhënat nuk u ngarkuan. Provo përsëri.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openAddDialog = () => {
    setEditingPin(null);
    setFormData({
      staff_name: '',
      pin: '',
      is_active: true
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (pin: StaffPin) => {
    setEditingPin(pin);
    setFormData({
      staff_name: pin.staff_name,
      pin: pin.pin,
      is_active: pin.is_active
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingPin(null);
  };

  const handleSave = async () => {
    // Validate staff name
    const nameValidation = validateField(staffNameSchema, formData.staff_name);
    if (!nameValidation.valid) {
      toast.error(nameValidation.error);
      return;
    }

    // Validate PIN
    const pinValidation = validateField(pinSchema, formData.pin);
    if (!pinValidation.valid) {
      toast.error(pinValidation.error);
      return;
    }

    try {
      if (editingPin) {
        const { error } = await supabase
          .from('staff_turn_pins')
          .update({
            staff_name: formData.staff_name,
            pin: formData.pin,
            is_active: formData.is_active
          })
          .eq('id', editingPin.id);

        if (error) throw error;
        toast.success('PIN u përditësua!');
      } else {
        const { error } = await supabase
          .from('staff_turn_pins')
          .insert({
            staff_name: formData.staff_name,
            pin: formData.pin,
            is_active: formData.is_active
          });

        if (error) throw error;
        toast.success('PIN u shtua!');
      }

      closeDialog();
      await loadPins();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Duplikat!', {
          description: 'Ky PIN ose emër stafi tashmë ekziston'
        });
      } else {
        toast.error('Gabim gjatë ruajtjes', {
          description: 'PIN-i nuk u ruajt. Provo përsëri.'
        });
      }
    }
  };

  const confirmDelete = (id: string, staffName: string) => {
    setDeleteConfirm({ id, name: staffName });
  };

  const deletePin = async () => {
    if (!deleteConfirm) return;

    try {
      const { error } = await supabase
        .from('staff_turn_pins')
        .delete()
        .eq('id', deleteConfirm.id);

      if (error) throw error;
      toast.success('PIN u fshi!', {
        description: `PIN-i i ${deleteConfirm.name} u hoq`
      });
      await loadPins();
    } catch (error) {
      toast.error('Gabim gjatë fshirjes', {
        description: 'PIN-i nuk u fshi. Provo përsëri.'
      });
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('staff_turn_pins')
        .update({ is_active: !currentState })
        .eq('id', id);

      if (error) throw error;
      toast.success(currentState ? 'PIN u çaktivizua' : 'PIN u aktivizua');
      await loadPins();
    } catch (error) {
      toast.error('Gabim gjatë ndryshimit', {
        description: 'Statusi nuk u ndryshua. Provo përsëri.'
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PIN e Stafit për Turne</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>PIN e Stafit për Turne</CardTitle>
              <p className="text-sm text-muted-foreground">
                Menaxho PIN-et 4-shifrore për identifikimin e stafit. Çdo staf mund të punojë në të dy turnet.
              </p>
            </div>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Shto PIN
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nuk ka PIN-e të ruajtura</p>
              <p className="text-xs mt-1">Kliko "Shto PIN" për të filluar</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Emri i Stafit</TableHead>
                    <TableHead>PIN</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Veprime</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pins.map((pin) => (
                    <TableRow key={pin.id}>
                      <TableCell className="font-medium">{pin.staff_name}</TableCell>
                      <TableCell className="font-mono">****</TableCell>
                      <TableCell>
                        <Switch
                          checked={pin.is_active}
                          onCheckedChange={() => toggleActive(pin.id, pin.is_active)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(pin)}
                            className="text-primary hover:text-primary"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDelete(pin.id, pin.staff_name)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPin ? 'Edito PIN' : 'Shto PIN të Ri'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Emri i Stafit</Label>
              <Input
                value={formData.staff_name}
                onChange={(e) => setFormData({ ...formData, staff_name: e.target.value })}
                placeholder="P.sh. Alban Kurti"
              />
            </div>
            <div className="space-y-2">
              <Label>PIN (4 shifra)</Label>
              <Input
                type="text"
                maxLength={4}
                value={formData.pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, pin: value });
                }}
                placeholder="1234"
              />
              <p className="text-xs text-muted-foreground">
                PIN-i mund të përdoret për të dy turnet (T1 dhe T2)
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Aktiv</Label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={closeDialog}>
                Anulo
              </Button>
              <Button onClick={handleSave}>
                Ruaj
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Fshi PIN"
        description={`Je i sigurt që dëshiron të fshish PIN-in e "${deleteConfirm?.name}"? Ky veprim nuk mund të zhbëhet.`}
        onConfirm={deletePin}
        confirmText="Fshi"
        cancelText="Anulo"
        variant="destructive"
      />
    </>
  );
};