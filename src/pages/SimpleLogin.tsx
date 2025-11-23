import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useSimpleAuth } from '@/hooks/useSimpleAuth';
import { toast } from 'sonner';

export default function SimpleLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useSimpleAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Plotëso të gjitha fushat!');
      return;
    }

    const success = login(username, password);
    
    if (success) {
      toast.success('Mirë se erdhe!');
      navigate('/daily');
    } else {
      toast.error('Username ose password i gabuar!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Hyrje në Sistem</CardTitle>
          <CardDescription>
            Vendos username dhe password për të hyrë
          </CardDescription>
          <div className="mt-2 p-2 bg-muted rounded text-xs">
            <p className="font-medium">Default Admin:</p>
            <p>Username: <span className="font-mono">admin</span></p>
            <p>Password: <span className="font-mono">admin123</span></p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Shkruaj username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Shkruaj password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full">
              Hyr
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
