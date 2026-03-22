import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const JudgeLogin = () => {
  const [judgeCode, setJudgeCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judgeCode.trim() || !password.trim()) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('judge-api', {
        body: { action: 'login', judge_code: judgeCode.trim(), password: password.trim() }
      });

      if (error) {
        toast.error('सर्व्हर त्रुटी');
        setLoading(false);
        return;
      }

      if (data.error) {
        toast.error(data.error);
        setLoading(false);
        return;
      }

      sessionStorage.setItem('judge_session', JSON.stringify(data));
      navigate(`/judge-panel/${data.competition.id}`);
    } catch (err) {
      toast.error('नेटवर्क त्रुटी');
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
          <div className="text-2xl mb-2">⚖️</div>
          <CardTitle className="text-xl">परीक्षक लॉगिन</CardTitle>
          <p className="text-sm text-muted-foreground">भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              placeholder="Judge ID (उदा. JG-AB-01)"
              value={judgeCode}
              onChange={e => setJudgeCode(e.target.value.toUpperCase())}
              required
            />
            <Input
              type="password"
              placeholder="पासवर्ड"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'तपासत आहे...' : 'लॉगिन करा'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default JudgeLogin;
