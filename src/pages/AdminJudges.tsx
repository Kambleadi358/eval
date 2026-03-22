import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Copy, Trash2, Plus } from 'lucide-react';

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let pwd = '';
  for (let i = 0; i < 6; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
};

const AdminJudges = () => {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [judges, setJudges] = useState<any[]>([]);
  const [selectedComp, setSelectedComp] = useState('');
  const [judgeName, setJudgeName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCompetitions();
  }, []);

  useEffect(() => {
    if (selectedComp) loadJudges();
  }, [selectedComp]);

  const loadCompetitions = async () => {
    const { data } = await supabase.from('competitions').select('*').order('created_at', { ascending: false });
    setCompetitions(data || []);
    if (data?.[0]) setSelectedComp(data[0].id);
  };

  const loadJudges = async () => {
    const { data } = await supabase
      .from('judges')
      .select('*')
      .eq('competition_id', selectedComp)
      .order('created_at');
    setJudges(data || []);
  };

  const addJudge = async () => {
    if (!judgeName.trim() || !selectedComp) return;
    setLoading(true);

    const initials = judgeName.trim().split(' ').map(w => w[0]).join('').toUpperCase();
    const count = judges.length + 1;
    const judgeCode = `JG-${initials}-${String(count).padStart(2, '0')}`;
    const password = generatePassword();

    const { error } = await supabase.from('judges').insert({
      competition_id: selectedComp,
      judge_code: judgeCode,
      name: judgeName.trim(),
      password,
    });

    if (error) {
      toast.error('परीक्षक जोडण्यात अयशस्वी: ' + error.message);
    } else {
      toast.success('परीक्षक जोडला!');
      setJudgeName('');
      loadJudges();
    }
    setLoading(false);
  };

  const deleteJudge = async (id: string) => {
    const { error } = await supabase.from('judges').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('परीक्षक काढला');
      loadJudges();
    }
  };

  const copyLoginMsg = (judge: any) => {
    const appUrl = window.location.origin;
    const msg = `परीक्षक लॉगिन:\nURL: ${appUrl}/judge-login\nID: ${judge.judge_code}\nPassword: ${judge.password}`;
    navigator.clipboard.writeText(msg);
    toast.success('लॉगिन माहिती कॉपी झाली!');
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">परीक्षक व्यवस्थापन</h1>

      <div className="mb-4">
        <label className="text-sm font-medium mb-1 block">स्पर्धा निवडा</label>
        <Select value={selectedComp} onValueChange={setSelectedComp}>
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="स्पर्धा निवडा" />
          </SelectTrigger>
          <SelectContent>
            {competitions.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Add judge */}
      <Card className="mb-6 max-w-md">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="परीक्षकाचे नाव"
              value={judgeName}
              onChange={e => setJudgeName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addJudge()}
            />
            <Button onClick={addJudge} disabled={loading || !judgeName.trim()}>
              <Plus size={18} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Judge list */}
      <div className="grid gap-3">
        {judges.map(judge => (
          <Card key={judge.id} className="card-hover">
            <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="font-semibold">{judge.name}</div>
                <div className="text-sm text-muted-foreground">
                  ID: <span className="font-mono">{judge.judge_code}</span> • 
                  Password: <span className="font-mono">{judge.password}</span>
                </div>
                <div className={`text-xs mt-1 ${judge.has_submitted ? 'text-green-600' : 'text-orange-500'}`}>
                  {judge.has_submitted ? '✅ सबमिट झाले' : '⏳ प्रलंबित'}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => copyLoginMsg(judge)}>
                  <Copy size={14} className="mr-1" /> कॉपी
                </Button>
                <Button variant="destructive" size="sm" onClick={() => deleteJudge(judge.id)} disabled={judge.has_submitted}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {judges.length === 0 && selectedComp && (
          <p className="text-muted-foreground text-center py-8">अजून परीक्षक जोडलेले नाहीत.</p>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminJudges;
