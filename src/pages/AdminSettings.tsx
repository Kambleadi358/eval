import React, { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Lock, Trash2, AlertTriangle } from 'lucide-react';

const AdminSettings = () => {
  const { changePassword, adminEmail } = useAuth();
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [yearLockOpen, setYearLockOpen] = useState(false);
  const [yearLockLoading, setYearLockLoading] = useState(false);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      toast.error('नवीन पासवर्ड जुळत नाही');
      return;
    }
    const { error } = changePassword(currentPwd, newPwd);
    if (error) {
      toast.error(error);
    } else {
      toast.success('पासवर्ड यशस्वीरित्या बदलला!');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    }
  };

  const handleYearLock = async () => {
    setYearLockLoading(true);

    try {
      // 1. Fetch all competitions with their entries and scores for export
      const { data: competitions } = await supabase.from('competitions').select('*');
      const { data: entries } = await supabase.from('entries').select('*');
      const { data: scores } = await supabase.from('scores').select('*, judges(name, judge_code)');
      const { data: judges } = await supabase.from('judges').select('*');

      // Build human-readable export
      const exportData: any = {
        exported_at: new Date().toISOString(),
        organization: 'भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच, लातूर',
        competitions: (competitions || []).map(comp => {
          const compEntries = (entries || []).filter(e => e.competition_id === comp.id);
          const compJudges = (judges || []).filter(j => j.competition_id === comp.id);

          return {
            name: comp.name,
            type: comp.type,
            prefix: comp.prefix,
            judges: compJudges.map(j => ({ name: j.name, code: j.judge_code, submitted: j.has_submitted })),
            entries: compEntries.map(entry => {
              const entryScores = (scores || []).filter(s => s.entry_id === entry.id);
              const avg = entryScores.length > 0
                ? entryScores.reduce((sum, s) => sum + s.score, 0) / entryScores.length
                : 0;
              return {
                code: entry.entry_code,
                participant: entry.participant_name,
                class: entry.class_category,
                image_url: entry.image_url,
                average_score: Math.round(avg * 100) / 100,
                scores: entryScores.map(s => ({
                  judge: (s as any).judges?.judge_code || s.judge_id,
                  score: s.score,
                  remark: s.remark,
                })),
              };
            }),
          };
        }),
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vicharmanch_data_${new Date().getFullYear()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      // 2. Delete all data: scores → entries → judges → competitions
      await supabase.from('scores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('judges').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('competitions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      toast.success('वर्ष लॉक झाले! सर्व डेटा डाउनलोड व साफ झाला.');
      setYearLockOpen(false);
    } catch (err) {
      toast.error('काहीतरी चुकले');
    }
    setYearLockLoading(false);
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">सेटिंग्ज</h1>

      <div className="space-y-6 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock size={20} />
              पासवर्ड बदला
            </CardTitle>
            <p className="text-sm text-muted-foreground">{adminEmail}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                type="password"
                placeholder="सध्याचा पासवर्ड"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="नवीन पासवर्ड"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="नवीन पासवर्ड पुष्टी करा"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                required
              />
              <Button type="submit" className="w-full">पासवर्ड बदला</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <Trash2 size={20} />
              वर्ष लॉक (Year End)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              सर्व डेटा डाउनलोड करा आणि पुढील वर्षासाठी सिस्टम रिसेट करा
            </p>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" className="w-full" onClick={() => setYearLockOpen(true)}>
              <AlertTriangle size={16} className="mr-2" /> वर्ष लॉक करा
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={yearLockOpen} onOpenChange={setYearLockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle size={20} /> वर्ष लॉक - पुष्टी करा
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="font-semibold">हे करणार:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>सर्व स्पर्धा, नोंदी, गुण, परीक्षक डेटा JSON म्हणून डाउनलोड करेल</li>
              <li>सर्व डेटा कायमचा हटवेल</li>
              <li>पुढील वर्षासाठी सिस्टम रिकामी करेल</li>
            </ul>
            <p className="text-destructive font-bold">⚠️ हे उलट करता येणार नाही!</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setYearLockOpen(false)}>रद्द करा</Button>
            <Button variant="destructive" onClick={handleYearLock} disabled={yearLockLoading}>
              {yearLockLoading ? 'प्रक्रिया होत आहे...' : 'होय, वर्ष लॉक करा'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSettings;
