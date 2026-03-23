import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, FileText, Archive, Trash2 } from 'lucide-react';

const AdminReports = () => {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reports, setReports] = useState<any[]>([]);

  const loadReports = async () => {
    const { data } = await supabase.from('annual_reports').select('*').order('year', { ascending: false });
    setReports(data || []);
  };

  useEffect(() => { loadReports(); }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) { toast.error('PDF फाइल आवश्यक आहे'); return; }
    if (!year || isNaN(Number(year)) || Number(year) < 2000 || Number(year) > 2100) {
      toast.error('वैध वर्ष प्रविष्ट करा'); return;
    }
    if (!pdfFile.name.endsWith('.pdf')) { toast.error('फक्त PDF फाइल स्वीकारली जाते'); return; }
    if (zipFile && !zipFile.name.endsWith('.zip')) { toast.error('फक्त ZIP फाइल स्वीकारली जाते'); return; }

    setUploading(true);
    try {
      // Upload PDF
      const pdfPath = `${year}/report.pdf`;
      await supabase.storage.from('annual-reports').remove([pdfPath]);
      const { error: pdfErr } = await supabase.storage.from('annual-reports').upload(pdfPath, pdfFile, { upsert: true });
      if (pdfErr) throw pdfErr;
      const { data: pdfUrlData } = supabase.storage.from('annual-reports').getPublicUrl(pdfPath);

      let zipUrl = null;
      if (zipFile) {
        const zipPath = `${year}/report.zip`;
        await supabase.storage.from('annual-reports').remove([zipPath]);
        const { error: zipErr } = await supabase.storage.from('annual-reports').upload(zipPath, zipFile, { upsert: true });
        if (zipErr) throw zipErr;
        const { data: zipUrlData } = supabase.storage.from('annual-reports').getPublicUrl(zipPath);
        zipUrl = zipUrlData.publicUrl;
      }

      // Upsert report record
      const { error: dbErr } = await supabase.from('annual_reports').upsert(
        { year: Number(year), pdf_url: pdfUrlData.publicUrl, zip_url: zipUrl, updated_at: new Date().toISOString() },
        { onConflict: 'year' }
      );
      if (dbErr) throw dbErr;

      toast.success(`${year} वर्षाचा अहवाल यशस्वीरित्या अपलोड झाला!`);
      setPdfFile(null);
      setZipFile(null);
      loadReports();
    } catch (err: any) {
      toast.error('अपलोड अयशस्वी: ' + (err.message || 'अज्ञात त्रुटी'));
    }
    setUploading(false);
  };

  const handleDelete = async (report: any) => {
    if (!confirm(`${report.year} वर्षाचा अहवाल हटवायचा?`)) return;
    await supabase.storage.from('annual-reports').remove([`${report.year}/report.pdf`, `${report.year}/report.zip`]);
    await supabase.from('annual_reports').delete().eq('id', report.id);
    toast.success('अहवाल हटवला');
    loadReports();
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">वार्षिक अहवाल व्यवस्थापन</h1>

      <div className="grid gap-6 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload size={20} /> अहवाल अपलोड करा
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">वर्ष</label>
                <Input type="number" value={year} onChange={e => setYear(e.target.value)} min="2000" max="2100" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">PDF फाइल <span className="text-destructive">*</span></label>
                <Input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">ZIP फाइल (पर्यायी)</label>
                <Input type="file" accept=".zip" onChange={e => setZipFile(e.target.files?.[0] || null)} />
              </div>
              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? 'अपलोड होत आहे...' : 'अपलोड करा'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {reports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">अपलोड केलेले अहवाल</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reports.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-primary" />
                    <div>
                      <p className="font-semibold">{r.year}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>PDF ✓</span>
                        {r.zip_url && <span>ZIP ✓</span>}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(r)}>
                    <Trash2 size={16} className="text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
