import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users, FileImage, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ competitions: 0, entries: 0, judges: 0, submitted: 0, pending: 0 });
  const [competitions, setCompetitions] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [compRes, entryRes, judgeRes] = await Promise.all([
      supabase.from('competitions').select('*').order('created_at', { ascending: false }),
      supabase.from('entries').select('id'),
      supabase.from('judges').select('id, has_submitted'),
    ]);

    const judges = judgeRes.data || [];
    setStats({
      competitions: compRes.data?.length || 0,
      entries: entryRes.data?.length || 0,
      judges: judges.length,
      submitted: judges.filter(j => j.has_submitted).length,
      pending: judges.filter(j => !j.has_submitted).length,
    });
    setCompetitions(compRes.data || []);
  };

  const statCards = [
    { label: 'एकूण स्पर्धा', value: stats.competitions, icon: Trophy, color: 'text-primary' },
    { label: 'एकूण नोंदी', value: stats.entries, icon: FileImage, color: 'text-accent' },
    { label: 'एकूण परीक्षक', value: stats.judges, icon: Users, color: 'text-primary' },
    { label: 'सबमिट झाले', value: stats.submitted, icon: CheckCircle, color: 'text-green-600' },
    { label: 'प्रलंबित', value: stats.pending, icon: Clock, color: 'text-orange-500' },
  ];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">डॅशबोर्ड</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {statCards.map((s, i) => (
          <Card key={i} className="card-hover">
            <CardContent className="p-4 text-center">
              <s.icon className={`mx-auto mb-2 ${s.color}`} size={28} />
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-3">स्पर्धा यादी</h2>
      <div className="grid gap-3">
        {competitions.map(comp => (
          <Card key={comp.id} className="card-hover">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{comp.name}</div>
                <div className="text-sm text-muted-foreground">
                  प्रकार: {comp.type === 'image' ? 'चित्र' : 'मजकूर'} • 
                  {comp.is_locked ? ' 🔒 लॉक' : ' ✅ चालू'}
                </div>
              </div>
              <div className="flex gap-2">
                <Link to={`/results/${comp.id}`} className="text-sm text-primary underline">निकाल</Link>
                <Link to={`/competition/${comp.id}`} className="text-sm text-accent underline">पहा</Link>
              </div>
            </CardContent>
          </Card>
        ))}
        {competitions.length === 0 && (
          <p className="text-muted-foreground text-center py-8">अजून कोणतीही स्पर्धा तयार केलेली नाही.</p>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
