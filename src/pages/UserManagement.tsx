import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AuthService } from '@/services/auth.service';
import { useSimpleAuth } from '@/hooks/useSimpleAuth';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, ArrowLeft } from 'lucide-react';

export default function UserManagement() {
  const { isAdmin } = useSimpleAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<Array<{ id: string; username: string; role: 'admin' | 'staff'; createdAt: string }>>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<{ id: string; username: string; role: 'admin' | 'staff' } | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'staff' as 'admin' | 'staff'
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/daily');
      return;
    }
    loadUsers();
  }, [isAdmin, navigate]);

  const loadUsers = () => {
    const userList = AuthService.listUsers();
    setUsers(userList);
  };

  const handleCreateUser = () => {
    if (!formData.username || !formData.password) {
      toast.error('Plotëso të gjitha fushat!');
      return;
    }

    const success = AuthService.createUser(formData.username, formData.password, formData.role);
    
    if (success) {
      toast.success('Përdoruesi u krijua!');
      setIsDialogOpen(false);
      resetForm();
      loadUsers();
    } else {
      toast.error('Username ekziston tashmë!');
    }
  };

  const handleUpdateUser = () => {
    if (!editingUser || !formData.username) {
      toast.error('Plotëso të gjitha fushat!');
      return;
    }

    const success = AuthService.updateUser(
      editingUser.id,
      formData.username,
      formData.password || null,
      formData.role
    );
    
    if (success) {
      toast.success('Përdoruesi u përditësua!');
      setIsDialogOpen(false);
      setEditingUser(null);
      resetForm();
      loadUsers();
    } else {
      toast.error('Username ekziston tashmë!');
    }
  };

  const handleDeleteUser = (userId: string, username: string) => {
    if (!confirm(`Je i sigurt që dëshiron të heqësh përdoruesin "${username}"?`)) {
      return;
    }

    const success = AuthService.deleteUser(userId);
    
    if (success) {
      toast.success('Përdoruesi u fshi!');
      loadUsers();
    } else {
      toast.error('Gabim në fshirje!');
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: { id: string; username: string; role: 'admin' | 'staff' }) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      role: 'staff'
    });
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Menaxhimi i Përdoruesve</h2>
            <p className="text-muted-foreground">Shto, ndrysho ose fshi përdorues</p>
          </div>
          <Button onClick={() => navigate('/daily')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kthehu
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista e Përdoruesve</CardTitle>
                <CardDescription>Menaxho të gjithë përdoruesit e sistemit</CardDescription>
              </div>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Shto Përdorues
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Roli</TableHead>
                  <TableHead>Krijuar më</TableHead>
                  <TableHead className="text-right">Veprime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role === 'admin' ? '👑 Admin' : '👤 Staff'}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString('sq-AL')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(user)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(user.id, user.username)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Ndrysho Përdoruesin' : 'Shto Përdorues të Ri'}
              </DialogTitle>
              <DialogDescription>
                {editingUser 
                  ? 'Ndrysho të dhënat e përdoruesit. Lër password bosh nëse nuk dëshiron ta ndryshosh.' 
                  : 'Krijo një përdorues të ri duke plotësuar të dhënat më poshtë.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Shkruaj username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {editingUser && '(opsional për ndryshim)'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? 'Lër bosh për të mbajtur të njëjtin' : 'Shkruaj password'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Roli</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'admin' | 'staff') => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">👑 Admin (të gjitha të drejtat)</SelectItem>
                    <SelectItem value="staff">👤 Staff (vetëm regjistrim)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={editingUser ? handleUpdateUser : handleCreateUser}
                className="flex-1"
              >
                {editingUser ? 'Ruaj Ndryshimet' : 'Krijo Përdoruesin'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingUser(null);
                  resetForm();
                }}
              >
                Anulo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
