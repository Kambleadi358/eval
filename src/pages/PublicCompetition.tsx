import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Image as ImageIcon } from 'lucide-react';

const CLASS_LABELS: Record<string, string> = {
  chota_gat: 'छोटा गट',
  motha_gat: 'मोठा गट',
  khula_gat: 'खुला गट',
};

const CLASS_COLORS: Record<string, string> = {
  chota_gat: 'bg-green-100 text-green-800 border-green-300',
  motha_gat: 'bg-blue-100 text-blue-800 border-blue-300',
  khula_gat: 'bg-purple-100 text-purple-800 border-purple-300',
};

const PublicCompetition = () => {
  const { id } = useParams();
  const [competition, setCompetition] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    const [compRes, entryRes] = await Promise.all([
      supabase.from('competitions').select('*').eq('id', id!).single(),
      supabase.from('entries').select('id, entry_code, image_url, class_category').eq('competition_id', id!).order('entry_code'),
    ]);
    setCompetition(compRes.data);
    setEntries(entryRes.data || []);
    setLoading(false);
  };

  const downloadImage = async (url: string, code: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${code}.jpg`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      // fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  const filtered = filterClass === 'all' ? entries : entries.filter(e => e.class_category === filterClass);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="hero-gradient py-6 px-4 text-center">
        <p className="text-primary-foreground/70 text-xs mb-1">भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच, लातूर</p>
        <h1 className="text-primary-foreground text-xl md:text-2xl font-bold">
          {competition?.name || 'स्पर्धा'}
        </h1>
        <p className="gold-text text-sm mt-1">स्वातंत्र्य • समता • बंधुता • न्याय</p>
      </header>

      {/* Filter */}
      <div className="flex justify-center gap-2 py-3 px-4 bg-muted overflow-x-auto">
        {['all', 'chota_gat', 'motha_gat', 'khula_gat'].map(cls => (
          <button
            key={cls}
            onClick={() => setFilterClass(cls)}
            className={`px-4 py-2 text-xs rounded-full whitespace-nowrap transition-all font-semibold ${
              filterClass === cls
                ? 'bg-primary text-primary-foreground shadow-md scale-105'
                : 'bg-card text-foreground border border-border hover:border-primary/40'
            }`}
          >
            {cls === 'all' ? `सर्व (${entries.length})` : `${CLASS_LABELS[cls]} (${entries.filter(e => e.class_category === cls).length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="bg-muted rounded-full p-6 mb-4">
              <ImageIcon className="text-muted-foreground" size={48} />
            </div>
            <h2 className="text-lg font-bold mb-2">अजून नोंदी उपलब्ध नाहीत</h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              या स्पर्धेसाठी अद्याप कोणत्याही नोंदी जोडल्या गेल्या नाहीत. कृपया नंतर पुन्हा तपासा.
            </p>
          </div>
        ) : (
          <div className="p-3 md:p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 max-w-7xl mx-auto">
            {filtered.map(entry => (
              <Card key={entry.id} className="overflow-hidden card-hover group relative">
                {entry.image_url ? (
                  <div className="relative">
                    <img
                      src={entry.image_url}
                      alt={entry.entry_code}
                      className="w-full aspect-square object-cover"
                    />
                    {/* Download overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(entry.image_url, entry.entry_code);
                        }}
                      >
                        <Download size={14} className="mr-1" /> डाउनलोड
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-muted flex items-center justify-center">
                    <ImageIcon className="text-muted-foreground" size={32} />
                  </div>
                )}
                <CardContent className="p-2 text-center">
                  <span className="font-mono font-bold text-sm">{entry.entry_code}</span>
                  <div className={`text-[10px] mt-1 inline-block px-2 py-0.5 rounded-full border ${CLASS_COLORS[entry.class_category] || 'bg-muted text-muted-foreground'}`}>
                    {CLASS_LABELS[entry.class_category]}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="hero-gradient py-4 text-center mt-auto">
        <p className="text-primary-foreground/60 text-xs">
          © भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच, लातूर
        </p>
      </footer>
    </div>
  );
};

export default PublicCompetition;
