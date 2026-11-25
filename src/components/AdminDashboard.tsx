import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Check,
  Edit3,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  MessageCircle,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type {
  ColorOption,
  Enquiry,
  EnquiryStatus,
  MotifType,
  Order,
  OrderStatus,
  Product,
  ProductCategory,
  Review,
  StoreData,
  StudioSettings,
  WhatsappAlertMode,
} from '../types';
import { PRODUCT_CATEGORIES } from '../data/seedData';
import { CrochetArtwork } from './CrochetArtwork';
import { buildWhatsAppUrl, formatINR } from '../utils/studio';

interface AdminDashboardProps {
  token: string | null;
  onTokenChange: (token: string | null) => void;
  onStoreSync: () => void;
  onExitAdmin?: () => void;
}

const MOTIF_OPTIONS: { value: MotifType; label: string }[] = [
  { value: 'bouquet', label: 'Flower Bouquet' },
  { value: 'sunflower', label: 'Sunflower' },
  { value: 'rose', label: 'Velvet Rose' },
  { value: 'teddy', label: 'Teddy Bear' },
  { value: 'bunny', label: 'Bunny Toy' },
  { value: 'tote', label: 'Granny Square Tote' },
  { value: 'purse', label: 'Crossbody Purse' },
  { value: 'blanket', label: 'Baby Blanket' },
  { value: 'booties', label: 'Baby Booties & Cap' },
  { value: 'keychain', label: 'Bag Charm / Keychain' },
  { value: 'scrunchie', label: 'Ruffled Scrunchie' },
  { value: 'wall-hanging', label: 'Boho Wall Hanging' },
  { value: 'coasters', label: 'Petal Coasters' },
  { value: 'gift-box', label: 'Personalized Gift Box' },
];

const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Crafting',
  'Ready to Ship',
  'Shipped',
  'Delivered',
];

const ENQUIRY_STATUSES: EnquiryStatus[] = [
  'New',
  'In Discussion',
  'Confirmed',
  'Completed',
];

type AdminTab = 'overview' | 'products' | 'orders' | 'enquiries' | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  onTokenChange,
  onStoreSync,
  onExitAdmin,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [notice, setNotice] = useState('');

  // Product Form State
  const productFormRef = useRef<HTMLFormElement | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [pName, setPName] = useState('');
  const [pCategory, setPCategory] = useState<ProductCategory>('Crochet Flowers');
  const [pPrice, setPPrice] = useState('999');
  const [pOriginalPrice, setPOriginalPrice] = useState('');
  const [pStock, setPStock] = useState('12');
  const [pPrepTime, setPPrepTime] = useState('3–4 days handcrafted');
  const [pSizeInfo, setPSizeInfo] = useState('Standard boutique size');
  const [pMaterial, setPMaterial] = useState('100% Combed Milk Cotton Yarn');
  const [pMotif, setPMotif] = useState<MotifType>('bouquet');
  const [pColors, setPColors] = useState<ColorOption[]>([
    { name: 'Blush Rose', hex: '#E3A1B4', accentHex: '#8B3152' },
  ]);
  const [pCustomImageUrl, setPCustomImageUrl] = useState('');
  const [pExistingRealPhotoUrl, setPExistingRealPhotoUrl] = useState('');
  const [pRemoveRealPhoto, setPRemoveRealPhoto] = useState(false);
  const [pDescription, setPDescription] = useState('');
  const [pFeatured, setPFeatured] = useState(true);
  const [pBestSeller, setPBestSeller] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productError, setProductError] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState<'selected' | 'all' | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteReviewId, setConfirmDeleteReviewId] = useState<string | null>(null);

  // Settings Draft State
  const [settingsDraft, setSettingsDraft] = useState<StudioSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingAlert, setTestingAlert] = useState(false);
  const [alertTestResult, setAlertTestResult] = useState<{
    status: string;
    detail: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  const fetchDashboard = async (authToken: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { 'x-admin-token': authToken },
      });
      if (res.status === 401) {
        onTokenChange(null);
        return;
      }
      if (res.ok) {
        const data: StoreData = await res.json();
        setStore(data);
        setSettingsDraft(data.settings);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboard(token);
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoggingIn(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Invalid admin username or password.');
        return;
      }
      onTokenChange(data.token);
      setUsername('');
      setPassword('');
    } catch {
      setAuthError('Unable to reach server.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { 'x-admin-token': token },
        });
      } catch {
        // Ignore network errors on logout
      }
    }
    onTokenChange(null);
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setPName('');
    setPCategory('Crochet Flowers');
    setPPrice('999');
    setPOriginalPrice('');
    setPStock('12');
    setPPrepTime('3–4 days handcrafted');
    setPSizeInfo('Standard boutique size');
    setPMaterial('100% Combed Milk Cotton Yarn');
    setPMotif('bouquet');
    setPColors([{ name: 'Blush Rose', hex: '#E3A1B4', accentHex: '#8B3152' }]);
    setPCustomImageUrl('');
    setPExistingRealPhotoUrl('');
    setPRemoveRealPhoto(false);
    setPDescription('');
    setPFeatured(true);
    setPBestSeller(false);
    setProductError('');
  };

  const startEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setPName(product.name);
    setPCategory(product.category);
    setPPrice(String(product.price));
    setPOriginalPrice(product.originalPrice ? String(product.originalPrice) : '');
    setPStock(String(product.stock));
    setPPrepTime(product.prepTime);
    setPSizeInfo(product.sizeInfo);
    setPMaterial(product.material);
    setPMotif(product.motif);
    setPColors(
      product.colors.length > 0
        ? product.colors.map((c) => ({ ...c }))
        : [{ name: 'Blush Rose', hex: '#E3A1B4', accentHex: '#8B3152' }]
    );
    setPCustomImageUrl(product.customImageUrl || '');
    setPExistingRealPhotoUrl(product.realPhotoUrl || '');
    setPRemoveRealPhoto(false);
    setPDescription(product.description);
    setPFeatured(product.featured);
    setPBestSeller(product.bestSeller);
    setProductError('');
    setShowProductForm(true);
    setTimeout(() => {
      productFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPCustomImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingProduct(true);
    setProductError('');
    try {
      const cleanedColors = pColors
        .map((c) => ({
          name: c.name.trim() || 'Pastel Shade',
          hex: c.hex || '#E3A1B4',
          accentHex: c.accentHex || '#8B3152',
        }))
        .filter((c) => c.name);

      const payload: Record<string, unknown> = {
        name: pName.trim(),
        category: pCategory,
        price: Number(pPrice),
        originalPrice: pOriginalPrice.trim() ? Number(pOriginalPrice) : null,
        stock: Number(pStock),
        prepTime: pPrepTime.trim() || '3–5 days handcrafted',
        sizeInfo: pSizeInfo.trim() || 'Standard boutique size',
        material: pMaterial.trim() || '100% Combed Milk Cotton Yarn',
        motif: pMotif,
        colors:
          cleanedColors.length > 0
            ? cleanedColors
            : [{ name: 'Blush Rose', hex: '#E3A1B4', accentHex: '#8B3152' }],
        customImageUrl: pCustomImageUrl.trim() ? pCustomImageUrl.trim() : null,
        description: pDescription.trim() || 'Handcrafted crochet creation made to order.',
        featured: pFeatured,
        bestSeller: pBestSeller,
      };
      if (editingProductId && pRemoveRealPhoto) {
        payload.realPhotoUrl = null;
      }

      const url = editingProductId ? `/api/products/${editingProductId}` : '/api/products';
      const method = editingProductId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        await fetchDashboard(token);
        onStoreSync();
        setShowProductForm(false);
        resetProductForm();
        showToast(editingProductId ? 'Product updated.' : 'New handmade product published.');
      } else {
        setProductError(data.error || 'Could not save product. Please check the fields.');
      }
    } catch {
      setProductError('Network error while saving product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token },
      });
      if (res.ok) {
        setConfirmDeleteId(null);
        setSelectedProductIds((prev) => prev.filter((item) => item !== id));
        await fetchDashboard(token);
        onStoreSync();
        showToast('Product removed from catalogue.');
      }
    } catch {
      setProductError('Unable to delete product.');
    }
  };

  const handleBulkDeleteProducts = async (mode: 'selected' | 'all') => {
    if (!token) return;
    if (mode === 'selected' && selectedProductIds.length === 0) return;
    try {
      const res = await fetch('/api/products', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify(mode === 'all' ? { all: true } : { ids: selectedProductIds }),
      });
      if (res.ok) {
        const data = await res.json();
        setConfirmBulkDelete(null);
        setSelectedProductIds([]);
        if (editingProductId && (mode === 'all' || selectedProductIds.includes(editingProductId))) {
          setShowProductForm(false);
          resetProductForm();
        }
        await fetchDashboard(token);
        onStoreSync();
        showToast(
          mode === 'all'
            ? `Removed all ${data.deletedCount ?? ''} products from catalogue.`
            : `Removed ${data.deletedCount ?? selectedProductIds.length} selected products.`
        );
      }
    } catch {
      setProductError('Unable to complete bulk deletion.');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (!token) return;
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await fetchDashboard(token);
      showToast(`Order ${orderId} updated to ${status}.`);
    }
  };

  const handleUpdateEnquiryStatus = async (enquiryId: string, status: EnquiryStatus) => {
    if (!token) return;
    const res = await fetch(`/api/admin/enquiries/${enquiryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await fetchDashboard(token);
      showToast(`Enquiry ${enquiryId} marked ${status}.`);
    }
  };

  const handleToggleReviewApproval = async (review: Review) => {
    if (!token) return;
    const res = await fetch(`/api/admin/reviews/${review.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
      body: JSON.stringify({ approved: !review.approved }),
    });
    if (res.ok) {
      await fetchDashboard(token);
      onStoreSync();
      showToast(review.approved ? 'Review hidden from storefront.' : 'Review approved.');
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!token) return;
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-token': token },
    });
    if (res.ok) {
      setConfirmDeleteReviewId(null);
      await fetchDashboard(token);
      onStoreSync();
      showToast('Review deleted.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !settingsDraft) return;
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify(settingsDraft),
      });
      if (res.ok) {
        await fetchDashboard(token);
        onStoreSync();
        showToast('Studio settings saved.');
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestWhatsAppAlert = async () => {
    if (!token || !settingsDraft) return;
    setTestingAlert(true);
    setAlertTestResult(null);
    try {
      const res = await fetch('/api/admin/test-whatsapp-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({ settings: settingsDraft }),
      });
      const data = await res.json();
      setAlertTestResult(data);
    } catch {
      setAlertTestResult({ status: 'Failed', detail: 'Could not reach server to test alert.' });
    } finally {
      setTestingAlert(false);
    }
  };

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-[#E6DDD7] bg-white p-8 shadow-sm space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F4DCE2] text-[#8B3152]">
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="font-display text-3xl font-semibold text-[#2A2225]">
              Studio Owner Admin
            </h1>
            <p className="text-sm text-[#6E6266]">
              Manage crochet products, prices, inventory, orders, enquiries, and studio settings.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="admin-username"
                className="block text-xs font-semibold text-[#2A2225] mb-1.5"
              >
                Admin Username
              </label>
              <input
                id="admin-username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3.5 py-2.5 text-sm focus:border-[#8B3152] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-[#2A2225] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3.5 py-2.5 pr-10 text-sm focus:border-[#8B3152] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#6E6266] hover:text-[#2A2225]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <p className="rounded-xl bg-[#F4DCE2] px-3.5 py-2 text-xs font-medium text-[#65213B]">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full min-h-[46px] rounded-xl bg-[#8B3152] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#65213B] disabled:opacity-50"
            >
              {loggingIn ? 'Signing in...' : 'Sign In to Admin'}
            </button>
          </form>

          <div className="border-t border-[#F2EAE1] pt-4 flex items-center justify-between text-xs text-[#6E6266]">
            <span>Authorized owner access only</span>
            {onExitAdmin && (
              <button
                type="button"
                onClick={onExitAdmin}
                className="inline-flex items-center gap-1 font-semibold text-[#8B3152] hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Store
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const totalRevenue = store?.orders.reduce((sum, o) => sum + o.total, 0) || 0;
  const lowStockProducts = store?.products.filter((p) => p.stock <= 8) || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6DDD7] pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#8B3152]">
            The Crocheting Era Management
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-semibold text-[#2A2225]">
            Studio Admin Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onExitAdmin && (
            <button
              type="button"
              onClick={onExitAdmin}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#E6DDD7] bg-white px-3.5 py-2 text-xs font-semibold text-[#2A2225] hover:bg-[#F2EAE1] whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              View Storefront
            </button>
          )}
          <button
            type="button"
            onClick={() => fetchDashboard(token)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#E6DDD7] bg-white px-3.5 py-2 text-xs font-semibold text-[#2A2225] hover:bg-[#F2EAE1] whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#E6DDD7] bg-white px-3.5 py-2 text-xs font-semibold text-[#6E6266] hover:text-[#8B3152] whitespace-nowrap shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-[#51664A]/30 bg-[#E4EBE2] px-4 py-3 text-xs font-semibold text-[#3C4F36]">
          <Check className="h-4 w-4" />
          {notice}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'overview', label: 'Sales & Overview', icon: BarChart3 },
            {
              id: 'products',
              label: `Products (${store?.products.length || 0})`,
              icon: Package,
            },
            {
              id: 'orders',
              label: `Orders (${store?.orders.length || 0})`,
              icon: ShoppingBag,
            },
            {
              id: 'enquiries',
              label: `Enquiries (${store?.enquiries.length || 0})`,
              icon: MessageCircle,
            },
            { id: 'settings', label: 'Reviews & Settings', icon: Settings },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'border-[#8B3152] bg-[#8B3152] text-white'
                  : 'border-[#E6DDD7] bg-white text-[#2A2225] hover:bg-[#F2EAE1]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && store && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#E6DDD7] bg-white p-5 space-y-1">
              <p className="text-xs font-medium text-[#6E6266]">Gross Studio Sales</p>
              <p className="font-display text-3xl font-semibold text-[#8B3152] tabular-nums">
                {formatINR(totalRevenue)}
              </p>
              <p className="text-xs text-[#51664A]">
                Across {store.orders.length} customer orders
              </p>
            </div>
            <div className="rounded-2xl border border-[#E6DDD7] bg-white p-5 space-y-1">
              <p className="text-xs font-medium text-[#6E6266]">Active Handmade Items</p>
              <p className="font-display text-3xl font-semibold text-[#2A2225] tabular-nums">
                {store.products.length}
              </p>
              <p className="text-xs text-[#6E6266]">
                7 boutique crochet categories
              </p>
            </div>
            <div className="rounded-2xl border border-[#E6DDD7] bg-white p-5 space-y-1">
              <p className="text-xs font-medium text-[#6E6266]">Custom &amp; Contact Enquiries</p>
              <p className="font-display text-3xl font-semibold text-[#2A2225] tabular-nums">
                {store.enquiries.length}
              </p>
              <p className="text-xs text-[#6E6266]">
                {store.enquiries.filter((e) => e.status === 'New').length} awaiting reply
              </p>
            </div>
            <div className="rounded-2xl border border-[#E6DDD7] bg-white p-5 space-y-1">
              <p className="text-xs font-medium text-[#6E6266]">Newsletter Subscribers</p>
              <p className="font-display text-3xl font-semibold text-[#2A2225] tabular-nums">
                {store.newsletter.length}
              </p>
              <p className="text-xs text-[#6E6266]">Studio launch list</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7 rounded-2xl border border-[#E6DDD7] bg-white p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold text-[#2A2225]">
                  Recent Customer Orders
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-semibold text-[#8B3152] hover:underline"
                >
                  Manage all
                </button>
              </div>
              {store.orders.length === 0 ? (
                <p className="text-sm text-[#6E6266]">
                  No customer orders yet. New orders will appear here and trigger your configured WhatsApp alert.
                </p>
              ) : (
                <div className="divide-y divide-[#F2EAE1]">
                  {store.orders.slice(0, 5).map((ord) => (
                    <div key={ord.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#2A2225] truncate">
                          <span className="font-mono text-xs text-[#8B3152] mr-2">{ord.id}</span>
                          {ord.customerName}
                        </p>
                        <p className="text-xs text-[#6E6266]">
                          {ord.city || 'India'} · {ord.paymentMethod} · {ord.status}
                        </p>
                      </div>
                      <span className="font-semibold tabular-nums text-[#2A2225]">
                        {formatINR(ord.total)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-[#E6DDD7] bg-white p-6 space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#8B3152]" />
                <h2 className="font-display text-2xl font-semibold text-[#2A2225]">
                  Low Inventory Watchlist
                </h2>
              </div>
              {lowStockProducts.length === 0 ? (
                <p className="text-sm text-[#6E6266]">All products have comfortable stock levels.</p>
              ) : (
                <div className="divide-y divide-[#F2EAE1]">
                  {lowStockProducts.map((prod) => (
                    <div key={prod.id} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="text-[#2A2225] truncate pr-3">{prod.name}</span>
                      <span className="font-mono text-xs font-semibold text-[#8B3152] tabular-nums shrink-0">
                        {prod.stock} left
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && store && (() => {
        const filteredProducts = store.products.filter((p) => {
          const q = productSearch.trim().toLowerCase();
          if (!q) return true;
          return (
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
          );
        });
        const allFilteredSelected =
          filteredProducts.length > 0 &&
          filteredProducts.every((p) => selectedProductIds.includes(p.id));

        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold text-[#2A2225]">
                Catalogue &amp; Inventory
              </h2>
              <div className="flex flex-wrap items-center gap-2.5">
                {store.products.length > 0 && (
                  <>
                    {selectedProductIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setConfirmBulkDelete('selected')}
                        className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[#8B3152]/40 bg-[#F4DCE2]/60 px-3.5 py-2 text-xs font-semibold text-[#65213B] hover:bg-[#F4DCE2]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Selected ({selectedProductIds.length})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setConfirmBulkDelete('all')}
                      className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[#E6DDD7] bg-white px-3.5 py-2 text-xs font-semibold text-[#6E6266] hover:border-[#8B3152] hover:text-[#8B3152]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete All Items
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (showProductForm) {
                      setShowProductForm(false);
                      resetProductForm();
                    } else {
                      resetProductForm();
                      setShowProductForm(true);
                    }
                  }}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#8B3152] px-4 py-2 text-xs font-semibold text-white hover:bg-[#65213B]"
                >
                  <Plus className="h-4 w-4" />
                  {showProductForm ? 'Close Form' : 'Add New Product'}
                </button>
              </div>
            </div>

            {confirmBulkDelete && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E6B8B8] bg-[#FDF2F2] px-5 py-4">
                <p className="text-xs font-semibold text-[#65213B]">
                  {confirmBulkDelete === 'all'
                    ? `Remove all ${store.products.length} products from your studio catalogue? This cannot be undone.`
                    : `Remove ${selectedProductIds.length} selected product(s) from your studio catalogue?`}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBulkDeleteProducts(confirmBulkDelete)}
                    className="min-h-[36px] rounded-xl bg-[#8B3152] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#65213B]"
                  >
                    {confirmBulkDelete === 'all' ? 'Confirm Delete All' : 'Confirm Delete Selected'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmBulkDelete(null)}
                    className="min-h-[36px] rounded-xl border border-[#E6DDD7] bg-white px-3.5 py-1.5 text-xs font-medium text-[#6E6266]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {showProductForm && (
              <form
                ref={productFormRef}
                onSubmit={handleSaveProduct}
                className="rounded-2xl border border-[#E6DDD7] bg-white p-6 space-y-5"
              >
                <h3 className="font-display text-2xl font-semibold text-[#2A2225]">
                  {editingProductId ? 'Edit Crochet Product' : 'Add New Handmade Product'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                      Product Name *
                    </label>
                    <input
                      required
                      value={pName}
                      onChange={(e) => setPName(e.target.value)}
                      placeholder="Enter product title"
                      className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm focus:border-[#8B3152] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                      Category
                    </label>
                    <select
                      value={pCategory}
                      onChange={(e) => setPCategory(e.target.value as ProductCategory)}
                      className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm focus:border-[#8B3152] focus:outline-none"
                    >
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                      Studio Illustration Motif
                    </label>
                    <select
                      value={pMotif}
                      onChange={(e) => setPMotif(e.target.value as MotifType)}
                      className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm focus:border-[#8B3152] focus:outline-none"
                    >
                      {MOTIF_OPTIONS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                      Price (₹ INR) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={pPrice}
                      onChange={(e) => setPPrice(e.target.value)}
                      className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm tabular-nums focus:border-[#8B3152] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                      Compare-at Price (Optional ₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={pOriginalPrice}
                      onChange={(e) => setPOriginalPrice(e.target.value)}
                      placeholder="Optional MRP"
                      className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm tabular-nums focus:border-[#8B3152] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                      Available Stock *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={pStock}
                      onChange={(e) => setPStock(e.target.value)}
                      className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm tabular-nums focus:border-[#8B3152] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                      Dimensions / Size
                    </label>
                    <input
                      value={pSizeInfo}
                      onChange={(e) => setPSizeInfo(e.target.value)}
                      className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm focus:border-[#8B3152] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                      Preparation Time
                    </label>
                    <input
                      value={pPrepTime}
                      onChange={(e) => setPPrepTime(e.target.value)}
                      className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm focus:border-[#8B3152] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                      Material Used
                    </label>
                    <input
                      value={pMaterial}
                      onChange={(e) => setPMaterial(e.target.value)}
                      className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm focus:border-[#8B3152] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Multi-Colour Swatches Editor */}
                <div className="rounded-xl border border-[#EFE6DD] bg-[#FBF7F3] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-[#2A2225]">
                      Available Colours &amp; Yarn Swatches
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setPColors((prev) => [
                          ...prev,
                          { name: 'Cream Ivory', hex: '#F4EDE4', accentHex: '#8B3152' },
                        ])
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E6DDD7] bg-white px-2.5 py-1 text-xs font-semibold text-[#8B3152] hover:border-[#8B3152]"
                    >
                      <Plus className="h-3 w-3" />
                      Add Colour
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pColors.map((col, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-xl border border-[#E6DDD7] bg-white p-2"
                      >
                        <input
                          type="color"
                          value={col.hex}
                          onChange={(e) =>
                            setPColors((prev) =>
                              prev.map((c, i) => (i === idx ? { ...c, hex: e.target.value } : c))
                            )
                          }
                          aria-label={`Swatch colour ${idx + 1}`}
                          className="h-9 w-10 shrink-0 rounded-lg border border-[#E6DDD7] bg-white p-0.5 cursor-pointer"
                        />
                        <input
                          value={col.name}
                          onChange={(e) =>
                            setPColors((prev) =>
                              prev.map((c, i) => (i === idx ? { ...c, name: e.target.value } : c))
                            )
                          }
                          placeholder="Colour name"
                          className="min-w-0 flex-1 rounded-lg border border-[#EFE6DD] bg-[#FBF7F3] px-2.5 py-1.5 text-xs focus:border-[#8B3152] focus:outline-none"
                        />
                        {pColors.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setPColors((prev) => prev.filter((_, i) => i !== idx))
                            }
                            aria-label={`Remove colour ${col.name}`}
                            className="p-1.5 text-[#6E6266] hover:text-[#8B3152]"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Product Photo Upload & Preview */}
                <div className="rounded-xl border border-[#EFE6DD] bg-[#FBF7F3] p-4 space-y-3">
                  <label className="block text-xs font-semibold text-[#2A2225]">
                    Product Photo (Optional)
                  </label>
                  <div className="flex flex-wrap items-center gap-4">
                    {(pCustomImageUrl || (!pRemoveRealPhoto && pExistingRealPhotoUrl)) && (
                      <div className="relative h-16 w-20 overflow-hidden rounded-xl border border-[#E6DDD7] bg-white">
                        <img
                          src={pCustomImageUrl || pExistingRealPhotoUrl}
                          alt="Product preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <label className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#CDBEB5] bg-white px-4 py-2 text-xs font-medium text-[#2A2225] hover:border-[#8B3152]">
                      <Upload className="h-3.5 w-3.5 text-[#8B3152]" />
                      {pCustomImageUrl || (!pRemoveRealPhoto && pExistingRealPhotoUrl)
                        ? 'Replace product photo'
                        : 'Upload product photo'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFile}
                        className="hidden"
                      />
                    </label>
                    {(pCustomImageUrl || (!pRemoveRealPhoto && pExistingRealPhotoUrl)) && (
                      <button
                        type="button"
                        onClick={() => {
                          setPCustomImageUrl('');
                          setPRemoveRealPhoto(true);
                        }}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#E6DDD7] bg-white px-3.5 py-2 text-xs font-medium text-[#6E6266] hover:text-[#8B3152]"
                      >
                        <X className="h-3.5 w-3.5" />
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                    Product Story &amp; Details
                  </label>
                  <textarea
                    rows={2}
                    value={pDescription}
                    onChange={(e) => setPDescription(e.target.value)}
                    placeholder="Describe yarn texture, gifting occasions, and care tips..."
                    className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm focus:border-[#8B3152] focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-[#2A2225]">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pFeatured}
                      onChange={(e) => setPFeatured(e.target.checked)}
                      className="h-4 w-4 accent-[#8B3152]"
                    />
                    Show in Homepage Featured
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pBestSeller}
                      onChange={(e) => setPBestSeller(e.target.checked)}
                      className="h-4 w-4 accent-[#8B3152]"
                    />
                    Highlight in Best Sellers
                  </label>
                </div>

                {productError && (
                  <p className="rounded-xl bg-[#FDF2F2] border border-[#E6B8B8] px-4 py-2.5 text-xs font-medium text-[#9B2C2C]">
                    {productError}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={savingProduct}
                    className="min-h-[44px] rounded-xl bg-[#8B3152] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#65213B] disabled:opacity-50"
                  >
                    {savingProduct
                      ? 'Saving...'
                      : editingProductId
                      ? 'Save Product Changes'
                      : 'Publish Product'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductForm(false);
                      resetProductForm();
                    }}
                    className="min-h-[44px] rounded-xl border border-[#E6DDD7] bg-white px-5 py-2.5 text-sm font-semibold text-[#6E6266] hover:bg-[#F2EAE1]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {store.products.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E6DDD7] bg-white px-4 py-3">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search className="h-4 w-4 text-[#6E6266] shrink-0" />
                  <input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Filter items by name or category..."
                    className="w-full bg-transparent text-sm text-[#2A2225] focus:outline-none"
                  />
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#574D50] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProductIds(filteredProducts.map((p) => p.id));
                      } else {
                        setSelectedProductIds([]);
                      }
                    }}
                    className="h-4 w-4 accent-[#8B3152]"
                  />
                  Select All ({filteredProducts.length})
                </label>
              </div>
            )}

            {store.products.length === 0 ? (
              <div className="rounded-2xl border border-[#E6DDD7] bg-white p-8 text-center space-y-3">
                <p className="text-sm text-[#6E6266]">
                  Your studio catalogue is currently empty. Click “Add New Product” above to publish your first handmade creation.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredProducts.map((prod) => {
                  const isSelected = selectedProductIds.includes(prod.id);
                  return (
                    <div
                      key={prod.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#E6DDD7] bg-white p-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            setSelectedProductIds((prev) =>
                              e.target.checked
                                ? [...prev, prod.id]
                                : prev.filter((id) => id !== prod.id)
                            );
                          }}
                          aria-label={`Select ${prod.name}`}
                          className="h-4 w-4 shrink-0 accent-[#8B3152]"
                        />
                        <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-[#F5EFE8]">
                          <CrochetArtwork
                            motif={prod.motif}
                            primaryColor={prod.colors[0]?.hex || '#E3A1B4'}
                            accentColor={prod.colors[0]?.accentHex}
                            customImageUrl={prod.customImageUrl}
                            realPhotoUrl={prod.realPhotoUrl}
                            realPhotoPosition={prod.realPhotoPosition}
                            alt={prod.name}
                            className="h-full w-full"
                          />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <h3 className="text-sm font-semibold text-[#2A2225] truncate">
                            {prod.name}
                          </h3>
                          <p className="text-xs text-[#6E6266]">
                            {prod.category} · Stock:{' '}
                            <span className="font-mono font-semibold text-[#2A2225] tabular-nums">
                              {prod.stock}
                            </span>{' '}
                            · {prod.colors.length} shade{prod.colors.length === 1 ? '' : 's'} ·{' '}
                            {prod.featured ? 'Featured' : 'Catalogue'}
                            {prod.bestSeller ? ' · Best Seller' : ''}
                          </p>
                          <p className="text-sm font-semibold text-[#8B3152] tabular-nums">
                            {formatINR(prod.price)}
                            {prod.originalPrice && prod.originalPrice > prod.price && (
                              <span className="ml-2 text-xs font-normal text-[#8E8285] line-through">
                                {formatINR(prod.originalPrice)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditProduct(prod)}
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-1.5 text-xs font-semibold text-[#2A2225] hover:border-[#8B3152]"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        {confirmDeleteId === prod.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="min-h-[38px] rounded-xl bg-[#8B3152] px-3 py-1.5 text-xs font-semibold text-white"
                            >
                              Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="min-h-[38px] rounded-xl border border-[#E6DDD7] px-2.5 py-1.5 text-xs text-[#6E6266]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(prod.id)}
                            aria-label={`Delete ${prod.name}`}
                            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#E6DDD7] bg-white px-3 py-1.5 text-xs font-semibold text-[#6E6266] hover:border-[#8B3152] hover:text-[#8B3152]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Orders Tab */}
      {activeTab === 'orders' && store && (
        <div className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-[#2A2225]">
            Customer Orders
          </h2>
          {store.orders.length === 0 ? (
            <p className="rounded-2xl border border-[#E6DDD7] bg-white p-6 text-sm text-[#6E6266]">
              No customer orders yet.
            </p>
          ) : (
            store.orders.map((ord) => (
              <div
                key={ord.id}
                className="rounded-2xl border border-[#E6DDD7] bg-white p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#F2EAE1] pb-3">
                  <div className="space-y-1">
                    <p className="font-mono text-xs font-semibold text-[#8B3152]">
                      {ord.id} · {ord.createdAt.slice(0, 10)}
                    </p>
                    <h3 className="text-base font-semibold text-[#2A2225]">
                      {ord.customerName} ({ord.phone})
                    </h3>
                    <p className="text-xs text-[#6E6266]">
                      {ord.address}, {ord.city}, {ord.state} – {ord.pincode}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="text-right mr-1">
                      <p className="text-base font-bold text-[#2A2225] tabular-nums">
                        {formatINR(ord.total)}
                      </p>
                      <p className="text-xs text-[#6E6266]">{ord.paymentMethod}</p>
                    </div>

                    <a
                      href={buildWhatsAppUrl(
                        ord.phone,
                        `Hello ${ord.customerName}! Your order *${ord.id}* (${formatINR(ord.total)}) is currently *${ord.status}*. Thank you for shopping with The Crocheting Era!`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#E4EBE2] px-3 py-1.5 text-xs font-semibold text-[#3C4F36] hover:bg-[#D5E1D2]"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp Customer
                    </a>

                    <select
                      aria-label={`Order status for ${ord.id}`}
                      value={ord.status}
                      onChange={(e) =>
                        handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)
                      }
                      className="rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-xs font-semibold text-[#2A2225] focus:border-[#8B3152] focus:outline-none"
                    >
                      {ORDER_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-[#4E4347]">
                  {ord.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        • {item.name} ({item.selectedColor.name}) × {item.quantity}
                        {item.customNote ? ` — "${item.customNote}"` : ''}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {formatINR(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                  {ord.giftWrap && (
                    <p className="pt-1 text-[#8B3152]">
                      Gift Wrap Included {ord.giftMessage ? `· Card: "${ord.giftMessage}"` : ''}
                    </p>
                  )}
                  {ord.whatsappAlertStatus && (
                    <p className="pt-1 text-[11px] text-[#6E6266]">
                      Admin WhatsApp Alert: <span className="font-semibold text-[#2A2225]">{ord.whatsappAlertStatus}</span>
                      {ord.whatsappAlertDetail ? ` · ${ord.whatsappAlertDetail}` : ''}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Enquiries Tab */}
      {activeTab === 'enquiries' && store && (
        <div className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-[#2A2225]">
            Custom &amp; Customer Enquiries
          </h2>
          {store.enquiries.length === 0 ? (
            <p className="rounded-2xl border border-[#E6DDD7] bg-white p-6 text-sm text-[#6E6266]">
              No enquiries logged yet.
            </p>
          ) : (
            store.enquiries.map((enq: Enquiry) => (
              <div
                key={enq.id}
                className="rounded-2xl border border-[#E6DDD7] bg-white p-5 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#8B3152]">
                      <span className="font-mono">{enq.id}</span> · {enq.type}
                    </p>
                    <h3 className="text-base font-semibold text-[#2A2225]">
                      {enq.customerName} ({enq.phone})
                    </h3>
                    {(enq.productType || enq.preferredColor || enq.budget) && (
                      <p className="text-xs text-[#6E6266]">
                        {[enq.productType, enq.preferredColor, enq.size, enq.budget]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <a
                      href={buildWhatsAppUrl(
                        enq.phone,
                        `Hello ${enq.customerName}! Thank you for reaching out to The Crocheting Era regarding ${enq.id}.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#E4EBE2] px-3 py-1.5 text-xs font-semibold text-[#3C4F36] hover:bg-[#D5E1D2]"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp
                    </a>
                    <select
                      aria-label={`Enquiry status for ${enq.id}`}
                      value={enq.status}
                      onChange={(e) =>
                        handleUpdateEnquiryStatus(enq.id, e.target.value as EnquiryStatus)
                      }
                      className="rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-xs font-semibold text-[#2A2225] focus:border-[#8B3152] focus:outline-none"
                    >
                      {ENQUIRY_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="rounded-xl bg-[#FBF7F3] p-3 text-sm text-[#4E4347]">
                  {enq.requirements}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reviews & Settings Tab */}
      {activeTab === 'settings' && store && settingsDraft && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-6 space-y-4">
            <h2 className="font-display text-2xl font-semibold text-[#2A2225]">
              Customer Reviews
            </h2>
            <div className="space-y-3">
              {store.reviews.length === 0 ? (
                <p className="rounded-2xl border border-[#E6DDD7] bg-white p-6 text-sm text-[#6E6266]">
                  No customer reviews yet. Reviews submitted on product pages appear here for moderation.
                </p>
              ) : (
                store.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="rounded-2xl border border-[#E6DDD7] bg-white p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2A2225]">
                        <Star className="h-3.5 w-3.5 fill-[#D8A24A] text-[#D8A24A]" />
                        {rev.rating}.0 · {rev.author} ({rev.location})
                      </div>
                      <span className="text-xs text-[#6E6266]">
                        {rev.approved ? 'Published' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-xs text-[#4E4347]">“{rev.comment}”</p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleToggleReviewApproval(rev)}
                        className="rounded-lg border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-1 text-xs font-semibold text-[#2A2225] hover:border-[#8B3152]"
                      >
                        {rev.approved ? 'Hide' : 'Approve'}
                      </button>
                      {confirmDeleteReviewId === rev.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(rev.id)}
                            className="rounded-lg bg-[#8B3152] px-3 py-1 text-xs font-semibold text-white"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteReviewId(null)}
                            className="rounded-lg border border-[#E6DDD7] px-2.5 py-1 text-xs text-[#6E6266]"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteReviewId(rev.id)}
                          className="rounded-lg border border-[#E6DDD7] px-3 py-1 text-xs font-semibold text-[#6E6266] hover:text-[#8B3152]"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <form
            onSubmit={handleSaveSettings}
            className="lg:col-span-6 rounded-2xl border border-[#E6DDD7] bg-white p-6 space-y-4 h-fit"
          >
            <h2 className="font-display text-2xl font-semibold text-[#2A2225]">
              Studio &amp; Checkout Settings
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                WhatsApp Business Number (with country code)
              </label>
              <input
                value={settingsDraft.whatsappNumber}
                onChange={(e) =>
                  setSettingsDraft({ ...settingsDraft, whatsappNumber: e.target.value })
                }
                className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm font-mono focus:border-[#8B3152] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                  Instagram Handle
                </label>
                <input
                  value={settingsDraft.instagramHandle}
                  onChange={(e) =>
                    setSettingsDraft({ ...settingsDraft, instagramHandle: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm focus:border-[#8B3152] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                  Studio Email
                </label>
                <input
                  value={settingsDraft.studioEmail}
                  onChange={(e) =>
                    setSettingsDraft({ ...settingsDraft, studioEmail: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm focus:border-[#8B3152] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                  Free Shipping Threshold (₹)
                </label>
                <input
                  type="number"
                  value={settingsDraft.freeShippingThreshold}
                  onChange={(e) =>
                    setSettingsDraft({
                      ...settingsDraft,
                      freeShippingThreshold: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm tabular-nums focus:border-[#8B3152] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                  Gift Packaging Fee (₹)
                </label>
                <input
                  type="number"
                  value={settingsDraft.giftWrapFee}
                  onChange={(e) =>
                    setSettingsDraft({
                      ...settingsDraft,
                      giftWrapFee: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm tabular-nums focus:border-[#8B3152] focus:outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-sm font-medium text-[#2A2225] cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={settingsDraft.codEnabled}
                onChange={(e) =>
                  setSettingsDraft({ ...settingsDraft, codEnabled: e.target.checked })
                }
                className="h-4 w-4 accent-[#8B3152]"
              />
              Enable Cash on Delivery (COD) at Checkout
            </label>

            {/* Automatic Admin WhatsApp Order Alerts */}
            <div className="border-t border-[#F2EAE1] pt-4 space-y-3">
              <div>
                <h3 className="font-display text-xl font-semibold text-[#2A2225]">
                  New Order WhatsApp Notifications
                </h3>
                <p className="text-xs text-[#6E6266] mt-0.5">
                  Receive instant WhatsApp alerts for every new order &amp; custom enquiry without
                  opening the admin website.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                  Alert Delivery Method
                </label>
                <select
                  value={settingsDraft.whatsappAlertMode || 'manual'}
                  onChange={(e) =>
                    setSettingsDraft({
                      ...settingsDraft,
                      whatsappAlertMode: e.target.value as WhatsappAlertMode,
                    })
                  }
                  className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm focus:border-[#8B3152] focus:outline-none"
                >
                  <option value="manual">Customer Sends Order Summary on Checkout (No API needed)</option>
                  <option value="callmebot">Automatic via CallMeBot WhatsApp (Free)</option>
                  <option value="cloud-api">Automatic via Meta WhatsApp Cloud API (Official)</option>
                  <option value="webhook">Automatic via Webhook URL (Make / Zapier / n8n)</option>
                </select>
              </div>

              {settingsDraft.whatsappAlertMode === 'callmebot' && (
                <div className="rounded-xl bg-[#FBF7F3] border border-[#E6DDD7] p-3.5 space-y-2">
                  <label className="block text-xs font-semibold text-[#2A2225]">
                    CallMeBot API Key
                  </label>
                  <input
                    value={settingsDraft.callmebotApiKey || ''}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, callmebotApiKey: e.target.value })
                    }
                    placeholder="Enter CallMeBot API key"
                    className="w-full rounded-xl border border-[#E6DDD7] bg-white px-3 py-2 text-xs font-mono focus:border-[#8B3152] focus:outline-none"
                  />
                  <p className="text-[11px] text-[#6E6266]">
                    Alerts go directly to +{settingsDraft.whatsappNumber} on every checkout.
                  </p>
                </div>
              )}

              {settingsDraft.whatsappAlertMode === 'cloud-api' && (
                <div className="rounded-xl bg-[#FBF7F3] border border-[#E6DDD7] p-3.5 space-y-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#2A2225] mb-1">
                      WhatsApp Cloud Phone Number ID
                    </label>
                    <input
                      value={settingsDraft.whatsappCloudPhoneId || ''}
                      onChange={(e) =>
                        setSettingsDraft({ ...settingsDraft, whatsappCloudPhoneId: e.target.value })
                      }
                      placeholder="e.g. 123456789012345"
                      className="w-full rounded-xl border border-[#E6DDD7] bg-white px-3 py-2 text-xs font-mono focus:border-[#8B3152] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#2A2225] mb-1">
                      Permanent Access Token
                    </label>
                    <input
                      type="password"
                      value={settingsDraft.whatsappCloudToken || ''}
                      onChange={(e) =>
                        setSettingsDraft({ ...settingsDraft, whatsappCloudToken: e.target.value })
                      }
                      placeholder="EAAG..."
                      className="w-full rounded-xl border border-[#E6DDD7] bg-white px-3 py-2 text-xs font-mono focus:border-[#8B3152] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {settingsDraft.whatsappAlertMode === 'webhook' && (
                <div className="rounded-xl bg-[#FBF7F3] border border-[#E6DDD7] p-3.5 space-y-2">
                  <label className="block text-xs font-semibold text-[#2A2225]">
                    Order Alert Webhook URL
                  </label>
                  <input
                    type="url"
                    value={settingsDraft.orderWebhookUrl || ''}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, orderWebhookUrl: e.target.value })
                    }
                    placeholder="https://hook.eu2.make.com/..."
                    className="w-full rounded-xl border border-[#E6DDD7] bg-white px-3 py-2 text-xs font-mono focus:border-[#8B3152] focus:outline-none"
                  />
                </div>
              )}

              {settingsDraft.whatsappAlertMode && settingsDraft.whatsappAlertMode !== 'manual' && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleTestWhatsAppAlert}
                    disabled={testingAlert}
                    className="inline-flex min-h-[38px] items-center gap-2 rounded-xl border border-[#51664A]/40 bg-[#E4EBE2] px-4 py-1.5 text-xs font-semibold text-[#3C4F36] hover:bg-[#D5E1D2] disabled:opacity-50"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {testingAlert ? 'Verifying Alert...' : 'Verify WhatsApp Alert'}
                  </button>
                  {alertTestResult && (
                    <p
                      className={`text-xs font-medium ${
                        alertTestResult.status === 'Sent' ? 'text-[#51664A]' : 'text-[#8B3152]'
                      }`}
                    >
                      {alertTestResult.status}: {alertTestResult.detail}
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full min-h-[44px] rounded-xl bg-[#8B3152] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#65213B] disabled:opacity-50"
            >
              {savingSettings ? 'Saving...' : 'Save Studio Settings'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
