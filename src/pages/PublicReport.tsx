import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Download, Archive, Eye } from 'lucide-react';

const PublicReport = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('annual_reports').select('*').order('year', { ascending: false });
      setReports(data || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="hero-gradient py-8 px-4 text-center">
        <p className="text-primary-foreground/60 text-xs tracking-wider mb-1">
          भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच, लातूर
        </p>
        <h1 className="text-primary-foreground text-xl md:text-2xl font-bold">
          वार्षिक <span className="gold-text">अहवाल</span>
        </h1>
        <p className="gold-text text-sm mt-1">स्वातंत्र्य • समता • बंधुता • न्याय</p>
      </header>

      <div className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : reports.length === 0 ? (
          <Card className="border-dashed border-2 mt-8">
            <CardContent className="p-10 text-center">
              <div className="bg-muted rounded-full p-5 w-fit mx-auto mb-4">
                <FileText className="text-muted-foreground" size={40} />
              </div>
              <p className="font-semibold text-lg">अहवाल उपलब्ध नाही</p>
              <p className="text-sm text-muted-foreground mt-1">सध्या कोणताही वार्षिक अहवाल अपलोड केलेला नाही.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 mt-4">
            {reports.map((r, i) => (
              <Card
                key={r.id}
                className="overflow-hidden transition-all border-2 border-transparent hover:border-primary/20"
                style={{ zIndex: reports.length - i }}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <FileText className="text-primary" size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{r.year}</h2>
                      <p className="text-xs text-muted-foreground">वार्षिक अहवाल</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a href={r.pdf_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="gap-2">
                        <Eye size={14} /> PDF पहा
                      </Button>
                    </a>
                    <a href={r.pdf_url} download>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Download size={14} /> PDF डाउनलोड
                      </Button>
                    </a>
                    {r.zip_url && (
                      <a href={r.zip_url} download>
                        <Button size="sm" variant="outline" className="gap-2">
                          <Archive size={14} /> ZIP डाउनलोड
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <footer className="hero-gradient py-4 text-center mt-auto">
        <a href="https://vicharmanch.vercel.app" className="text-primary-foreground/70 text-xs hover:text-primary-foreground">
          ← विचारमंच मुख्य साइट
        </a>
        <p className="text-primary-foreground/50 text-xs mt-1">
          © भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच, लातूर
        </p>
      </footer>
    </div>
  );
};

export default PublicReport;
