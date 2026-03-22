import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Send, ChevronLeft, ChevronRight, Eye, ZoomIn, X, ArrowLeft, Check, Lock } from 'lucide-react';

interface ScoreData {
  entry_id: string;
  score: number;
  remark: string;
  submitted: boolean; // true = already in DB, read-only
}

const CLASS_ORDER = ['chota_gat', 'motha_gat', 'khula_gat'] as const;
const CLASS_LABELS: Record<string, string> = {
  chota_gat: 'छोटा गट',
  motha_gat: 'मोठा गट',
  khula_gat: 'खुला गट',
};

const DRAFT_KEY = (judgeId: string) => `judge_draft_v2_${judgeId}`;

const JudgePanel = () => {
  const { competitionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, ScoreData>>({});
  const [currentClassIndex, setCurrentClassIndex] = useState(0);
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [newEntryIds, setNewEntryIds] = useState<Set<string>>(new Set());
  const [classSubmitted, setClassSubmitted] = useState<Record<string, boolean>>({});
  const prevEntryCountRef = useRef(0);

  // Load session
  useEffect(() => {
    const stored = sessionStorage.getItem('judge_session');
    if (!stored) { navigate('/judge-login'); return; }
    const parsed = JSON.parse(stored);
    if (parsed.competition.id !== competitionId) { navigate('/judge-login'); return; }
    setSession(parsed);
    setEntries(parsed.entries || []);
    prevEntryCountRef.current = (parsed.entries || []).length;

    // Build scores: mark existing as submitted (read-only)
    const existingMap: Record<string, any> = {};
    (parsed.existingScores || []).forEach((s: any) => {
      existingMap[s.entry_id] = s;
    });

    // Try restore draft for new (unsubmitted) entries
    let draft: Record<string, ScoreData> = {};
    const draftStr = localStorage.getItem(DRAFT_KEY(parsed.judge.id));
    if (draftStr) {
      try { draft = JSON.parse(draftStr); } catch {}
    }

    const initial: Record<string, ScoreData> = {};
    (parsed.entries || []).forEach((entry: any) => {
      if (existingMap[entry.id]) {
        initial[entry.id] = {
          entry_id: entry.id,
          score: existingMap[entry.id].score,
          remark: existingMap[entry.id].remark || '',
          submitted: true,
        };
      } else if (draft[entry.id] && !draft[entry.id].submitted) {
        initial[entry.id] = { ...draft[entry.id], submitted: false };
      } else {
        initial[entry.id] = { entry_id: entry.id, score: 0, remark: '', submitted: false };
      }
    });
    setScores(initial);

    // Find first class with unscored entries
    const allEntries = parsed.entries || [];
    for (let ci = 0; ci < CLASS_ORDER.length; ci++) {
      const cls = CLASS_ORDER[ci];
      const classEntries = allEntries.filter((e: any) => e.class_category === cls);
      const hasUnscored = classEntries.some((e: any) => !existingMap[e.id]);
      if (hasUnscored) {
        setCurrentClassIndex(ci);
        break;
      }
    }
  }, [competitionId, navigate]);

  // Auto-save draft (only unsubmitted)
  useEffect(() => {
    if (!session || Object.keys(scores).length === 0) return;
    const draftScores: Record<string, ScoreData> = {};
    Object.entries(scores).forEach(([k, v]) => {
      if (!v.submitted) draftScores[k] = v;
    });
    localStorage.setItem(DRAFT_KEY(session.judge.id), JSON.stringify(draftScores));
  }, [scores, session]);

  // Poll for new entries every 5 seconds
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('entries')
        .select('id, entry_code, image_url, class_category')
        .eq('competition_id', session.judge.competition_id)
        .order('entry_code');

      if (data && data.length > prevEntryCountRef.current) {
        const oldIds = new Set(entries.map((e: any) => e.id));
        const addedIds = new Set<string>();
        data.forEach(e => { if (!oldIds.has(e.id)) addedIds.add(e.id); });

        setEntries(data);
        setScores(prev => {
          const updated = { ...prev };
          data.forEach(e => {
            if (!updated[e.id]) {
              updated[e.id] = { entry_id: e.id, score: 0, remark: '', submitted: false };
            }
          });
          return updated;
        });
        setNewEntryIds(addedIds);
        prevEntryCountRef.current = data.length;
        toast.info(`${addedIds.size} नवीन नोंद जोडली गेली`);
        setTimeout(() => setNewEntryIds(new Set()), 3000);

        const updatedSession = { ...session, entries: data };
        sessionStorage.setItem('judge_session', JSON.stringify(updatedSession));
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [session, entries]);

  if (!session) return null;

  const currentClass = CLASS_ORDER[currentClassIndex];
  const classEntries = entries.filter(e => e.class_category === currentClass);
  const unscoredClassEntries = classEntries.filter(e => !scores[e.id]?.submitted);
  const scoredClassEntries = classEntries.filter(e => scores[e.id]?.submitted);
  const currentEntry = unscoredClassEntries[currentEntryIndex];

  const allClassNewScored = unscoredClassEntries.every(e => {
    const s = scores[e.id];
    return s && s.score >= 1 && s.score <= 10;
  });

  const updateScore = (entryId: string, value: number) => {
    if (scores[entryId]?.submitted) return;
    setScores(prev => ({ ...prev, [entryId]: { ...prev[entryId], score: value } }));
  };

  const updateRemark = (entryId: string, remark: string) => {
    if (scores[entryId]?.submitted) return;
    setScores(prev => ({ ...prev, [entryId]: { ...prev[entryId], remark } }));
  };

  const handleClassReview = () => {
    if (!allClassNewScored && unscoredClassEntries.length > 0) {
      toast.error('या गटातील सर्व नोंदींना गुण द्या (1-10)');
      return;
    }
    setReviewMode(true);
  };

  const handleClassSubmit = async () => {
    setSubmitting(true);
    try {
      const newScores = unscoredClassEntries.map(e => ({
        entry_id: e.id,
        score: scores[e.id].score,
        remark: scores[e.id].remark || '',
      }));

      if (newScores.length === 0) {
        // All already submitted, move to next class
        moveToNextClass();
        setSubmitting(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('judge-api', {
        body: {
          action: 'submit_scores',
          judge_id: session.judge.id,
          scores: newScores,
        }
      });

      if (error || data?.error) {
        toast.error(data?.error || 'सबमिट अयशस्वी');
        setSubmitting(false);
        return;
      }

      // Mark these as submitted
      setScores(prev => {
        const updated = { ...prev };
        unscoredClassEntries.forEach(e => {
          updated[e.id] = { ...updated[e.id], submitted: true };
        });
        return updated;
      });

      setClassSubmitted(prev => ({ ...prev, [currentClass]: true }));
      localStorage.removeItem(DRAFT_KEY(session.judge.id));
      toast.success(`${CLASS_LABELS[currentClass]} गुण सबमिट झाले!`);

      moveToNextClass();
    } catch {
      toast.error('नेटवर्क त्रुटी');
    }
    setSubmitting(false);
  };

  const moveToNextClass = () => {
    setReviewMode(false);
    setCurrentEntryIndex(0);
    if (currentClassIndex < CLASS_ORDER.length - 1) {
      setCurrentClassIndex(currentClassIndex + 1);
    } else {
      // All done
      setClassSubmitted(prev => ({ ...prev, __all_done: true }));
    }
  };

  // All classes done
  if (classSubmitted.__all_done || (currentClassIndex >= CLASS_ORDER.length)) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
        <Card className="max-w-sm text-center animate-fade-in">
          <CardContent className="p-8">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold mb-2">धन्यवाद!</h2>
            <p className="text-muted-foreground">सर्व गटांचे मूल्यांकन पूर्ण झाले.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>
              <ArrowLeft size={16} className="mr-1" /> मुख्यपृष्ठ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No unscored entries in this class
  if (unscoredClassEntries.length === 0 && !reviewMode) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="hero-gradient sticky top-0 z-50 px-4 py-3 text-center">
          <h1 className="text-primary-foreground font-bold text-sm">{session.competition.name}</h1>
          <p className="text-primary-foreground/70 text-xs">
            {CLASS_LABELS[currentClass]} - सर्व नोंदींचे मूल्यांकन पूर्ण
          </p>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-sm text-center">
            <CardContent className="p-6">
              <Lock className="mx-auto mb-3 text-muted-foreground" size={32} />
              <p className="font-semibold mb-2">{CLASS_LABELS[currentClass]} - मूल्यांकन पूर्ण</p>
              <p className="text-sm text-muted-foreground mb-4">
                या गटातील {scoredClassEntries.length} नोंदींचे गुण आधीच सबमिट झाले आहेत.
              </p>
              {scoredClassEntries.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {scoredClassEntries.map(e => (
                    <div key={e.id} className="text-center bg-muted rounded p-1">
                      <span className="font-mono text-xs">{e.entry_code}</span>
                      <span className="block text-primary font-bold text-sm">{scores[e.id]?.score}/10</span>
                    </div>
                  ))}
                </div>
              )}
              <Button onClick={moveToNextClass} className="w-full">
                पुढील गट <ChevronRight size={16} className="ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Image Zoom Modal
  const ImageZoomModal = () => (
    <Dialog open={!!zoomImage} onOpenChange={() => setZoomImage(null)}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
        <button onClick={() => setZoomImage(null)} className="absolute top-3 right-3 z-50 bg-black/50 text-white p-2 rounded-full">
          <X size={20} />
        </button>
        {zoomImage && (
          <img src={zoomImage} alt="Zoomed" className="w-full h-full object-contain max-h-[90vh]" />
        )}
      </DialogContent>
    </Dialog>
  );

  // Review mode - show all entries for current class
  if (reviewMode) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ImageZoomModal />
        <header className="hero-gradient sticky top-0 z-50 px-4 py-3 text-center">
          <h1 className="text-primary-foreground font-bold text-sm">{session.competition.name}</h1>
          <p className="text-primary-foreground/70 text-xs">
            {CLASS_LABELS[currentClass]} - पुनरावलोकन
          </p>
        </header>

        <div className="flex-1 p-3 max-w-4xl mx-auto w-full">
          {/* Previously submitted (read-only) */}
          {scoredClassEntries.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <Lock size={14} /> आधी सबमिट केलेले
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {scoredClassEntries.map(entry => (
                  <Card key={entry.id} className="overflow-hidden opacity-70">
                    <CardContent className="p-0">
                      {entry.image_url && (
                        <img src={entry.image_url} alt={entry.entry_code} className="w-full aspect-square object-cover" />
                      )}
                      <div className="p-1.5 text-center">
                        <span className="font-mono text-xs">{entry.entry_code}</span>
                        <div className="text-primary font-bold text-sm">{scores[entry.id]?.score}/10</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* New scores to submit */}
          <h3 className="text-sm font-semibold mb-2">नवीन गुण</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {unscoredClassEntries.map(entry => {
              const s = scores[entry.id];
              return (
                <Card key={entry.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {entry.image_url && (
                      <img
                        src={entry.image_url}
                        alt={entry.entry_code}
                        className="w-full aspect-square object-cover cursor-pointer"
                        onClick={() => setZoomImage(entry.image_url)}
                      />
                    )}
                    <div className="p-2 text-center">
                      <span className="font-mono font-bold text-sm">{entry.entry_code}</span>
                      <div className="mt-1">
                        <span className="inline-block bg-primary text-primary-foreground text-lg font-bold px-3 py-1 rounded-full">
                          {s?.score || 0}/10
                        </span>
                      </div>
                      {s?.remark && <p className="text-[10px] text-muted-foreground mt-1 truncate">{s.remark}</p>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex gap-3 mt-6 pb-6">
            <Button variant="outline" className="flex-1" onClick={() => setReviewMode(false)}>
              <ChevronLeft size={18} className="mr-1" /> मागे जा
            </Button>
            <Button className="flex-1" onClick={handleClassSubmit} disabled={submitting}>
              <Send size={18} className="mr-1" />
              {submitting ? 'सबमिट होत आहे...' : `${CLASS_LABELS[currentClass]} सबमिट करा`}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main scoring view
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ImageZoomModal />
      {/* Header */}
      <header className="hero-gradient sticky top-0 z-50 px-4 py-3">
        <div className="text-center">
          <h1 className="text-primary-foreground font-bold text-sm">{session.competition.name}</h1>
          <p className="text-primary-foreground/70 text-xs">परीक्षक: {session.judge.name}</p>
        </div>
        {/* Class tabs */}
        <div className="flex justify-center gap-2 mt-2">
          {CLASS_ORDER.map((cls, i) => {
            const clsEntries = entries.filter(e => e.class_category === cls);
            const allDone = clsEntries.every(e => scores[e.id]?.submitted);
            const isCurrent = i === currentClassIndex;
            return (
              <button
                key={cls}
                onClick={() => { setCurrentClassIndex(i); setCurrentEntryIndex(0); setReviewMode(false); }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
                  isCurrent
                    ? 'bg-primary-foreground text-primary'
                    : allDone
                    ? 'bg-green-500/30 text-primary-foreground'
                    : 'bg-primary-foreground/20 text-primary-foreground/70'
                }`}
              >
                {allDone && <Check size={12} />}
                {CLASS_LABELS[cls]}
                <span className="opacity-60">({clsEntries.length})</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Progress */}
      <div className="px-4 py-2 bg-muted">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{CLASS_LABELS[currentClass]} - नवीन नोंदी</span>
          <span>{Math.min(currentEntryIndex + 1, unscoredClassEntries.length)} / {unscoredClassEntries.length}</span>
        </div>
        <div className="w-full bg-border rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${unscoredClassEntries.length > 0 ? ((currentEntryIndex + 1) / unscoredClassEntries.length) * 100 : 100}%` }}
          />
        </div>
      </div>

      {/* Entry Card */}
      <div className="flex-1">
        {currentEntry && (
          <div className="p-4 max-w-lg mx-auto animate-fade-in" key={currentEntry.id}>
            <Card className={newEntryIds.has(currentEntry.id) ? 'ring-2 ring-accent animate-pulse' : ''}>
              <CardContent className="p-0">
                {currentEntry.image_url && (
                  <div className="relative group">
                    <img
                      src={currentEntry.image_url}
                      alt={currentEntry.entry_code}
                      className="w-full aspect-square object-cover rounded-t-lg cursor-pointer"
                      onClick={() => setZoomImage(currentEntry.image_url)}
                    />
                    <button
                      onClick={() => setZoomImage(currentEntry.image_url)}
                      className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"
                    >
                      <ZoomIn size={18} />
                    </button>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-mono font-bold text-lg">{currentEntry.entry_code}</span>
                    <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                      {CLASS_LABELS[currentEntry.class_category]}
                    </span>
                  </div>

                  {/* Score buttons */}
                  <div className="border-t pt-4">
                    <label className="text-sm font-semibold block mb-2">एकूण गुण (१ ते १०)</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <button
                          key={n}
                          onClick={() => updateScore(currentEntry.id, n)}
                          className={`w-9 h-9 rounded-full text-sm font-bold transition-all ${
                            scores[currentEntry.id]?.score === n
                              ? 'bg-primary text-primary-foreground shadow-md scale-110'
                              : 'bg-muted text-foreground hover:bg-primary/20'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    {scores[currentEntry.id]?.score > 0 && (
                      <p className="text-center mt-2 text-primary font-bold text-lg">
                        {scores[currentEntry.id].score}/10
                      </p>
                    )}
                  </div>

                  <Textarea
                    placeholder="शेरा (ऐच्छिक)"
                    className="mt-3"
                    value={scores[currentEntry.id]?.remark || ''}
                    onChange={e => updateRemark(currentEntry.id, e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCurrentEntryIndex(Math.max(0, currentEntryIndex - 1))}
                disabled={currentEntryIndex === 0}
              >
                <ChevronLeft size={18} /> मागे
              </Button>
              {currentEntryIndex < unscoredClassEntries.length - 1 ? (
                <Button
                  className="flex-1"
                  onClick={() => {
                    if (!scores[currentEntry.id]?.score || scores[currentEntry.id].score < 1) {
                      toast.error('कृपया गुण द्या (1-10)');
                      return;
                    }
                    setCurrentEntryIndex(currentEntryIndex + 1);
                  }}
                >
                  पुढे <ChevronRight size={18} />
                </Button>
              ) : (
                <Button className="flex-1" onClick={handleClassReview} disabled={!allClassNewScored}>
                  <Eye size={18} className="mr-1" />
                  पुनरावलोकन
                </Button>
              )}
            </div>

            {/* Quick nav dots */}
            <div className="flex justify-center gap-1 mt-4 flex-wrap">
              {unscoredClassEntries.map((e: any, i: number) => {
                const scored = scores[e.id]?.score >= 1;
                const isNew = newEntryIds.has(e.id);
                return (
                  <button
                    key={e.id}
                    onClick={() => setCurrentEntryIndex(i)}
                    className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all ${
                      i === currentEntryIndex
                        ? 'bg-primary text-primary-foreground'
                        : isNew
                        ? 'bg-accent text-accent-foreground animate-pulse'
                        : scored
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JudgePanel;
