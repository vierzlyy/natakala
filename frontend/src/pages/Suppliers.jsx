import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import supplierService from '../services/supplierService';
import { getErrorMessage } from '../services/serviceUtils';

const initialForm = { name: '', contact: '', address: '', email: '', phone: '' };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const response = await supplierService.getAll();
      setSuppliers(response.data || []);
    } catch (error) {
      const message = getErrorMessage(error, 'Gagal memuat supplier.');
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const openCreate = () => {
    setSelected(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEdit = (supplier) => {
    setSelected(supplier);
    setForm({
      name: supplier.name || '',
      contact: supplier.contact || '',
      address: supplier.address || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
    });
    setShowModal(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const nextErrors = {};
    const normalizedName = form.name.trim().toLowerCase();
    const normalizedEmail = form.email.trim().toLowerCase();

    if (!normalizedName) {
      nextErrors.name = 'Nama supplier wajib diisi.';
    }

    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = 'Format email belum valid.';
    }

    const duplicateName = suppliers.find(
      (supplier) =>
        String(supplier.name || '').trim().toLowerCase() === normalizedName &&
        String(supplier.id) !== String(selected?.id || ''),
    );

    if (duplicateName) {
      nextErrors.name = 'Nama supplier sudah digunakan.';
    }

    if (normalizedEmail) {
      const duplicateEmail = suppliers.find(
        (supplier) =>
          String(supplier.email || '').trim().toLowerCase() === normalizedEmail &&
          String(supplier.id) !== String(selected?.id || ''),
      );

      if (duplicateEmail) {
        nextErrors.email = 'Email supplier sudah digunakan.';
      }
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
        const response = await supplierService.update(selected.id, form);
        setSuppliers((prev) => prev.map((item) => (item.id === selected.id ? response.data : item)));
        toast.success('Supplier berhasil diperbarui.');
      } else {
        const response = await supplierService.create(form);
        setSuppliers((prev) => [response.data, ...prev]);
        toast.success('Supplier berhasil ditambahkan.');
      }
      setShowModal(false);
      setForm(initialForm);
      setSelected(null);
      setFormErrors({});
    } catch (error) {
      toast.error(getErrorMessage(error, 'Gagal menyimpan supplier.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (supplier) => {
    if (!window.confirm(`Hapus supplier ${supplier.name}?`)) return;

    try {
      await supplierService.remove(supplier.id);
      setSuppliers((prev) => prev.filter((item) => item.id !== supplier.id));
      toast.success('Supplier berhasil dihapus.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Gagal menghapus supplier.'));
    }
  };

  const columns = useMemo(
    () => [
      { key: 'name', title: 'Nama Supplier' },
      { key: 'contact', title: 'Kontak' },
      { key: 'email', title: 'Email' },
      { key: 'phone', title: 'Telepon' },
      { key: 'address', title: 'Alamat' },
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
            <h3 className="text-2xl font-bold text-ink">Supplier</h3>
            <p className="text-sm text-muted">Kelola mitra pemasok untuk alur pembelian dan restock.</p>
          </div>
          <Button onClick={openCreate}>Tambah Supplier</Button>
        </div>
      </Card>

      <Card className="p-6">
        {errorMessage ? (
          <div className="mb-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
            {errorMessage}
          </div>
        ) : null}
        <Table columns={columns} data={suppliers} loading={loading} emptyMessage="Belum ada supplier." />
      </Card>

      <Modal
        open={showModal}
        title={selected ? 'Edit Supplier' : 'Tambah Supplier'}
        onClose={() => setShowModal(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button type="submit" form="supplier-form" loading={saving}>
              Simpan
            </Button>
          </>
        }
      >
        <form id="supplier-form" className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Input label="Nama Supplier" name="name" value={form.name} onChange={handleChange} error={formErrors.name} />
          <Input label="Kontak" name="contact" value={form.contact} onChange={handleChange} />
          <Input label="Email" name="email" value={form.email} onChange={handleChange} error={formErrors.email} />
          <Input label="Telepon" name="phone" value={form.phone} onChange={handleChange} />
          <Input label="Alamat" as="textarea" name="address" value={form.address} onChange={handleChange} containerClassName="md:col-span-2" />
        </form>
      </Modal>
    </div>
  );
}
