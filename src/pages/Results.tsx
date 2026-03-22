import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';

const CLASS_LABELS: Record<string, string> = {
  chota_gat: 'छोटा गट',
  motha_gat: 'मोठा गट',
  khula_gat: 'खुला गट',
};

interface ResultEntry {
  id: string;
  entry_code: string;
  participant_name: string;
  class_category: string;
  image_url: string | null;
  avg_score: number;
  scores: any[];
  rank?: number;
}

const Results = () => {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [competition, setCompetition] = useState<any>(null);
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadResults();
  }, [id]);

  const loadResults = async () => {
    const [compRes, entriesRes, scoresRes] = await Promise.all([
      supabase.from('competitions').select('*').eq('id', id!).single(),
      supabase.from('entries').select('*').eq('competition_id', id!).order('entry_code'),
      supabase.from('scores').select('*, judges(name, judge_code)'),
    ]);

    setCompetition(compRes.data);

    const entries = entriesRes.data || [];
    const allScores = scoresRes.data || [];

    const resultData: ResultEntry[] = entries.map(entry => {
      const entryScores = allScores.filter(s => s.entry_id === entry.id);
      const avgScore = entryScores.length > 0
        ? entryScores.reduce((sum, s) => sum + s.score, 0) / entryScores.length
        : 0;

      return {
        ...entry,
        avg_score: Math.round(avgScore * 100) / 100,
        scores: entryScores,
      };
    });

    const classes = ['chota_gat', 'motha_gat', 'khula_gat'];
    classes.forEach(cls => {
      const classEntries = resultData
        .filter(r => r.class_category === cls)
        .sort((a, b) => b.avg_score - a.avg_score);
      classEntries.forEach((entry, i) => {
        entry.rank = i + 1;
      });
    });

    setResults(resultData.sort((a, b) => {
      if (a.class_category !== b.class_category) return a.class_category.localeCompare(b.class_category);
      return (a.rank || 0) - (b.rank || 0);
    }));
    setLoading(false);
  };

  const handlePrint = () => window.print();

  const getRankBadge = (rank?: number) => {
    if (!rank || rank > 3) return null;
    const badges = ['🥇', '🥈', '🥉'];
    return <span className="text-xl">{badges[rank - 1]}</span>;
  };

  const content = (
    <div>
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold">भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच, लातूर</h1>
        <h2 className="text-lg">{competition?.name} - निकाल</h2>
        <p className="text-sm">स्वातंत्र्य • समता • बंधुता • न्याय</p>
        <hr className="my-2" />
      </div>

      <div className="flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-2xl font-bold">निकाल - {competition?.name}</h1>
        <Button onClick={handlePrint} variant="outline">
          <Printer size={16} className="mr-2" /> प्रिंट / PDF
        </Button>
      </div>

      {['chota_gat', 'motha_gat', 'khula_gat'].map(cls => {
        const classResults = results.filter(r => r.class_category === cls);
        if (classResults.length === 0) return null;

        return (
          <div key={cls} className="mb-8">
            <h2 className="text-lg font-bold mb-3 text-primary">{CLASS_LABELS[cls]}</h2>
            <div className="space-y-3">
              {classResults.map(entry => (
                <Card key={entry.id} className={`card-hover ${entry.rank && entry.rank <= 3 ? 'border-accent border-2' : ''}`}>
                  <CardContent className="p-4 flex items-start gap-4">
                    {entry.image_url && (
                      <img src={entry.image_url} alt={entry.entry_code} className="w-20 h-20 object-cover rounded-lg print:w-16 print:h-16" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getRankBadge(entry.rank)}
                        <span className="font-mono font-bold">{entry.entry_code}</span>
                        <span className="text-sm text-muted-foreground">- {entry.participant_name}</span>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        सरासरी गुण: {entry.avg_score} / 10
                      </div>
                      {isAdmin && entry.scores.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {entry.scores.map((s: any, i: number) => (
                            <span key={i}>
                              {(s as any).judges?.judge_code}: {s.score}
                              {s.remark ? ` (${s.remark})` : ''}
                              {i < entry.scores.length - 1 ? ' | ' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {entry.rank && entry.rank <= 3 && (
                      <div className="text-right">
                        <div className="text-sm font-bold">
                          {entry.rank === 1 ? 'प्रथम' : entry.rank === 2 ? 'द्वितीय' : 'तृतीय'}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {loading && <p className="text-center py-8 text-muted-foreground">लोड होत आहे...</p>}
    </div>
  );

  if (isAdmin) {
    return <AdminLayout>{content}</AdminLayout>;
  }

  if (competition && !competition.is_locked) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
        <Card className="max-w-sm text-center">
          <CardContent className="p-8">
            <div className="text-4xl mb-3">🔒</div>
            <p className="text-muted-foreground">निकाल अजून प्रकाशित झालेले नाहीत.</p>
            <Link to="/">
              <Button variant="outline" className="mt-4">
                <ArrowLeft size={16} className="mr-1" /> मुख्यपृष्ठ
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="hero-gradient py-6 px-4 text-center">
        <Link to="/" className="inline-flex items-center text-primary-foreground/70 text-xs mb-2 hover:text-primary-foreground">
          <ArrowLeft size={14} className="mr-1" /> मुख्यपृष्ठ
        </Link>
        <p className="text-primary-foreground/70 text-xs mb-1">भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच, लातूर</p>
        <h1 className="text-primary-foreground text-xl font-bold">{competition?.name} - निकाल</h1>
        <p className="gold-text text-sm mt-1">स्वातंत्र्य • समता • बंधुता • न्याय</p>
      </header>
      <div className="flex-1 p-4 max-w-4xl mx-auto">{content}</div>
    </div>
  );
};

export default Results;
