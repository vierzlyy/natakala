import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import categoryService from '../services/categoryService';
import { getErrorMessage } from '../services/serviceUtils';

const initialForm = { name: '', description: '' };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const loadCategories = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const response = await categoryService.getAll();
      setCategories(response.data || []);
    } catch (error) {
      const message = getErrorMessage(error, 'Gagal memuat kategori.');
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const openCreate = () => {
    setSelected(null);
    setForm(initialForm);
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (category) => {
    setSelected(category);
    setForm({ name: category.name || '', description: category.description || '' });
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const nextErrors = {};
    const normalizedName = form.name.trim().toLowerCase();

    if (!normalizedName) {
      nextErrors.name = 'Nama kategori wajib diisi.';
    }

    const duplicateName = categories.find(
      (category) =>
        String(category.name || '').trim().toLowerCase() === normalizedName &&
        String(category.id) !== String(selected?.id || ''),
    );

    if (duplicateName) {
      nextErrors.name = 'Nama kategori sudah digunakan.';
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      if (selected) {
        const response = await categoryService.update(selected.id, form);
        setCategories((prev) => prev.map((item) => (item.id === selected.id ? response.data : item)));
        toast.success('Kategori berhasil diperbarui.');
      } else {
        const response = await categoryService.create(form);
        setCategories((prev) => [response.data, ...prev]);
        toast.success('Kategori berhasil ditambahkan.');
      }
      setShowModal(false);
      setSelected(null);
      setForm(initialForm);
      setFormErrors({});
    } catch (error) {
      toast.error(getErrorMessage(error, 'Gagal menyimpan kategori.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Hapus kategori ${category.name}?`)) return;

    try {
      await categoryService.remove(category.id);
      setCategories((prev) => prev.filter((item) => item.id !== category.id));
      toast.success('Kategori berhasil dihapus.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Gagal menghapus kategori.'));
    }
  };

  const columns = useMemo(
    () => [
      { key: 'name', title: 'Nama Kategori' },
      { key: 'description', title: 'Deskripsi' },
      {
        key: 'actions',
        title: 'Aksi',
        render: (row) => (
          <div className="flex gap-2">
            <Button variant="warning" className="px-3 py-2 text-xs" onClick={() => openEdit(row)}>
              Edit
            </Button>
            <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => handleDelete(row)}>
              Hapus
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-ink">Kategori Produk</h3>
            <p className="text-sm text-muted">Kelompokkan item pakaian agar proses pencarian dan laporan lebih rapi.</p>
          </div>
          <Button onClick={openCreate}>Tambah Kategori</Button>
        </div>
      </Card>

      <Card className="p-6">
        {errorMessage ? (
          <div className="mb-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
            {errorMessage}
          </div>
        ) : null}
        <Table columns={columns} data={categories} loading={loading} emptyMessage="Belum ada kategori." />
      </Card>

      <Modal
        open={showModal}
        title={selected ? 'Edit Kategori' : 'Tambah Kategori'}
        onClose={() => setShowModal(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button type="submit" form="category-form" loading={saving}>
              Simpan
            </Button>
          </>
        }
      >
        <form id="category-form" className="grid gap-4" onSubmit={handleSubmit}>
          <Input label="Nama Kategori" name="name" value={form.name} onChange={handleChange} error={formErrors.name} />
          <Input label="Deskripsi" as="textarea" name="description" value={form.description} onChange={handleChange} />
        </form>
      </Modal>
    </div>
  );
}
