import React, { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const AdminCompetition = () => {
  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('R');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    const { error } = await supabase.from('competitions').insert({
      name: name.trim(),
      type: 'image' as const,
      prefix: prefix.trim() || 'R',
    });

    if (error) {
      toast.error('स्पर्धा तयार करण्यात अयशस्वी: ' + error.message);
    } else {
      toast.success('स्पर्धा यशस्वीरित्या तयार झाली!');
      navigate('/admin');
    }
    setLoading(false);
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">नवीन स्पर्धा तयार करा</h1>

      <Card className="max-w-md">
        <CardContent className="p-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">स्पर्धेचे नाव</label>
              <Input
                placeholder="उदा. रांगोळी स्पर्धा 2026"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Entry Prefix</label>
              <Input
                placeholder="R (for Rangoli), D (for Drawing)"
                value={prefix}
                onChange={e => setPrefix(e.target.value.toUpperCase())}
                maxLength={3}
              />
              <p className="text-xs text-muted-foreground mt-1">नोंदी असतील: {prefix}001, {prefix}002...</p>
            </div>

            <p className="text-xs text-muted-foreground bg-muted p-2 rounded">प्रकार: चित्र (Image) — डीफॉल्ट</p>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'तयार होत आहे...' : 'स्पर्धा तयार करा'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminCompetition;
