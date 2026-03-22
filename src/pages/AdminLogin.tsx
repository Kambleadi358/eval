import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, isAdmin } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAdmin) navigate('/admin');
  }, [isAdmin, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = signIn(email, password);
    if (error) {
      toast.error(error);
    } else {
      navigate('/admin');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-sm animate-fade-in">
        <CardHeader className="text-center">
          <Link to="/" className="inline-flex items-center justify-center text-muted-foreground text-xs mb-2 hover:text-foreground">
            <ArrowLeft size={14} className="mr-1" /> मुख्यपृष्ठावर परत जा
          </Link>
          <CardTitle className="text-xl">विचारमंच • Admin</CardTitle>
          <p className="text-sm text-muted-foreground">स्पर्धा व्यवस्थापन प्रणाली</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="ईमेल"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="पासवर्ड"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'कृपया प्रतीक्षा करा...' : 'लॉगिन'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
