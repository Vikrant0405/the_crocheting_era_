import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Heart,
  Instagram,
  Mail,
  Menu,
  MessageCircle,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import type {
  CartItem,
  ColorOption,
  Order,
  Product,
  ProductCategory,
  Review,
  StudioSettings,
} from './types';
import { CATEGORY_SUMMARIES, INITIAL_PRODUCTS, INITIAL_REVIEWS, INITIAL_STORE, PRODUCT_CATEGORIES } from './data/seedData';
import { CrochetArtwork } from './components/CrochetArtwork';
import { ProductCard } from './components/ProductCard';
import { ProductDetailView } from './components/ProductDetailView';
import { CustomOrderView } from './components/CustomOrderView';
import { AboutView } from './components/AboutView';
import { CartDrawer } from './components/CartDrawer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { AdminDashboard } from './components/AdminDashboard';
import { PoliciesAndSupportView, type SupportTab } from './components/PoliciesAndSupportView';
import { buildWhatsAppUrl, formatINR } from './utils/studio';

type ViewMode = 'home' | 'shop' | 'product' | 'custom' | 'about' | 'admin' | 'support';

const CART_STORAGE_KEY = 'ww_cart_v1';
const WISHLIST_STORAGE_KEY = 'ww_wishlist_v1';
const ADMIN_TOKEN_KEY = 'ww_admin_token_v1';

function isAdminLocation(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.pathname.replace(/\/+$/, '') === '/admin' ||
    window.location.hash === '#/admin' ||
    new URLSearchParams(window.location.search).has('admin')
  );
}

export default function App() {
  const [view, setView] = useState<ViewMode>(() => (isAdminLocation() ? 'admin' : 'home'));
  const [supportTab, setSupportTab] = useState<SupportTab>('track');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [settings, setSettings] = useState<StudioSettings>(INITIAL_STORE.settings);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under700' | '700to1400' | 'above1400'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [wishlistOnly, setWishlistOnly] = useState(false);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });

  const [adminToken, setAdminToken] = useState<string | null>(null);

  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('');

  const loadStore = async () => {
    try {
      const res = await fetch('/api/store');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products)) setProducts(data.products);
        if (Array.isArray(data.reviews)) setReviews(data.reviews);
        if (data.settings) setSettings(data.settings);
      }
    } catch {
      // Fall back to initial seed data if offline
    }
  };

  useEffect(() => {
    loadStore();
  }, []);

  useEffect(() => {
    const syncRoute = () => {
      if (isAdminLocation()) {
        setView('admin');
      } else {
        setView((curr) => (curr === 'admin' ? 'home' : curr));
      }
    };
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage quota errors
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [wishlistIds]);

  useEffect(() => {
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleAdminTokenChange = (token: string | null) => {
    setAdminToken(token);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2600);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigate = (nextView: ViewMode, category?: ProductCategory | 'All', sTab?: SupportTab) => {
    if (nextView !== 'admin' && isAdminLocation()) {
      window.history.pushState({}, '', '/');
    }
    setView(nextView);
    if (category !== undefined) setSelectedCategory(category);
    if (sTab) setSupportTab(sTab);
    setMobileMenuOpen(false);
    scrollToTop();
  };

  const openProductDetail = (product: Product) => {
    setSelectedProductId(product.id);
    setView('product');
    scrollToTop();
  };

  const toggleWishlist = (id: string) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      showToast(exists ? 'Removed from wishlist' : 'Saved to wishlist');
      return next;
    });
  };

  const addToCart = (
    product: Product,
    color: ColorOption,
    quantity: number,
    customNote?: string
  ) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (item) =>
          item.productId === product.id &&
          item.selectedColor.name === color.name &&
          (item.customNote || '') === (customNote || '')
      );
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        return next;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          motif: product.motif,
          customImageUrl: product.customImageUrl,
          selectedColor: color,
          quantity,
          customNote: customNote?.trim() || undefined,
        },
      ];
    });
    showToast(`${product.name} added to bag`);
  };

  const buyNow = (
    product: Product,
    color: ColorOption,
    quantity: number,
    customNote?: string
  ) => {
    addToCart(product, color, quantity, customNote);
    setCheckoutMode(true);
    setCartOpen(true);
  };

  const updateCartQty = (index: number, delta: number) => {
    setCart((prev) => {
      const next = [...prev];
      const updated = next[index].quantity + delta;
      if (updated <= 0) {
        next.splice(index, 1);
      } else {
        next[index] = { ...next[index], quantity: updated };
      }
      return next;
    });
  };

  const removeCartItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOrderCreated = (_order: Order) => {
    loadStore();
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterStatus('');
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newsletterEmail }),
    });
    const data = await res.json();
    if (res.ok) {
      setNewsletterStatus(data.message);
      setNewsletterEmail('');
    } else {
      setNewsletterStatus(data.error || 'Please enter a valid email.');
    }
  };

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (selectedCategory !== 'All') {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (wishlistOnly) {
      list = list.filter((p) => wishlistIds.includes(p.id));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    if (priceFilter === 'under700') {
      list = list.filter((p) => p.price < 700);
    } else if (priceFilter === '700to1400') {
      list = list.filter((p) => p.price >= 700 && p.price <= 1400);
    } else if (priceFilter === 'above1400') {
      list = list.filter((p) => p.price > 1400);
    }

    if (sortBy === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
    else list.sort((a, b) => Number(b.featured) - Number(a.featured));

    return list;
  }, [products, selectedCategory, wishlistOnly, wishlistIds, searchQuery, priceFilter, sortBy]);

  const featuredProducts = useMemo(
    () => products.filter((p) => p.featured).slice(0, 6),
    [products]
  );

  const bestSellers = useMemo(
    () => products.filter((p) => p.bestSeller).slice(0, 3),
    [products]
  );

  const activeProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const bagCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-[#FBF7F3] text-[#2A2225]">
        <AdminDashboard
          token={adminToken}
          onTokenChange={handleAdminTokenChange}
          onStoreSync={loadStore}
          onExitAdmin={() => {
            handleAdminTokenChange(null);
            navigate('home');
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF7F3] text-[#2A2225]">
      {/* Top Navigation Bar — 1 row, 3 distinct zones */}
      <header className="sticky top-0 z-30 border-b border-[#E6DDD7] bg-[#FBF7F3]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => navigate('home')}
            className="text-left focus-visible:outline-none whitespace-nowrap shrink-0"
          >
            <span className="font-display text-2xl sm:text-[26px] font-semibold tracking-tight text-[#2A2225]">
              The Crocheting Era
            </span>
          </button>

          {/* Zone 2: 4 Primary Single-Line Storefront Nav Links */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {(
              [
                { id: 'home', label: 'Home' },
                { id: 'shop', label: 'Shop' },
                { id: 'custom', label: 'Custom Order' },
                { id: 'about', label: 'About' },
              ] as const
            ).map((item) => {
              const active =
                view === item.id || (item.id === 'shop' && view === 'product');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    item.id === 'shop'
                      ? navigate('shop', 'All')
                      : navigate(item.id)
                  }
                  className={`text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'text-[#8B3152] font-semibold'
                      : 'text-[#574D50] hover:text-[#8B3152]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Bag CTA + Mobile Toggle */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setCheckoutMode(false);
                setCartOpen(true);
              }}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#8B3152] px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-[#65213B] whitespace-nowrap shrink-0 tabular-nums"
            >
              <ShoppingBag className="h-4 w-4" />
              Bag ({bagCount})
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="flex md:hidden h-10 w-10 items-center justify-center rounded-xl border border-[#E6DDD7] bg-white text-[#2A2225]"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E6DDD7] bg-white px-4 py-4 space-y-2">
            {(
              [
                { id: 'home', label: 'Home' },
                { id: 'shop', label: 'Shop All Crochet' },
                { id: 'custom', label: 'Create Your Own Crochet' },
                { id: 'about', label: 'About Our Studio' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  item.id === 'shop' ? navigate('shop', 'All') : navigate(item.id)
                }
                className="block w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-[#2A2225] hover:bg-[#F4DCE2]/50"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => navigate('support', undefined, 'track')}
              className="block w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-[#8B3152] hover:bg-[#F4DCE2]/50"
            >
              Track Order
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {view === 'home' && (
          <div>
            {/* 1. Split Boutique Hero */}
            <section className="mx-auto max-w-6xl px-4 pt-10 pb-14 sm:px-6 lg:pt-16 lg:pb-20">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-6 space-y-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#8B3152]">
                    The Crocheting Era · Handmade Crochet Studio
                  </p>
                  <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-semibold text-[#2A2225] leading-[1.08] [text-wrap:balance]">
                    Every Stitch Tells a Story.
                  </h1>
                  <p className="max-w-xl text-base sm:text-lg leading-relaxed text-[#574D50]">
                    Heirloom crochet flower bouquets, soft amigurumi companions, woven totes, and
                    keepsake gifts—looped slowly by hand in pastel cotton yarns for life’s warmest
                    moments.
                  </p>

                  <div className="flex flex-wrap items-center gap-3.5 pt-2">
                    <button
                      type="button"
                      onClick={() => navigate('shop', 'All')}
                      className="inline-flex min-h-[50px] items-center gap-2 rounded-xl bg-[#8B3152] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#65213B] whitespace-nowrap shrink-0"
                    >
                      Shop Now
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('custom')}
                      className="inline-flex min-h-[50px] items-center gap-2 rounded-xl border border-[#8B3152] bg-white px-6 py-3 text-sm font-semibold text-[#8B3152] transition-colors hover:bg-[#F4DCE2]/45 whitespace-nowrap shrink-0"
                    >
                      <Sparkles className="h-4 w-4" />
                      Create Custom Order
                    </button>
                  </div>

                  <p className="text-xs text-[#6E6266]">
                    Handcrafted in India · Complimentary delivery above{' '}
                    <span className="font-semibold tabular-nums text-[#2A2225]">
                      {formatINR(settings.freeShippingThreshold)}
                    </span>{' '}
                    · Direct WhatsApp customization
                  </p>
                </div>

                {/* Hero Showcase Composition */}
                <div className="lg:col-span-6">
                  <div className="grid grid-cols-12 gap-4 items-stretch">
                    <div className="col-span-8 rounded-2xl border border-[#E6DDD7] bg-white p-4 shadow-sm flex flex-col justify-between">
                      <button
                        type="button"
                        onClick={() => products[0] && openProductDetail(products[0])}
                        className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#F5EFE8] text-left"
                      >
                        <CrochetArtwork
                          motif="bouquet"
                          primaryColor="#E3A1B4"
                          accentColor="#8B3152"
                          alt="Pastel Tulip and Baby's Breath Crochet Bouquet"
                          className="h-full w-full"
                        />
                      </button>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="font-display text-lg font-semibold text-[#2A2225]">
                            Pastel Tulip Bouquet
                          </p>
                          <p className="text-xs text-[#6E6266]">Zero wilting keepsake flowers</p>
                        </div>
                        <span className="text-sm font-semibold text-[#8B3152] tabular-nums">
                          {formatINR(1299)}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-4 flex flex-col gap-4">
                      <div className="flex-1 rounded-2xl border border-[#E6DDD7] bg-[#F4DCE2]/55 p-3 flex flex-col justify-between">
                        <div className="aspect-square w-full overflow-hidden rounded-xl bg-white">
                          <img
                            src="/assets/images/7-handmade-crochet-detail.jpg"
                            alt="Handmade crochet peacock motif keychain"
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover object-top scale-[1.35]"
                          />
                        </div>
                        <p className="mt-2 text-xs font-semibold text-[#2A2225]">Bag Charms</p>
                      </div>

                      <div className="flex-1 rounded-2xl border border-[#E6DDD7] bg-[#E4EBE2]/70 p-3 flex flex-col justify-between">
                        <div className="aspect-square w-full overflow-hidden rounded-xl bg-white">
                          <img
                            src="/assets/images/2-crochet-flower-ring.jpg"
                            alt="Handmade crochet ruffled scrunchie"
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover object-bottom scale-[1.35]"
                          />
                        </div>
                        <p className="mt-2 text-xs font-semibold text-[#2A2225]">Hair Scrunchies</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. 7 Popular Product Categories */}
            <section className="border-y border-[#E6DDD7] bg-white py-14">
              <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#8B3152]">
                      Curated Collections
                    </p>
                    <h2 className="mt-1 font-display text-3xl sm:text-4xl font-semibold text-[#2A2225]">
                      Shop by Category
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('shop', 'All')}
                    className="text-sm font-semibold text-[#8B3152] hover:underline"
                  >
                    View all {products.length} creations →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {PRODUCT_CATEGORIES.map((cat) => {
                    const meta = CATEGORY_SUMMARIES[cat];
                    const count = products.filter((p) => p.category === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => navigate('shop', cat)}
                        style={{ backgroundColor: meta.bg }}
                        className="group rounded-2xl border border-[#E6DDD7] p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#8B3152]/40"
                      >
                        <div className="flex items-center justify-between text-xs text-[#6E6266]">
                          <span className="tabular-nums">{count} pieces</span>
                          <ArrowRight
                            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                            style={{ color: meta.accent }}
                          />
                        </div>
                        <h3 className="mt-3 font-display text-2xl font-semibold text-[#2A2225]">
                          {cat}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-[#574D50]">
                          {meta.subtitle}
                        </p>
                      </button>
                    );
                  })}

                  {/* Direct Custom Order Tile to balance 8-slot 4-column grid */}
                  <button
                    type="button"
                    onClick={() => navigate('custom')}
                    className="group rounded-2xl border border-[#8B3152]/30 bg-[#F4DCE2]/75 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#8B3152]"
                  >
                    <div className="flex items-center justify-between text-xs text-[#65213B]">
                      <span>Bespoke</span>
                      <Sparkles className="h-3.5 w-3.5 text-[#8B3152]" />
                    </div>
                    <h3 className="mt-3 font-display text-2xl font-semibold text-[#2A2225]">
                      Custom Crochet
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#65213B]">
                      Pick your own palette, size &amp; inspiration photo
                    </p>
                  </button>
                </div>
              </div>
            </section>

            {/* 3. Featured Products */}
            <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
              <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#8B3152]">
                    Handmade Highlights
                  </p>
                  <h2 className="mt-1 font-display text-3xl sm:text-4xl font-semibold text-[#2A2225]">
                    Featured Studio Creations
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('shop', 'All')}
                  className="text-sm font-semibold text-[#8B3152] hover:underline"
                >
                  Browse Full Shop →
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isWishlisted={wishlistIds.includes(product.id)}
                    onToggleWishlist={toggleWishlist}
                    onSelectProduct={openProductDetail}
                    onQuickAdd={(p, c) => addToCart(p, c, 1)}
                  />
                ))}
              </div>
            </section>

            {/* 4. Best-Selling Creations */}
            <section className="border-y border-[#E6DDD7] bg-[#F2EAE1]/55 py-14">
              <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#8B3152]">
                    Most Loved Keepsakes
                  </p>
                  <h2 className="mt-1 font-display text-3xl sm:text-4xl font-semibold text-[#2A2225]">
                    Best-Selling Crochet Gifts
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {bestSellers.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isWishlisted={wishlistIds.includes(product.id)}
                      onToggleWishlist={toggleWishlist}
                      onSelectProduct={openProductDetail}
                      onQuickAdd={(p, c) => addToCart(p, c, 1)}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* 5. About Handmade & Why Choose Handmade */}
            <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-6 rounded-2xl border border-[#E6DDD7] bg-white p-8 space-y-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#8B3152]">
                    Women-Owned Handmade Studio
                  </p>
                  <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#2A2225]">
                    Why Choose Handmade Crochet?
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-[#574D50]">
                    Machines can knit sweaters, yet crochet remains an exclusively human craft—every
                    petal, teddy ear, and blanket shell is formed stitch by stitch with patience and
                    care.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-sm">
                    <div className="rounded-xl bg-[#FBF7F3] p-4 border border-[#EFE6DD]">
                      <p className="font-semibold text-[#2A2225]">Zero-Wilt Forever Blooms</p>
                      <p className="mt-1 text-xs text-[#6E6266]">
                        Soft cotton flowers that brighten desks and homes for years.
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#FBF7F3] p-4 border border-[#EFE6DD]">
                      <p className="font-semibold text-[#2A2225]">Baby-Safe Soft Yarns</p>
                      <p className="mt-1 text-xs text-[#6E6266]">
                        Gentle combed cotton &amp; embroidered features with no harsh plastics.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('about')}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#8B3152] px-5 py-2 text-sm font-semibold text-[#8B3152] hover:bg-[#F4DCE2]/45"
                  >
                    Read Our Founder Story
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Bespoke Banner */}
                <div className="lg:col-span-6 rounded-2xl border border-[#E6DDD7] bg-[#EFE9F6]/65 p-8 space-y-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#6C5A8A]">
                    Create Your Own Crochet
                  </p>
                  <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#2A2225]">
                    Want a Custom Colour, Bouquet or Bulk Return Gift?
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-[#4E4347]">
                    Choose your product type, pastel yarn palette, target budget, and upload an
                    inspiration photo. Your custom brief opens straight into WhatsApp so we can
                    match shades personally.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => navigate('custom')}
                      className="min-h-[46px] rounded-xl bg-[#8B3152] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#65213B]"
                    >
                      Open Custom Builder
                    </button>
                    <a
                      href={buildWhatsAppUrl(
                        settings.whatsappNumber,
                        'Hello The Crocheting Era! I would like to discuss a custom handmade crochet gift.'
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-[#51664A]/35 bg-[#E4EBE2] px-5 py-2.5 text-sm font-semibold text-[#3C4F36] hover:bg-[#D5E1D2]"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Chat on WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. Customer Testimonials */}
            <section className="border-y border-[#E6DDD7] bg-white py-14">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#8B3152]">
                    Kind Words Across India
                  </p>
                  <h2 className="mt-1 font-display text-3xl sm:text-4xl font-semibold text-[#2A2225]">
                    Loved by Gift Givers &amp; Collectors
                  </h2>
                </div>

                {reviews.length === 0 ? (
                  <div className="rounded-2xl border border-[#E6DDD7] bg-[#FBF7F3] p-8 text-center space-y-3">
                    <p className="font-display text-2xl font-semibold text-[#2A2225]">
                      Crafted to Order for Life’s Warmest Occasions
                    </p>
                    <p className="mx-auto max-w-xl text-sm text-[#6E6266]">
                      Verified customer stories appear here automatically as orders are delivered
                      and reviewed on product pages.
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => navigate('shop', 'All')}
                        className="min-h-[42px] rounded-xl border border-[#8B3152] bg-white px-5 py-2 text-xs font-semibold text-[#8B3152] hover:bg-[#F4DCE2]/45"
                      >
                        Explore Handmade Collection
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                    {reviews.slice(0, 4).map((rev) => (
                      <article
                        key={rev.id}
                        className="flex flex-col justify-between rounded-2xl border border-[#E6DDD7] bg-[#FBF7F3] p-5 space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-1 text-[#D8A24A]">
                            {Array.from({ length: rev.rating }).map((_, idx) => (
                              <Star key={idx} className="h-3.5 w-3.5 fill-current" />
                            ))}
                          </div>
                          <p className="text-sm leading-relaxed text-[#4E4347]">“{rev.comment}”</p>
                        </div>
                        <div className="border-t border-[#EAE0D7] pt-3">
                          <p className="text-xs font-semibold text-[#2A2225]">
                            {rev.author} <span aria-hidden="true">·</span> {rev.location}
                          </p>
                          {rev.productName && (
                            <p className="mt-0.5 text-[11px] text-[#6E6266] truncate">
                              {rev.productName}
                            </p>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* 7. Studio & Instagram Gallery + Newsletter */}
            <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 space-y-12">
              <div className="space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#8B3152]">
                      Instagram Creations · {settings.instagramHandle}
                    </p>
                    <h2 className="mt-1 font-display text-3xl sm:text-4xl font-semibold text-[#2A2225]">
                      Fresh from {settings.instagramHandle}
                    </h2>
                  </div>
                  <a
                    href={`https://www.instagram.com/${settings.instagramHandle.replace('@', '')}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#8B3152] hover:underline"
                  >
                    <Instagram className="h-4 w-4" />
                    Follow {settings.instagramHandle}
                  </a>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      const target = products.find((p) => p.id === 'ww-acc-01');
                      if (target) openProductDetail(target);
                    }}
                    className="rounded-2xl border border-[#E6DDD7] bg-white p-2.5 text-left transition-transform hover:-translate-y-0.5"
                  >
                    <div className="aspect-square overflow-hidden rounded-xl bg-[#F5EFE8]">
                      <img
                        src="/assets/images/7-handmade-crochet-detail.jpg"
                        alt="Handmade peacock crochet charm from @the_crocheting_era"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover object-top scale-[1.45]"
                      />
                    </div>
                    <p className="mt-2 text-xs font-medium text-[#574D50]">Peacock Charm Detail</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = products.find((p) => p.id === 'ww-acc-02');
                      if (target) openProductDetail(target);
                    }}
                    className="rounded-2xl border border-[#E6DDD7] bg-white p-2.5 text-left transition-transform hover:-translate-y-0.5"
                  >
                    <div className="aspect-square overflow-hidden rounded-xl bg-[#F5EFE8]">
                      <img
                        src="/assets/images/2-crochet-flower-ring.jpg"
                        alt="Ruffled crimson and cream crochet scrunchie from @the_crocheting_era"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover object-bottom scale-[1.45]"
                      />
                    </div>
                    <p className="mt-2 text-xs font-medium text-[#574D50]">Ruffled Hair Scrunchie</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = products.find((p) => p.id === 'ww-acc-03') || products[0];
                      if (target) openProductDetail(target);
                    }}
                    className="rounded-2xl border border-[#E6DDD7] bg-white p-2.5 text-left transition-transform hover:-translate-y-0.5"
                  >
                    <div className="aspect-square overflow-hidden rounded-xl bg-[#F5EFE8]">
                      <img
                        src="/assets/images/1-handmade-crochet-flowers-from-the-crocheting-era.jpg"
                        alt="Handmade strawberry, rose bouquet and sunflower crochet keychains from @the_crocheting_era"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover object-[58%_28%] scale-[1.55]"
                      />
                    </div>
                    <p className="mt-2 text-xs font-medium text-[#574D50]">Bouquet &amp; Berry Keychains</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = products.find((p) => p.id === 'ww-flw-02');
                      if (target) openProductDetail(target);
                    }}
                    className="rounded-2xl border border-[#E6DDD7] bg-white p-2.5 text-left transition-transform hover:-translate-y-0.5"
                  >
                    <div className="aspect-square overflow-hidden rounded-xl bg-[#F5EFE8]">
                      <img
                        src="/assets/images/6-crochet-tools-and-yarn.jpg"
                        alt="Mini potted sunflower crochet desk bloom from @the_crocheting_era"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover object-[12%_88%] scale-[2.3]"
                      />
                    </div>
                    <p className="mt-2 text-xs font-medium text-[#574D50]">Potted Sunflower Desk Bloom</p>
                  </button>
                </div>
              </div>

              {/* Newsletter */}
              <div className="rounded-2xl border border-[#E6DDD7] bg-[#F4DCE2]/55 p-8 sm:p-10">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
                  <div className="lg:col-span-6 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#8B3152]">
                      Studio Letter
                    </p>
                    <h2 className="font-display text-3xl font-semibold text-[#2A2225]">
                      Get Seasonal Drops &amp; Festive Gift Coupons
                    </h2>
                    <p className="text-sm text-[#574D50]">
                      Use code <span className="font-mono font-semibold text-[#8B3152]">WELCOME10</span>{' '}
                      at checkout for 10% off your first bouquet or gift box.
                    </p>
                  </div>

                  <form
                    onSubmit={handleNewsletterSubmit}
                    className="lg:col-span-6 flex flex-col sm:flex-row gap-3"
                  >
                    <input
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="flex-1 rounded-xl border border-[#E6DDD7] bg-white px-4 py-3 text-sm focus:border-[#8B3152] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="min-h-[46px] rounded-xl bg-[#8B3152] px-6 py-3 text-sm font-semibold text-white hover:bg-[#65213B] whitespace-nowrap shrink-0"
                    >
                      Join Studio List
                    </button>
                  </form>
                </div>
                {newsletterStatus && (
                  <p className="mt-3 text-xs font-semibold text-[#51664A]">{newsletterStatus}</p>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Shop & Categories View */}
        {view === 'shop' && (
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-12 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#8B3152]">
                  Handmade Crochet Catalogue
                </p>
                <h1 className="mt-1 font-display text-4xl font-semibold text-[#2A2225]">
                  {selectedCategory === 'All' ? 'All Handmade Creations' : selectedCategory}
                </h1>
                {selectedCategory !== 'All' && (
                  <p className="mt-1 text-sm text-[#6E6266]">
                    {CATEGORY_SUMMARIES[selectedCategory]?.subtitle}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setWishlistOnly((prev) => !prev)}
                className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  wishlistOnly
                    ? 'border-[#8B3152] bg-[#F4DCE2] text-[#65213B]'
                    : 'border-[#E6DDD7] bg-white text-[#2A2225] hover:border-[#8B3152]'
                }`}
              >
                <Heart className={`h-4 w-4 ${wishlistOnly ? 'fill-[#8B3152] text-[#8B3152]' : ''}`} />
                Saved Wishlist ({wishlistIds.length})
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {(['All', ...PRODUCT_CATEGORIES] as const).map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`min-h-[38px] rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'border-[#8B3152] bg-[#8B3152] text-white'
                        : 'border-[#E6DDD7] bg-white text-[#574D50] hover:border-[#8B3152]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Search, Price Filter & Sort Bar */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 rounded-2xl border border-[#E6DDD7] bg-white p-4">
              <div className="sm:col-span-6 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8185]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search roses, teddy bears, totes, baby blankets..."
                  className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] pl-10 pr-4 py-2.5 text-sm focus:border-[#8B3152] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  aria-label="Filter by price"
                  value={priceFilter}
                  onChange={(e) =>
                    setPriceFilter(
                      e.target.value as 'all' | 'under700' | '700to1400' | 'above1400'
                    )
                  }
                  className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2.5 text-sm focus:border-[#8B3152] focus:outline-none"
                >
                  <option value="all">All Prices (₹)</option>
                  <option value="under700">Under ₹700</option>
                  <option value="700to1400">₹700 – ₹1,400</option>
                  <option value="above1400">Above ₹1,400</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <select
                  aria-label="Sort products"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')
                  }
                  className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2.5 text-sm focus:border-[#8B3152] focus:outline-none"
                >
                  <option value="featured">Featured First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-[#E6DDD7] bg-white p-12 text-center space-y-3">
                <p className="font-display text-2xl font-semibold text-[#2A2225]">
                  No crochet creations match these filters
                </p>
                <p className="text-sm text-[#6E6266]">
                  Try clearing your search or let us custom-craft exactly what you have in mind.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('All');
                      setSearchQuery('');
                      setPriceFilter('all');
                      setWishlistOnly(false);
                    }}
                    className="rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-5 py-2 text-xs font-semibold text-[#2A2225]"
                  >
                    Reset Filters
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('custom')}
                    className="rounded-xl bg-[#8B3152] px-5 py-2 text-xs font-semibold text-white"
                  >
                    Request Custom Design
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isWishlisted={wishlistIds.includes(product.id)}
                    onToggleWishlist={toggleWishlist}
                    onSelectProduct={openProductDetail}
                    onQuickAdd={(p, c) => addToCart(p, c, 1)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Product Detail View */}
        {view === 'product' && activeProduct && (
          <ProductDetailView
            key={activeProduct.id}
            product={activeProduct}
            allProducts={products}
            reviews={reviews}
            whatsappNumber={settings.whatsappNumber}
            wishlistIds={wishlistIds}
            onToggleWishlist={toggleWishlist}
            onBack={() => navigate('shop')}
            onSelectProduct={openProductDetail}
            onAddToCart={addToCart}
            onBuyNow={buyNow}
            onReviewSubmitted={(rev) => {
              setReviews((prev) => [rev, ...prev]);
              loadStore();
            }}
          />
        )}

        {/* Custom Order View */}
        {view === 'custom' && <CustomOrderView whatsappNumber={settings.whatsappNumber} />}

        {/* About View */}
        {view === 'about' && (
          <AboutView
            whatsappNumber={settings.whatsappNumber}
            onNavigateShop={() => navigate('shop', 'All')}
            onNavigateCustom={() => navigate('custom')}
          />
        )}

        {/* Policies, Track Order, FAQ, Contact */}
        {view === 'support' && (
          <PoliciesAndSupportView
            initialTab={supportTab}
            settings={settings}
            onOpenCustomOrder={() => navigate('custom')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E6DDD7] bg-white pt-14 pb-10 mt-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 pb-10 border-b border-[#F2EAE1]">
            <div className="md:col-span-4 space-y-3">
              <p className="font-display text-3xl font-semibold text-[#2A2225]">
                The Crocheting Era
              </p>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8B3152]">
                Every Stitch Tells a Story.
              </p>
              <p className="text-sm leading-relaxed text-[#6E6266]">
                A women-owned handmade crochet boutique crafting keepsake flowers, soft toys,
                accessories, and personalized gifts in India.
              </p>
            </div>

            <div className="md:col-span-2 space-y-2.5 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#2A2225]">
                Collections
              </p>
              {PRODUCT_CATEGORIES.slice(0, 5).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => navigate('shop', cat)}
                  className="block text-left text-xs text-[#6E6266] hover:text-[#8B3152]"
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="md:col-span-3 space-y-2.5 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#2A2225]">
                Customer Care
              </p>
              {(
                [
                  { id: 'track', label: 'Track Your Order' },
                  { id: 'faq', label: 'Frequently Asked Questions' },
                  { id: 'contact', label: 'Contact & Bulk Enquiries' },
                  { id: 'shipping', label: 'Shipping & Return Policy' },
                  { id: 'privacy', label: 'Privacy Policy' },
                  { id: 'terms', label: 'Terms & Conditions' },
                ] as const
              ).map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => navigate('support', undefined, link.id)}
                  className="block text-left text-xs text-[#6E6266] hover:text-[#8B3152]"
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="md:col-span-3 space-y-3 text-xs text-[#6E6266]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#2A2225]">
                Studio Contact
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-[#8B3152]" />
                {settings.studioEmail}
              </p>
              <p className="flex items-center gap-2">
                <MessageCircle className="h-3.5 w-3.5 text-[#8B3152]" />+{settings.whatsappNumber}
              </p>
              <p className="flex items-center gap-2">
                <Instagram className="h-3.5 w-3.5 text-[#8B3152]" />
                {settings.instagramHandle}
              </p>
              <p>{settings.studioCity}</p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8E8185]">
            <p>© 2026 The Crocheting Era – Handmade Crochet Studio. Crafted with love in India.</p>
            <p>UPI · Google Pay · PhonePe · Paytm · COD Available</p>
          </div>
        </div>
      </footer>

      {/* Cart & Checkout Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        startAtCheckout={checkoutMode}
        onClose={() => setCartOpen(false)}
        items={cart}
        settings={settings}
        onUpdateQuantity={updateCartQty}
        onRemoveItem={removeCartItem}
        onClearCart={() => setCart([])}
        onOrderCreated={handleOrderCreated}
      />

      {/* Floating WhatsApp Quick Help */}
      <FloatingWhatsApp
        whatsappNumber={settings.whatsappNumber}
        onOpenCustomOrder={() => navigate('custom')}
        onOpenTrackOrder={() => navigate('support', undefined, 'track')}
      />

      {/* Subtle Toast Confirmation */}
      {toastMsg && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 inline-flex items-center gap-2 rounded-xl bg-[#2A2225] px-4 py-2.5 text-xs font-semibold text-white shadow-lg"
        >
          <Check className="h-3.5 w-3.5 text-[#E3A1B4]" />
          {toastMsg}
        </div>
      )}
    </div>
  );
}
