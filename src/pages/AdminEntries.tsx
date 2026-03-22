import React, { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Camera, Upload, RotateCcw, Lock, Unlock, Flashlight, FlashlightOff } from 'lucide-react';

const CLASS_OPTIONS = [
  { value: 'chota_gat', label: 'छोटा गट' },
  { value: 'motha_gat', label: 'मोठा गट' },
  { value: 'khula_gat', label: 'खुला गट' },
] as const;

const compressImage = (blob: Blob, maxWidth = 800): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) {
        h = (h * maxWidth) / w;
        w = maxWidth;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error('Compression failed'));
        },
        'image/jpeg',
        0.7
      );
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(blob);
  });
};

const AdminEntries = () => {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedComp, setSelectedComp] = useState('');
  const [selectedCompObj, setSelectedCompObj] = useState<any>(null);
  const [participantName, setParticipantName] = useState('');
  const [classCategory, setClassCategory] = useState<string>('chota_gat');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCompetitions();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (selectedComp) {
      loadEntries();
      const comp = competitions.find(c => c.id === selectedComp);
      setSelectedCompObj(comp);
    }
  }, [selectedComp, competitions]);

  const loadCompetitions = async () => {
    const { data } = await supabase.from('competitions').select('*').order('created_at', { ascending: false });
    setCompetitions(data || []);
    if (data?.[0]) setSelectedComp(data[0].id);
  };

  const loadEntries = async () => {
    const { data } = await supabase
      .from('entries')
      .select('*')
      .eq('competition_id', selectedComp)
      .order('entry_code');
    setEntries(data || []);
  };

  const startCamera = useCallback(async () => {
    try {
      setCameraActive(true);
      setCameraReady(false);
      setTorchOn(false);
      setTorchSupported(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 800 }, height: { ideal: 600 } },
        audio: false,
      });
      streamRef.current = stream;

      // Check torch support
      const track = stream.getVideoTracks()[0];
      if (track) {
        const caps = track.getCapabilities?.() as any;
        if (caps?.torch) {
          setTorchSupported(true);
        }
      }

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setCameraReady(true);
          };
        }
      });
    } catch (err) {
      console.error('Camera error:', err);
      setCameraActive(false);
      toast.error('कॅमेरा उघडता आला नाही. कृपया परवानगी द्या.');
    }
  }, []);

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    const newState = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: newState } as any] });
      setTorchOn(newState);
    } catch {
      toast.error('Flash या डिव्हाइसवर सपोर्ट नाही');
      setTorchSupported(false);
    }
  }, [torchOn]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraReady(false);
    setTorchOn(false);
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      async (blob) => {
        if (blob) {
          try {
            const compressed = await compressImage(blob);
            setCapturedBlob(compressed);
            setCapturedImage(URL.createObjectURL(compressed));
          } catch {
            setCapturedBlob(blob);
            setCapturedImage(URL.createObjectURL(blob));
          }
        }
        stopCamera();
      },
      'image/jpeg',
      0.9
    );
  }, [stopCamera]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setCapturedBlob(compressed);
      setCapturedImage(URL.createObjectURL(compressed));
    } catch {
      setCapturedBlob(file);
      setCapturedImage(URL.createObjectURL(file));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getNextEntryCode = () => {
    const prefix = selectedCompObj?.prefix || 'R';
    const count = entries.length + 1;
    return `${prefix}${String(count).padStart(3, '0')}`;
  };

  const resetForm = () => {
    setCapturedImage(null);
    setCapturedBlob(null);
    setParticipantName('');
  };

  const submitEntry = async () => {
    if (!capturedBlob || !participantName.trim() || !selectedComp) return;
    setUploading(true);

    try {
      const entryCode = getNextEntryCode();
      const filePath = `${selectedComp}/${entryCode}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('competition-entries')
        .upload(filePath, capturedBlob, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) {
        toast.error('फोटो अपलोड अयशस्वी: ' + uploadError.message);
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('competition-entries')
        .getPublicUrl(filePath);

      const { error } = await supabase.from('entries').insert({
        competition_id: selectedComp,
        entry_code: entryCode,
        participant_name: participantName.trim(),
        class_category: classCategory as any,
        image_url: publicUrl,
      });

      if (error) {
        toast.error('नोंद अयशस्वी: ' + error.message);
      } else {
        toast.success(`${entryCode} नोंद यशस्वी!`);
        resetForm();
        loadEntries();
      }
    } catch (err) {
      toast.error('काहीतरी चुकले');
    }
    setUploading(false);
  };

  const toggleLock = async () => {
    if (!selectedCompObj) return;
    const { error } = await supabase
      .from('competitions')
      .update({ is_locked: !selectedCompObj.is_locked })
      .eq('id', selectedComp);
    if (error) toast.error(error.message);
    else {
      toast.success(selectedCompObj.is_locked ? 'स्पर्धा अनलॉक झाली' : 'स्पर्धा लॉक झाली');
      loadCompetitions();
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">नोंदणी व्यवस्थापन</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={selectedComp} onValueChange={setSelectedComp}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="स्पर्धा निवडा" />
          </SelectTrigger>
          <SelectContent>
            {competitions.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedCompObj && (
          <Button
            variant={selectedCompObj.is_locked ? 'destructive' : 'outline'}
            onClick={toggleLock}
          >
            {selectedCompObj.is_locked ? <><Lock size={16} className="mr-1" /> लॉक</> : <><Unlock size={16} className="mr-1" /> अनलॉक</>}
          </Button>
        )}
      </div>

      {/* Camera / Upload */}
      {selectedComp && !selectedCompObj?.is_locked && (
        <Card className="mb-6 max-w-md">
          <CardContent className="p-4 space-y-4">
            <p className="text-sm font-medium">पुढील Entry: <span className="font-mono text-primary font-bold">{getNextEntryCode()}</span></p>

            {cameraActive ? (
              <div className="space-y-2">
                <div className="relative w-full rounded-lg border overflow-hidden bg-black" style={{ minHeight: 200 }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full block"
                  />
                  {!cameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                      कॅमेरा लोड होत आहे...
                    </div>
                  )}
                  {/* Torch toggle */}
                  {cameraReady && (
                    <button
                      onClick={torchSupported ? toggleTorch : () => toast.info('Flash या डिव्हाइसवर सपोर्ट नाही')}
                      className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${
                        torchOn ? 'bg-accent text-accent-foreground' : 'bg-black/50 text-white'
                      }`}
                    >
                      {torchOn ? <Flashlight size={20} /> : <FlashlightOff size={20} />}
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={capturePhoto} className="flex-1" disabled={!cameraReady}>
                    📸 फोटो काढा
                  </Button>
                  <Button variant="outline" onClick={stopCamera}>रद्द करा</Button>
                </div>
              </div>
            ) : capturedImage ? (
              <div className="space-y-2">
                <img src={capturedImage} alt="Captured" className="w-full rounded-lg border" />
                <Button variant="outline" size="sm" onClick={resetForm}>
                  <RotateCcw size={14} className="mr-1" /> पुन्हा काढा
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button onClick={startCamera} className="flex-1">
                  <Camera size={18} className="mr-2" /> कॅमेरा
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={18} className="mr-2" /> अपलोड
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            )}

            <Input
              placeholder="सहभागीचे नाव"
              value={participantName}
              onChange={e => setParticipantName(e.target.value)}
            />

            <Select value={classCategory} onValueChange={setClassCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLASS_OPTIONS.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              className="w-full"
              onClick={submitEntry}
              disabled={uploading || !capturedBlob || !participantName.trim()}
            >
              {uploading ? 'अपलोड होत आहे...' : 'नोंद जतन करा'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Entry list */}
      <h2 className="text-lg font-semibold mb-3">नोंदी ({entries.length})</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {entries.map(entry => (
          <Card key={entry.id} className="overflow-hidden card-hover">
            {entry.image_url && (
              <img src={entry.image_url} alt={entry.entry_code} className="w-full h-32 object-cover" />
            )}
            <CardContent className="p-3">
              <div className="font-mono font-bold text-sm">{entry.entry_code}</div>
              <div className="text-xs text-muted-foreground">{entry.participant_name}</div>
              <div className="text-xs text-primary">
                {CLASS_OPTIONS.find(c => c.value === entry.class_category)?.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminEntries;
