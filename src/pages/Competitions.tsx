import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Eye, ArrowLeft } from 'lucide-react';

const Competitions = () => {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('competitions').select('*').order('created_at', { ascending: false });
      setCompetitions(data || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="hero-gradient py-8 px-4 text-center">
        <Link
          to="/"
          className="inline-flex items-center text-primary-foreground/60 text-xs mb-3 hover:text-primary-foreground transition-colors"
        >
          <ArrowLeft size={14} className="mr-1" /> मुख्यपृष्ठ
        </Link>
        <p className="text-primary-foreground/60 text-xs tracking-wider mb-1">भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच, लातूर</p>
        <h1 className="text-primary-foreground text-xl md:text-2xl font-bold">
          सार्वजनिक <span className="gold-text">स्पर्धा</span>
        </h1>
        <p className="gold-text text-sm mt-1">स्वातंत्र्य • समता • बंधुता • न्याय</p>
      </header>

      <div className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : competitions.length === 0 ? (
          <Card className="border-dashed border-2 mt-8">
            <CardContent className="p-10 text-center">
              <div className="bg-muted rounded-full p-5 w-fit mx-auto mb-4">
                <Trophy className="text-muted-foreground" size={40} />
              </div>
              <p className="font-semibold text-lg mb-1">सध्या कोणतीही स्पर्धा उपलब्ध नाही</p>
              <p className="text-sm text-muted-foreground">नवीन स्पर्धा तयार झाल्यावर ती येथे दिसेल.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 mt-4">
            {competitions.map(comp => (
              <Link key={comp.id} to={`/competition/${comp.id}`}>
                <Card className="card-hover border-2 border-transparent hover:border-primary/30 transition-all">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2.5 rounded-full">
                        <Trophy className="text-primary" size={22} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base">{comp.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          कोड: {comp.prefix} • प्रकार: चित्र
                        </p>
                      </div>
                    </div>
                    <Eye size={18} className="text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
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

export default Competitions;
