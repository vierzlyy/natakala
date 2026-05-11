import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, RotateCcw, Upload } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import settingsService from '../services/settingsService';
import { useSettings } from '../context/SettingsContext';
import { datedFilename, saveBlob } from '../utils/fileDownload';

const initialForm = {
  minimum_stock: 5,
  barcode_format: 'CODE128',
  currency: 'IDR',
  sizes: 'S,M,L,XL,XXL,Allsize',
};

export default function Settings() {
  const { refreshSettings } = useSettings();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);

  const applySettings = (data = {}) => {
    setForm({
      minimum_stock: data.minimum_stock || 5,
      barcode_format: data.barcode_format || 'CODE128',
      currency: data.currency || 'IDR',
      sizes: Array.isArray(data.sizes) ? data.sizes.join(',') : data.sizes || 'S,M,L,XL,XXL,Allsize',
    });
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await settingsService.get();
        applySettings(data);
      } catch (error) {
        toast.error('Gagal memuat pengaturan.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveSettings = async (event) => {
    event.preventDefault();

    try {
      setSavingSettings(true);
      await settingsService.update({
        ...form,
        sizes: form.sizes.split(',').map((item) => item.trim()),
      });
      await refreshSettings();
      toast.success('Pengaturan berhasil diperbarui.');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gagal menyimpan pengaturan.');
    } finally {
      setSavingSettings(false);
    }
  };

  const backupDatabase = async () => {
    try {
      setBackingUp(true);
      const { blob } = await settingsService.backup();
      const saveResult = await saveBlob(blob, datedFilename('NataKala Backup Database - Semua Data', '.json'), [
        {
          description: 'File Backup JSON',
          accept: { 'application/json': ['.json'] },
        },
      ]);

      if (saveResult.cancelled) {
        toast('Penyimpanan backup dibatalkan.');
        return;
      }

      toast.success('Backup berhasil diunduh.');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Backup gagal dijalankan. Pastikan endpoint backend sudah aktif.');
    } finally {
      setBackingUp(false);
    }
  };

  const restoreDatabase = async () => {
    if (!restoreFile) {
      toast.error('Pilih file backup terlebih dahulu.');
      return;
    }

    try {
      setRestoring(true);
      const restored = await settingsService.restore(restoreFile);
      const settings = restored?.data || restored?.settings || restored;
      applySettings(settings);
      await refreshSettings();
      setRestoreFile(null);
      toast.success('Restore berhasil dijalankan.');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Restore gagal dijalankan. Pastikan file backup valid.');
    } finally {
      setRestoring(false);
    }
  };

  if (loading) {
    return <Card className="p-6 text-sm text-muted">Memuat pengaturan...</Card>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-2xl font-bold text-ink">Pengaturan Sistem</h3>
        <p className="mt-1 text-sm text-muted">Atur batas minimum stok, barcode, mata uang, ukuran, dan backup database.</p>
      </Card>

      <Card className="p-6">
        <form className="grid gap-5 md:grid-cols-2" onSubmit={saveSettings}>
          <Input label="Batas Minimum Stok" type="number" name="minimum_stock" value={form.minimum_stock} onChange={handleChange} />
          <Input label="Format Barcode" as="select" name="barcode_format" value={form.barcode_format} onChange={handleChange}>
            <option value="CODE128">CODE128</option>
            <option value="EAN13">EAN13</option>
            <option value="QR">QR Code</option>
          </Input>
          <Input label="Mata Uang" as="select" name="currency" value={form.currency} onChange={handleChange}>
            <option value="IDR">IDR</option>
            <option value="USD">USD</option>
          </Input>
          <Input label="Manajemen Ukuran" name="sizes" value={form.sizes} onChange={handleChange} placeholder="Pisahkan dengan koma" />
          <div className="md:col-span-2">
            <Button type="submit" loading={savingSettings}>
              Simpan Pengaturan
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-xl font-bold text-ink">Backup & Restore</h4>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
              Unduh backup seluruh data inventaris, lalu unggah kembali file JSON tersebut saat perlu memulihkan data website.
            </p>
          </div>
          <Button onClick={backupDatabase} loading={backingUp} className="lg:min-w-[190px]">
            <Download size={16} />
            Backup Database
          </Button>
        </div>
        <div className="mt-5 grid gap-4 rounded-2xl border border-line bg-surface p-4 md:grid-cols-[1fr_auto] md:items-end">
          <Input
            label="File Restore"
            type="file"
            accept=".json,.txt,application/json,text/plain"
            onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
          />
          <Button variant="warning" onClick={restoreDatabase} loading={restoring} disabled={!restoreFile} className="md:min-w-[190px]">
            <Upload size={16} />
            Restore Database
          </Button>
          <div className="text-xs text-muted md:col-span-2">
            {restoreFile ? (
              <span className="inline-flex items-center gap-2">
                <RotateCcw size={14} />
                Siap restore: <strong className="text-ink">{restoreFile.name}</strong>
              </span>
            ) : (
              'Pilih file backup JSON sebelum menjalankan restore.'
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
