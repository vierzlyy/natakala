import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import SearchableSelect from '../components/ui/SearchableSelect';
import CurrencyInput from '../components/ui/CurrencyInput';
import categoryService from '../services/categoryService';
import productService from '../services/productService';
import supplierService from '../services/supplierService';
import { getErrorMessage } from '../services/serviceUtils';
import generateBarcode from '../utils/barcodeGenerator';
import generateSku from '../utils/skuGenerator';
import { useSettings } from '../context/SettingsContext';

const initialForm = {
  sku: '',
  name: '',
  category_id: '',
  size: '',
  color: '',
  storage_zone: '',
  storage_aisle: '',
  storage_rack: '',
  storage_bin: '',
  purchase_price: '',
  selling_price: '',
  supplier_id: '',
  initial_stock: 0,
  barcode: '',
  minimum_stock: 5,
  image: null,
};

const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'Allsize'];


export default function ProductForm() {
  const { settings } = useSettings();
  const availableSizes = settings?.sizes?.length ? settings.sizes : DEFAULT_SIZES;
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = useMemo(() => Boolean(id), [id]);
  const [form, setForm] = useState(initialForm);
  const [preview, setPreview] = useState('');
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [originalKeys, setOriginalKeys] = useState({ name: '', category_id: '', size: '', color: '' });

  const resolveAutoSku = (nextProductName, nextCategoryId, nextSize, nextColor) => {
    if (!nextProductName || !nextCategoryId || !nextSize || !categories.length) {
      return '';
    }

    return generateSku({
      products,
      categories,
      productName: nextProductName,
      categoryId: nextCategoryId,
      size: nextSize,
      color: nextColor,
      currentProductId: id,
    });
  };

  const resolveAutoBarcode = (nextProductName) => {
    if (!nextProductName) {
      return '';
    }

    return generateBarcode({
      products,
      productName: nextProductName,
      currentProductId: id,
    });
  };

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setPageLoading(true);
        const requests = [
          categoryService.getAll(),
          supplierService.getAll(),
          productService.getAll({ page: 1, per_page: 1000 }),
        ];

        if (isEdit) {
          requests.push(productService.getById(id));
        }

        const [categoryResponse, supplierResponse, productsResponse, productDetailResponse] = await Promise.all(requests);

        setCategories(categoryResponse.data || []);
        setSuppliers(supplierResponse.data || []);
        setProducts(productsResponse.data || []);

        if (isEdit && productDetailResponse) {
          const product = productDetailResponse.data || productDetailResponse;
          setForm({
            sku: product.sku || '',
            name: product.name || '',
            category_id: product.category_id || '',
            size: product.size || '',
            color: product.color || '',
            storage_zone: product.storage_zone || '',
            storage_aisle: product.storage_aisle || '',
            storage_rack: product.storage_rack || '',
            storage_bin: product.storage_bin || '',
            purchase_price: product.purchase_price || '',
            selling_price: product.selling_price || '',
            supplier_id: product.supplier_id || '',
            initial_stock: product.stock ?? product.initial_stock ?? 0,
            barcode: product.barcode || '',
            minimum_stock: product.minimum_stock || 5,
            image: null,
          });
          setOriginalKeys({
            name: String(product.name || '').trim(),
            category_id: String(product.category_id || ''),
            size: String(product.size || ''),
            color: String(product.color || '').trim(),
          });
          setPreview(product.image_url || '');
        }
      } catch (error) {
        toast.error(getErrorMessage(error, 'Gagal memuat form produk.'));
      } finally {
        setPageLoading(false);
      }
    };

    loadInitial();
  }, [id, isEdit]);

  useEffect(() => {
    if (!form.name || !form.category_id || !form.size || !categories.length) {
      return;
    }

    if (
      isEdit &&
      String(form.name).trim() === originalKeys.name &&
      String(form.category_id) === originalKeys.category_id &&
      String(form.size) === originalKeys.size &&
      String(form.color).trim() === originalKeys.color &&
      form.sku
    ) {
      return;
    }

    const nextSku = resolveAutoSku(form.name, form.category_id, form.size, form.color);
    const nextBarcode = resolveAutoBarcode(form.name);

    if ((nextSku && nextSku !== form.sku) || (nextBarcode && nextBarcode !== form.barcode)) {
      setForm((prev) => ({
        ...prev,
        sku: nextSku,
        barcode: nextBarcode,
      }));
    }
  }, [form.name, form.category_id, form.size, form.color, categories, products, isEdit, originalKeys.name, originalKeys.category_id, originalKeys.size, originalKeys.color, id]);

  const handleChange = (event) => {
    const { name, value, files } = event.target;

    if (name === 'image') {
      const file = files?.[0] || null;
      setForm((prev) => ({ ...prev, image: file }));
      setPreview(file ? URL.createObjectURL(file) : preview);
      return;
    }

    setForm((prev) => {
      const nextForm = { ...prev, [name]: value };
      const shouldKeepExistingSku =
        isEdit &&
        String(nextForm.category_id) === originalKeys.category_id &&
        String(nextForm.size) === originalKeys.size &&
        String(nextForm.color).trim() === originalKeys.color &&
        String(nextForm.name).trim() === originalKeys.name &&
        prev.sku;
      const shouldKeepExistingBarcode =
        isEdit &&
        String(nextForm.category_id) === originalKeys.category_id &&
        String(nextForm.size) === originalKeys.size &&
        String(nextForm.color).trim() === originalKeys.color &&
        String(nextForm.name).trim() === originalKeys.name &&
        prev.barcode;

      nextForm.sku = shouldKeepExistingSku ? prev.sku : resolveAutoSku(nextForm.name, nextForm.category_id, nextForm.size, nextForm.color);
      nextForm.barcode = shouldKeepExistingBarcode
        ? prev.barcode
        : resolveAutoBarcode(nextForm.name);
      return nextForm;
    });

    setErrors((prev) => ({ ...prev, [name]: '', sku: '', barcode: '' }));
  };

  const validate = (candidateSku = form.sku) => {
    const nextErrors = {};
    if (!form.category_id) nextErrors.category_id = 'Kategori wajib dipilih.';
    if (!form.supplier_id) nextErrors.supplier_id = 'Supplier wajib dipilih.';
    if (!form.size) nextErrors.size = 'Ukuran wajib diisi.';
    if (!form.color) nextErrors.color = 'Warna wajib diisi.';
    if (!candidateSku) nextErrors.sku = 'SKU otomatis muncul setelah nama produk, kategori, ukuran, dan warna diisi.';
    if (!form.barcode) nextErrors.barcode = 'Barcode otomatis muncul setelah nama produk diisi.';
    if (!form.name) nextErrors.name = 'Nama produk wajib diisi.';
    if (Number(form.purchase_price) < 0) nextErrors.purchase_price = 'Harga beli tidak boleh negatif.';
    if (Number(form.selling_price) < 0) nextErrors.selling_price = 'Harga jual tidak boleh negatif.';
    if (
      form.purchase_price !== '' &&
      form.selling_price !== '' &&
      Number(form.selling_price) < Number(form.purchase_price)
    ) {
      nextErrors.selling_price = 'Harga jual tidak boleh lebih kecil dari harga beli.';
    }
    if (!Number.isInteger(Number(form.initial_stock)) || Number(form.initial_stock) < 0) {
      nextErrors.initial_stock = 'Stok harus berupa integer >= 0.';
    }
    if (!Number.isInteger(Number(form.minimum_stock)) || Number(form.minimum_stock) < 0) {
      nextErrors.minimum_stock = 'Minimum stok harus berupa integer >= 0.';
    }

    const duplicateProduct = products.find(
      (product) =>
        String(product.sku || '').trim().toLowerCase() === String(candidateSku || '').trim().toLowerCase() &&
        String(product.id) !== String(id || ''),
    );

    if (duplicateProduct) {
      nextErrors.sku = 'SKU yang sama sudah digunakan produk lain.';
    }

    const duplicateBarcode = products.find(
      (product) =>
        String(product.barcode || '').trim().toLowerCase() === String(form.barcode || '').trim().toLowerCase() &&
        String(product.id) !== String(id || ''),
    );

    if (duplicateBarcode) {
      nextErrors.barcode = 'Barcode yang sama sudah digunakan produk lain.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = () => {
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });
    return formData;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const finalSku = form.sku || resolveAutoSku(form.name, form.category_id, form.size, form.color);
    const finalBarcode = form.barcode || resolveAutoBarcode(form.name);

    if ((finalSku && finalSku !== form.sku) || (finalBarcode && finalBarcode !== form.barcode)) {
      setForm((prev) => ({ ...prev, sku: finalSku, barcode: finalBarcode }));
    }

    if (!validate(finalSku)) return;

    try {
      setLoading(true);
      const payload = buildPayload();
      if (isEdit) {
        await productService.update(id, payload, true);
        toast.success('Produk berhasil diperbarui.');
      } else {
        await productService.create(payload, true);
        toast.success('Produk berhasil ditambahkan.');
      }
      navigate('/products');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Gagal menyimpan produk.'));
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <Card className="p-6 text-sm text-muted">Memuat form produk...</Card>;
  }

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-ink">{isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
          <p className="text-sm text-muted">Lengkapi data produk dan sinkronkan ke backend inventaris.</p>
        </div>
        <Link to="/products">
          <Button variant="secondary">Kembali</Button>
        </Link>
      </div>

      <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
        <Input label="Nama Produk" name="name" value={form.name} onChange={handleChange} error={errors.name} />
        <SearchableSelect
          label="Kategori"
          name="category_id"
          value={form.category_id}
          onChange={handleChange}
          error={errors.category_id}
          options={categories.map((category) => ({ value: category.id, label: category.name }))}
          placeholder="Pilih kategori"
        />
        <SearchableSelect
          label="Supplier"
          name="supplier_id"
          value={form.supplier_id}
          onChange={handleChange}
          error={errors.supplier_id}
          options={suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))}
          placeholder="Pilih supplier"
        />
        <SearchableSelect
          label="Ukuran"
          name="size"
          value={form.size}
          onChange={handleChange}
          error={errors.size}
          options={availableSizes.map((size) => ({ value: size, label: size }))}
          placeholder="Pilih ukuran"
        />
        <Input label="Warna" name="color" value={form.color} onChange={handleChange} error={errors.color} placeholder="Hitam, Navy, Beige" />
        <Input
          label="SKU"
          name="sku"
          value={form.sku}
          onChange={handleChange}
          error={errors.sku}
          readOnly
          placeholder="Otomatis dari nama produk, kategori, ukuran, dan warna"
          className="bg-surface text-muted"
        />
        <Input label="Zona Gudang" name="storage_zone" value={form.storage_zone} onChange={handleChange} placeholder="Zona A / Zona B" />
        <Input label="Aisle" name="storage_aisle" value={form.storage_aisle} onChange={handleChange} placeholder="Aisle 01" />
        <Input label="Rak" name="storage_rack" value={form.storage_rack} onChange={handleChange} placeholder="Rak A1" />
        <Input label="Bin" name="storage_bin" value={form.storage_bin} onChange={handleChange} placeholder="Bin L-01" />
        <CurrencyInput
          label="Harga Beli"
          name="purchase_price"
          value={form.purchase_price}
          onChange={handleChange}
          error={errors.purchase_price}
          placeholder="0"
        />
        <CurrencyInput
          label="Harga Jual"
          name="selling_price"
          value={form.selling_price}
          onChange={handleChange}
          error={errors.selling_price}
          placeholder="0"
        />
        <Input
          label="Stok Awal"
          type="number"
          name="initial_stock"
          value={form.initial_stock}
          onChange={handleChange}
          error={errors.initial_stock}
        />
        <Input label="Minimum Stok" type="number" name="minimum_stock" value={form.minimum_stock} onChange={handleChange} error={errors.minimum_stock} />
        <Input
          label="Barcode"
          name="barcode"
          value={form.barcode}
          onChange={handleChange}
          error={errors.barcode}
          readOnly
          placeholder="Otomatis dari nama produk"
          className="bg-surface text-muted"
        />
        <Input label="Gambar Produk" type="file" name="image" accept="image/*" onChange={handleChange} />

        {preview ? (
          <div className="md:col-span-2 rounded-[24px] border border-line bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-text">Preview Gambar</p>
            <img src={preview} alt="Preview produk" className="h-56 rounded-2xl object-cover" />
          </div>
        ) : null}

        <div className="md:col-span-2 flex gap-3">
          <Button type="submit" loading={loading}>
            {isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
          </Button>
          <Link to="/products">
            <Button variant="secondary" type="button">
              Batal
            </Button>
          </Link>
        </div>
      </form>
    </Card>
  );
}
