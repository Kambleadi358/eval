import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Users, Eye, ArrowLeft, FileText } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <header className="hero-gradient py-12 px-4 text-center">
        <a
          href="https://vicharmanch.vercel.app"
          className="inline-flex items-center text-primary-foreground/60 text-xs mb-4 hover:text-primary-foreground transition-colors"
        >
          <ArrowLeft size={14} className="mr-1" /> विचारमंच मुख्य साइट
        </a>

        <div className="mb-6 flex justify-center">
          <img src="/logo.jpeg" alt="विचारमंच लोगो" className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[#FF9933]/50 shadow-2xl" />
        </div>

        <p className="text-primary-foreground/60 text-xs tracking-widest mb-2 uppercase font-medium">अध्यक्षविहीन • विचारकेंद्रित • पारदर्शक</p>
        <h1 className="text-primary-foreground text-3xl md:text-5xl font-extrabold leading-tight mb-3 tracking-tight">
          भारतरत्न डॉ. बाबासाहेब<br />
          <span className="gold-text">आंबेडकर विचारमंच</span>
        </h1>
        <p className="text-primary-foreground/80 text-sm md:text-base max-w-md mx-auto mb-1">
          स्वातंत्र्य, समता, बंधुता, न्याय यांच्या विचारांवर आधारित वैचारिक, बौद्धिक, सामाजिक व सांस्कृतिक चळवळ
        </p>
        <p className="gold-text text-base font-bold mt-4 tracking-wide">स्पर्धा मूल्यांकन प्रणाली</p>
      </header>

      {/* Cards */}
      <div className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col justify-center">
        <div className="grid gap-4">
          <Link to="/admin-login">
            <Card className="card-hover border-2 border-primary/20">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Trophy className="text-primary" size={28} />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Admin पॅनल</h2>
                  <p className="text-sm text-muted-foreground">स्पर्धा तयार करा, परीक्षक जोडा, नोंदी व्यवस्थापित करा</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/judge-login">
            <Card className="card-hover border-2 border-accent/30">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="bg-accent/10 p-3 rounded-full">
                  <Users className="text-accent" size={28} />
                </div>
                <div>
                  <h2 className="font-bold text-lg">परीक्षक लॉगिन</h2>
                  <p className="text-sm text-muted-foreground">गुणांकन पॅनल - स्पर्धा मूल्यांकन करा</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/competitions">
            <Card className="card-hover border-2 border-muted">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="bg-muted p-3 rounded-full">
                  <Eye className="text-muted-foreground" size={28} />
                </div>
                <div>
                  <h2 className="font-bold text-lg">सार्वजनिक स्पर्धा</h2>
                  <p className="text-sm text-muted-foreground">स्पर्धेतील नोंदी पहा व डाउनलोड करा</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* <Link to="/report">
            <Card className="card-hover border-2 border-muted">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <FileText className="text-primary" size={28} />
                </div>
                <div>
                  <h2 className="font-bold text-lg">वार्षिक अहवाल</h2>
                  <p className="text-sm text-muted-foreground">वार्षिक अहवाल पहा व डाउनलोड करा</p>
                </div>
              </CardContent>
            </Card>
          </Link> */}
        </div>
      </div>

      {/* Footer */}
      <footer className="hero-gradient py-6 text-center mt-auto border-t border-primary/10">
        <a href="https://vicharmanch.vercel.app" className="text-primary-foreground/70 text-xs hover:text-primary-foreground transition-all">
          ← विचारमंच मुख्य साइट वर परत जा
        </a>
        <p className="text-primary-foreground/50 text-[10px] mt-2 uppercase tracking-tight">
          © भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच, लातूर
        </p>
      </footer>
    </div>
  );
};

export default Index;
