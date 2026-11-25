import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { INITIAL_STORE } from './src/data/seedData.ts';
import type { StoreData, Product, Order, Enquiry, Review, StudioSettings } from './src/types.ts';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');
const ENV_ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'admin').trim();
const ENV_ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSCODE || '').trim();
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const adminSessions = new Map<string, number>();

function hashPasswordScrypt(password: string, salt?: string): { hash: string; salt: string } {
  const usedSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, usedSalt, 64).toString('hex');
  return { hash: derived, salt: usedSalt };
}

function verifyScryptPassword(password: string, storedHash: string, salt: string): boolean {
  const { hash } = hashPasswordScrypt(password, salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function isSafeHttpUrl(raw?: string): boolean {
  if (!raw) return false;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function isSafeWebhookUrl(raw?: string): boolean {
  if (!raw) return false;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const host = parsed.hostname.toLowerCase();
    if (process.env.NODE_ENV === 'production') {
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '::1' ||
        host === '169.254.169.254' ||
        host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(host)
      ) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

function ensureStore(): StoreData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(INITIAL_STORE, null, 2), 'utf8');
    return structuredClone(INITIAL_STORE);
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
      products: parsed.products ?? INITIAL_STORE.products,
      reviews: parsed.reviews ?? INITIAL_STORE.reviews,
      orders: parsed.orders ?? INITIAL_STORE.orders,
      enquiries: parsed.enquiries ?? INITIAL_STORE.enquiries,
      newsletter: parsed.newsletter ?? INITIAL_STORE.newsletter,
      settings: { ...INITIAL_STORE.settings, ...(parsed.settings ?? {}) },
      adminAuth: parsed.adminAuth,
    };
  } catch {
    fs.writeFileSync(STORE_PATH, JSON.stringify(INITIAL_STORE, null, 2), 'utf8');
    return structuredClone(INITIAL_STORE);
  }
}

function saveStore(data: StoreData): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function isAdmin(req: express.Request): boolean {
  const auth = req.headers['x-admin-token'];
  if (typeof auth !== 'string' || !auth) return false;
  const expiresAt = adminSessions.get(auth);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    adminSessions.delete(auth);
    return false;
  }
  return true;
}

function getPublicSettings(settings: StudioSettings): StudioSettings {
  return {
    whatsappNumber: settings.whatsappNumber,
    instagramHandle: settings.instagramHandle,
    studioEmail: settings.studioEmail,
    studioCity: settings.studioCity,
    codEnabled: settings.codEnabled,
    upiEnabled: settings.upiEnabled !== false,
    upiId: settings.upiId || '',
    upiPayeeName: settings.upiPayeeName || 'The Crocheting Era',
    upiQrImageUrl: settings.upiQrImageUrl || '',
    giftWrapEnabled: settings.giftWrapEnabled !== false,
    freeShippingThreshold: settings.freeShippingThreshold,
    shippingFee: settings.shippingFee ?? 79,
    giftWrapFee: settings.giftWrapFee,
    allowCustomOrders: settings.allowCustomOrders !== false,
    allowCustomerReviews: settings.allowCustomerReviews !== false,
    autoApproveReviews: settings.autoApproveReviews !== false,
    heroImageUrl: settings.heroImageUrl || '',
    heroBadgeText: settings.heroBadgeText || 'Handcrafted Crochet Studio · Maharashtra',
    aboutStudioImageUrl1: settings.aboutStudioImageUrl1 || '',
    aboutStudioImageUrl2: settings.aboutStudioImageUrl2 || '',
  };
}

function formatAdminOrderMessage(order: Order): string {
  const lines = [
    `🧶 *NEW ORDER ALERT — ${order.id}*`,
    `Customer: ${order.customerName}`,
    `Phone: ${order.phone}`,
    `Address: ${order.address}, ${order.city}, ${order.state} - ${order.pincode}`,
    `Payment: ${order.paymentMethod}${order.upiTransactionId ? ` (UTR: ${order.upiTransactionId})` : ''}`,
    '',
    'Items:',
    ...order.items.map(
      (i) =>
        `• ${i.name} (${i.selectedColor?.name || 'Default'}) × ${i.quantity} — ₹${(i.price * i.quantity).toLocaleString('en-IN')}${i.customNote ? ` [Note: ${i.customNote}]` : ''}`
    ),
    '',
    `Subtotal: ₹${order.subtotal.toLocaleString('en-IN')}`,
  ];
  if (order.giftWrap) {
    lines.push(`Gift Wrap: Yes${order.giftMessage ? ` ("${order.giftMessage}")` : ''}`);
  }
  lines.push(`Shipping: ${order.shippingFee === 0 ? 'Free' : `₹${order.shippingFee}`}`);
  lines.push(`*TOTAL: ₹${order.total.toLocaleString('en-IN')}*`);
  return lines.join('\n');
}

function formatAdminEnquiryMessage(enquiry: Enquiry): string {
  const lines = [
    `🌸 *NEW ${enquiry.type.toUpperCase()} — ${enquiry.id}*`,
    `Name: ${enquiry.customerName}`,
    `Phone: ${enquiry.phone}`,
  ];
  if (enquiry.productType) lines.push(`Product: ${enquiry.productType}`);
  if (enquiry.preferredColor) lines.push(`Palette: ${enquiry.preferredColor}`);
  if (enquiry.size) lines.push(`Scale: ${enquiry.size}`);
  if (enquiry.budget) lines.push(`Budget: ${enquiry.budget}`);
  lines.push('', `Details: ${enquiry.requirements}`);
  return lines.join('\n');
}

async function dispatchAdminWhatsAppAlert(
  text: string,
  settings: StudioSettings,
  payload?: Record<string, unknown>
): Promise<{ status: 'Sent' | 'Not Configured' | 'Failed'; detail: string }> {
  const phone = (settings.whatsappNumber || '').replace(/[^\d]/g, '');
  const mode = settings.whatsappAlertMode || 'manual';
  const callmebotKey = (settings.callmebotApiKey || process.env.CALLMEBOT_API_KEY || '').trim();
  const cloudPhoneId = (settings.whatsappCloudPhoneId || process.env.WHATSAPP_CLOUD_PHONE_ID || '').trim();
  const cloudToken = (settings.whatsappCloudToken || process.env.WHATSAPP_CLOUD_TOKEN || '').trim();
  const webhookUrl = (settings.orderWebhookUrl || process.env.ORDER_WEBHOOK_URL || '').trim();

  try {
    if ((mode === 'callmebot' || (!settings.whatsappAlertMode && callmebotKey)) && callmebotKey && phone) {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(callmebotKey)}`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!resp.ok) {
        return { status: 'Failed', detail: `CallMeBot returned HTTP ${resp.status}` };
      }
      return { status: 'Sent', detail: 'Sent via CallMeBot WhatsApp' };
    }

    if ((mode === 'cloud-api' || (!settings.whatsappAlertMode && cloudPhoneId && cloudToken)) && cloudPhoneId && cloudToken && phone) {
      const resp = await fetch(`https://graph.facebook.com/v20.0/${encodeURIComponent(cloudPhoneId)}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cloudToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: text },
        }),
        signal: AbortSignal.timeout(6000),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        return { status: 'Failed', detail: `WhatsApp Cloud API error (${resp.status}): ${errText.slice(0, 120)}` };
      }
      return { status: 'Sent', detail: 'Sent via Meta WhatsApp Cloud API' };
    }

    if ((mode === 'webhook' || (!settings.whatsappAlertMode && webhookUrl)) && isSafeWebhookUrl(webhookUrl)) {
      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'new_studio_alert',
          adminWhatsappNumber: phone,
          whatsappMessage: text,
          ...payload,
        }),
        signal: AbortSignal.timeout(6000),
      });
      if (!resp.ok) {
        return { status: 'Failed', detail: `Webhook returned HTTP ${resp.status}` };
      }
      return { status: 'Sent', detail: 'Delivered to order webhook' };
    }

    return {
      status: 'Not Configured',
      detail: 'Customer sends order summary directly to your WhatsApp on checkout.',
    };
  } catch (err) {
    return {
      status: 'Failed',
      detail: err instanceof Error ? err.message : 'Network error sending alert',
    };
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', studio: 'The Crocheting Era' });
  });

  app.get('/api/store', (_req, res) => {
    const store = ensureStore();
    res.json({
      products: store.products,
      reviews: store.reviews.filter((r) => r.approved),
      settings: getPublicSettings(store.settings),
    });
  });

  app.post('/api/orders', async (req, res) => {
    const store = ensureStore();
    const body = req.body;
    if (
      !body?.customerName ||
      !body?.phone ||
      !body?.address ||
      !body?.city ||
      !body?.pincode ||
      !Array.isArray(body?.items) ||
      body.items.length === 0
    ) {
      res.status(400).json({ error: 'Please complete delivery details and add at least one item.' });
      return;
    }

    const paymentMethod = String(body.paymentMethod || 'UPI').trim() as Order['paymentMethod'];
    if (/cash on delivery/i.test(paymentMethod) && !store.settings.codEnabled) {
      res.status(400).json({ error: 'Cash on Delivery is currently disabled.' });
      return;
    }
    if (
      /upi|google pay|phonepe|paytm/i.test(paymentMethod) &&
      store.settings.upiEnabled === false
    ) {
      res.status(400).json({ error: 'UPI payments are currently disabled.' });
      return;
    }

    let subtotal = 0;
    for (const item of body.items) {
      const product = store.products.find((p) => p.id === item.productId);
      const qty = Math.max(1, Number(item.quantity || 1));
      if (product) {
        if (product.stock <= 0) {
          res.status(400).json({ error: `Sorry, "${product.name}" is currently sold out.` });
          return;
        }
        if (product.stock < qty) {
          res.status(400).json({
            error: `Only ${product.stock} left in stock for "${product.name}".`,
          });
          return;
        }
      }
      const unitPrice = product ? product.price : Number(item.price || 0);
      subtotal += unitPrice * qty;
    }

    for (const item of body.items) {
      const product = store.products.find((p) => p.id === item.productId);
      const qty = Math.max(1, Number(item.quantity || 1));
      if (product) {
        product.stock -= qty;
      }
    }

    const giftWrap = store.settings.giftWrapEnabled !== false && Boolean(body.giftWrap);
    const giftFee = giftWrap ? store.settings.giftWrapFee : 0;
    const flatShipping = Number(store.settings.shippingFee ?? 79);
    const shippingFee = subtotal >= store.settings.freeShippingThreshold ? 0 : flatShipping;
    const total = Math.max(0, subtotal + giftFee + shippingFee);

    const maxOrderNum = store.orders.reduce((max, o) => {
      const m = o.id.match(/(\d+)$/);
      return m ? Math.max(max, Number(m[1])) : max;
    }, 1000);
    const newOrder: Order = {
      id: `WW-2026-${maxOrderNum + 1}`,
      customerName: String(body.customerName).trim(),
      phone: String(body.phone).trim(),
      email: String(body.email || '').trim(),
      address: String(body.address).trim(),
      city: String(body.city || '').trim(),
      state: String(body.state || '').trim(),
      pincode: String(body.pincode || '').trim(),
      items: body.items,
      subtotal,
      giftWrap,
      giftMessage: giftWrap && body.giftMessage ? String(body.giftMessage).trim() : undefined,
      shippingFee,
      total,
      paymentMethod,
      upiTransactionId: body.upiTransactionId ? String(body.upiTransactionId).trim().slice(0, 64) : undefined,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    const alertText = formatAdminOrderMessage(newOrder);
    const alertResult = await dispatchAdminWhatsAppAlert(alertText, store.settings, {
      order: newOrder,
    });
    newOrder.whatsappAlertStatus = alertResult.status;
    newOrder.whatsappAlertDetail = alertResult.detail;

    store.orders.unshift(newOrder);
    saveStore(store);
    res.status(201).json(newOrder);
  });

  app.get('/api/orders/track/:orderId', (req, res) => {
    const store = ensureStore();
    const orderId = req.params.orderId.trim().toUpperCase();
    const order = store.orders.find((o) => o.id.toUpperCase() === orderId);
    if (!order) {
      res.status(404).json({ error: 'Order ID not found. Please check the Order ID from your receipt.' });
      return;
    }
    res.json({
      id: order.id,
      customerName: order.customerName,
      city: order.city,
      items: order.items,
      total: order.total,
      paymentMethod: order.paymentMethod,
      status: order.status,
      courierName: order.courierName,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      giftWrap: order.giftWrap,
      createdAt: order.createdAt,
    });
  });

  app.post('/api/enquiries', async (req, res) => {
    const store = ensureStore();
    const body = req.body;
    const enqType = body.type || 'Custom Order';
    if (
      (enqType === 'Custom Order' || enqType === 'Bulk Order') &&
      store.settings.allowCustomOrders === false
    ) {
      res.status(403).json({
        error: 'Custom crochet orders are currently paused. Please check back soon or message us on WhatsApp.',
      });
      return;
    }
    if (!body?.customerName || !body?.phone || !body?.requirements) {
      res.status(400).json({ error: 'Name, phone number, and requirements are required.' });
      return;
    }
    const maxEnqNum = store.enquiries.reduce((max, e) => {
      const m = e.id.match(/(\d+)$/);
      return m ? Math.max(max, Number(m[1])) : max;
    }, 100);
    const newEnquiry: Enquiry = {
      id: `ENQ-2026-${maxEnqNum + 1}`,
      type: enqType,
      customerName: String(body.customerName).trim(),
      phone: String(body.phone).trim(),
      productType: body.productType ? String(body.productType) : undefined,
      preferredColor: body.preferredColor ? String(body.preferredColor) : undefined,
      size: body.size ? String(body.size) : undefined,
      budget: body.budget ? String(body.budget) : undefined,
      referenceImageName: body.referenceImageName ? String(body.referenceImageName) : undefined,
      requirements: String(body.requirements).trim(),
      status: 'New',
      createdAt: new Date().toISOString(),
    };
    store.enquiries.unshift(newEnquiry);
    saveStore(store);

    await dispatchAdminWhatsAppAlert(formatAdminEnquiryMessage(newEnquiry), store.settings, {
      enquiry: newEnquiry,
    });

    res.status(201).json(newEnquiry);
  });

  app.post('/api/reviews', (req, res) => {
    const store = ensureStore();
    if (store.settings.allowCustomerReviews === false) {
      res.status(403).json({ error: 'Customer review submissions are currently paused by the studio.' });
      return;
    }
    const body = req.body;
    if (!body?.author || !body?.comment) {
      res.status(400).json({ error: 'Your name and review message are required.' });
      return;
    }
    const rating = Math.min(5, Math.max(1, Number(body.rating || 5)));
    const autoApprove = store.settings.autoApproveReviews !== false;
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      productId: body.productId,
      productName: body.productName,
      author: String(body.author).trim(),
      location: String(body.location || 'India').trim(),
      rating,
      comment: String(body.comment).trim(),
      createdAt: new Date().toISOString().slice(0, 10),
      approved: autoApprove,
    };
    store.reviews.unshift(newReview);
    if (body.productId && autoApprove) {
      const prod = store.products.find((p) => p.id === body.productId);
      if (prod) {
        const approvedProductReviews = store.reviews.filter(
          (r) => r.productId === prod.id && r.approved
        );
        prod.reviewCount = approvedProductReviews.length;
        prod.rating = Number(
          (
            approvedProductReviews.reduce((sum, r) => sum + r.rating, 0) /
            approvedProductReviews.length
          ).toFixed(1)
        );
      }
    }
    saveStore(store);
    res.status(201).json(newReview);
  });

  app.post('/api/newsletter', (req, res) => {
    const store = ensureStore();
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (!store.newsletter.includes(email)) {
      store.newsletter.push(email);
      saveStore(store);
    }
    res.json({ subscribed: true, message: 'Welcome to The Crocheting Era studio letter!' });
  });

  // Admin Routes
  app.get('/api/admin/auth-status', (_req, res) => {
    const store = ensureStore();
    const envManaged = Boolean(ENV_ADMIN_PASSWORD);
    const needsSetup = !envManaged && !store.adminAuth;
    res.json({ envManaged, needsSetup });
  });

  app.post('/api/admin/setup', (req, res) => {
    const store = ensureStore();
    if (ENV_ADMIN_PASSWORD || store.adminAuth) {
      res.status(409).json({ error: 'Admin access is already configured.' });
      return;
    }
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '').trim();
    if (username.length < 3 || password.length < 6) {
      res.status(400).json({
        error: 'Username must be at least 3 characters and password at least 6 characters.',
      });
      return;
    }
    const { hash, salt } = hashPasswordScrypt(password);
    store.adminAuth = { username, passwordHash: hash, salt };
    saveStore(store);
    const token = crypto.randomBytes(32).toString('hex');
    adminSessions.set(token, Date.now() + SESSION_TTL_MS);
    res.status(201).json({ token });
  });

  app.post('/api/admin/login', (req, res) => {
    const store = ensureStore();
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || req.body?.passcode || '').trim();
    if (!username || !password) {
      res.status(401).json({ error: 'Invalid admin username or password.' });
      return;
    }

    let valid = false;
    if (ENV_ADMIN_PASSWORD) {
      valid =
        username.toLowerCase() === ENV_ADMIN_USERNAME.toLowerCase() &&
        password === ENV_ADMIN_PASSWORD;
    } else if (store.adminAuth) {
      valid =
        username.toLowerCase() === store.adminAuth.username.toLowerCase() &&
        verifyScryptPassword(password, store.adminAuth.passwordHash, store.adminAuth.salt);
    } else {
      res.status(409).json({ error: 'First-time admin setup is required.' });
      return;
    }

    if (!valid) {
      res.status(401).json({ error: 'Invalid admin username or password.' });
      return;
    }
    const token = crypto.randomBytes(32).toString('hex');
    adminSessions.set(token, Date.now() + SESSION_TTL_MS);
    res.json({ token });
  });

  app.post('/api/admin/change-credentials', (req, res) => {
    if (!isAdmin(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (ENV_ADMIN_PASSWORD) {
      res.status(400).json({
        error:
          'Admin credentials are managed by your hosting environment secrets (ADMIN_USERNAME / ADMIN_PASSWORD). Update them in your host Secrets panel.',
      });
      return;
    }
    const store = ensureStore();
    const currentPassword = String(req.body?.currentPassword || '').trim();
    const newUsername = String(req.body?.newUsername || '').trim();
    const newPassword = String(req.body?.newPassword || '').trim();

    if (
      !store.adminAuth ||
      !verifyScryptPassword(currentPassword, store.adminAuth.passwordHash, store.adminAuth.salt)
    ) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }
    if (newUsername.length < 3 || newPassword.length < 6) {
      res.status(400).json({
        error: 'New username must be at least 3 characters and password at least 6 characters.',
      });
      return;
    }
    const { hash, salt } = hashPasswordScrypt(newPassword);
    store.adminAuth = { username: newUsername, passwordHash: hash, salt };
    saveStore(store);
    res.json({ updated: true, username: newUsername });
  });

  app.post('/api/admin/logout', (req, res) => {
    const auth = req.headers['x-admin-token'];
    if (typeof auth === 'string' && auth) {
      adminSessions.delete(auth);
    }
    res.json({ loggedOut: true });
  });

  app.get('/api/admin/dashboard', (req, res) => {
    if (!isAdmin(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const store = ensureStore();
    const { adminAuth: _omitAuth, ...safeStore } = store;
    res.json({
      ...safeStore,
      envManagedCredentials: Boolean(ENV_ADMIN_PASSWORD),
      adminUsername: ENV_ADMIN_PASSWORD
        ? ENV_ADMIN_USERNAME
        : store.adminAuth?.username || 'admin',
    });
  });

  app.post('/api/products', (req, res) => {
    if (!isAdmin(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const store = ensureStore();
    const body = req.body;
    if (!body?.name || !body?.category || !body?.price) {
      res.status(400).json({ error: 'Product name, category, and price are required.' });
      return;
    }
    const newProduct: Product = {
      id: `ww-${Date.now().toString(36)}`,
      name: String(body.name).trim(),
      category: body.category,
      price: Number(body.price),
      originalPrice: body.originalPrice ? Number(body.originalPrice) : undefined,
      description: String(body.description || 'Handmade crochet creation crafted to order.'),
      colors: Array.isArray(body.colors) && body.colors.length > 0
        ? body.colors
        : [{ name: 'Pastel Blush', hex: '#E3A1B4', accentHex: '#8B3152' }],
      sizeInfo: String(body.sizeInfo || 'Standard boutique size'),
      material: String(body.material || '100% Combed Milk Cotton Yarn'),
      prepTime: String(body.prepTime || '3–5 days handcrafted'),
      stock: Number(body.stock ?? 10),
      motif: body.motif || 'bouquet',
      customImageUrl: body.customImageUrl ? String(body.customImageUrl) : undefined,
      featured: Boolean(body.featured),
      bestSeller: Boolean(body.bestSeller),
      rating: 5.0,
      reviewCount: 0,
    };
    store.products.unshift(newProduct);
    saveStore(store);
    res.status(201).json(newProduct);
  });

  app.put('/api/products/:id', (req, res) => {
    if (!isAdmin(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const store = ensureStore();
    const idx = store.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    const body = req.body || {};
    if (body.name !== undefined && !String(body.name).trim()) {
      res.status(400).json({ error: 'Product name cannot be empty.' });
      return;
    }
    if (body.price !== undefined && (Number.isNaN(Number(body.price)) || Number(body.price) <= 0)) {
      res.status(400).json({ error: 'Price must be greater than ₹0.' });
      return;
    }
    if (body.stock !== undefined && (Number.isNaN(Number(body.stock)) || Number(body.stock) < 0)) {
      res.status(400).json({ error: 'Stock cannot be negative.' });
      return;
    }

    const updated: Product = {
      ...store.products[idx],
      ...body,
      id: req.params.id,
    };
    if (body.name !== undefined) updated.name = String(body.name).trim();
    if (body.price !== undefined) updated.price = Number(body.price);
    if (body.stock !== undefined) updated.stock = Number(body.stock);

    if (body.originalPrice === null || body.originalPrice === '') {
      delete updated.originalPrice;
    } else if (body.originalPrice !== undefined) {
      updated.originalPrice = Number(body.originalPrice);
    }

    if (body.customImageUrl === null || body.customImageUrl === '') {
      delete updated.customImageUrl;
    }
    if (body.realPhotoUrl === null || body.realPhotoUrl === '') {
      delete updated.realPhotoUrl;
      delete updated.realPhotoPosition;
    }

    store.products[idx] = updated;
    saveStore(store);
    res.json(store.products[idx]);
  });

  app.delete('/api/products', (req, res) => {
    if (!isAdmin(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const store = ensureStore();
    const body = req.body || {};
    if (body.all === true) {
      const removedCount = store.products.length;
      store.products = [];
      saveStore(store);
      res.json({ deletedCount: removedCount });
      return;
    }
    if (Array.isArray(body.ids) && body.ids.length > 0) {
      const idSet = new Set(body.ids.map(String));
      const before = store.products.length;
      store.products = store.products.filter((p) => !idSet.has(p.id));
      saveStore(store);
      res.json({ deletedCount: before - store.products.length });
      return;
    }
    res.status(400).json({ error: 'Specify product IDs or all: true to delete.' });
  });

  app.delete('/api/products/:id', (req, res) => {
    if (!isAdmin(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const store = ensureStore();
    store.products = store.products.filter((p) => p.id !== req.params.id);
    saveStore(store);
    res.json({ deleted: true });
  });

  app.put('/api/admin/orders/:id', (req, res) => {
    if (!isAdmin(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const store = ensureStore();
    const order = store.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    if (req.body?.status) {
      order.status = req.body.status;
    }
    if (req.body?.courierName !== undefined) {
      const c = String(req.body.courierName).trim();
      if (c) order.courierName = c;
      else delete order.courierName;
    }
    if (req.body?.trackingNumber !== undefined) {
      const tn = String(req.body.trackingNumber).trim();
      if (tn) order.trackingNumber = tn;
      else delete order.trackingNumber;
    }
    if (req.body?.trackingUrl !== undefined) {
      const tu = String(req.body.trackingUrl).trim();
      if (!tu) {
        delete order.trackingUrl;
      } else if (isSafeHttpUrl(tu)) {
        order.trackingUrl = tu;
      } else {
        res.status(400).json({ error: 'Tracking URL must start with https:// or http://' });
        return;
      }
    }
    saveStore(store);
    res.json(order);
  });

  app.put('/api/admin/enquiries/:id', (req, res) => {
    if (!isAdmin(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const store = ensureStore();
    const enq = store.enquiries.find((e) => e.id === req.params.id);
    if (!enq) {
      res.status(404).json({ error: 'Enquiry not found.' });
      return;
    }
    if (req.body?.status) {
      enq.status = req.body.status;
    }
    saveStore(store);
    res.json(enq);
  });

  app.put('/api/admin/reviews/:id', (req, res) => {
    if (!isAdmin(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const store = ensureStore();
    const rev = store.reviews.find((r) => r.id === req.params.id);
    if (!rev) {
      res.status(404).json({ error: 'Review not found.' });
      return;
    }
    if (typeof req.body?.approved === 'boolean') {
      rev.approved = req.body.approved;
      if (rev.productId) {
        const prod = store.products.find((p) => p.id === rev.productId);
        if (prod) {
          const approvedProductReviews = store.reviews.filter(
            (r) => r.productId === prod.id && r.approved
          );
          prod.reviewCount = approvedProductReviews.length;
          prod.rating =
            approvedProductReviews.length > 0
              ? Number(
                  (
                    approvedProductReviews.reduce((sum, r) => sum + r.rating, 0) /
                    approvedProductReviews.length
                  ).toFixed(1)
                )
              : 5.0;
        }
      }
    }
    saveStore(store);
    res.json(rev);
  });

  app.delete('/api/admin/reviews/:id', (req, res) => {
    if (!isAdmin(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const store = ensureStore();
    const rev = store.reviews.find((r) => r.id === req.params.id);
    store.reviews = store.reviews.filter((r) => r.id !== req.params.id);
    if (rev?.productId) {
      const prod = store.products.find((p) => p.id === rev.productId);
      if (prod) {
        const approvedProductReviews = store.reviews.filter(
          (r) => r.productId === prod.id && r.approved
        );
        prod.reviewCount = approvedProductReviews.length;
        prod.rating =
          approvedProductReviews.length > 0
            ? Number(
                (
                  approvedProductReviews.reduce((sum, r) => sum + r.rating, 0) /
                  approvedProductReviews.length
                ).toFixed(1)
              )
            : 5.0;
      }
    }
    saveStore(store);
    res.json({ deleted: true });
  });

  app.put('/api/admin/settings', (req, res) => {
    if (!isAdmin(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const store = ensureStore();
    const body = req.body || {};
    if (body.orderWebhookUrl && !isSafeWebhookUrl(String(body.orderWebhookUrl))) {
      res.status(400).json({ error: 'Invalid webhook URL. Must be a valid public http/https URL.' });
      return;
    }
    store.settings = { ...store.settings, ...body };
    saveStore(store);
    res.json(store.settings);
  });

  app.get('/api/admin/export', (req, res) => {
    if (!isAdmin(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const store = ensureStore();
    const { adminAuth: _omitAuth, ...backup } = store;
    res.json({
      exportedAt: new Date().toISOString(),
      studio: 'The Crocheting Era',
      data: backup,
    });
  });

  app.post('/api/admin/import', (req, res) => {
    if (!isAdmin(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const payload = req.body?.store || req.body?.data || req.body;
    if (!payload || !Array.isArray(payload.products) || !payload.settings) {
      res.status(400).json({ error: 'Invalid studio backup JSON structure.' });
      return;
    }
    const current = ensureStore();
    const restored: StoreData = {
      products: payload.products,
      reviews: Array.isArray(payload.reviews) ? payload.reviews : current.reviews,
      orders: Array.isArray(payload.orders) ? payload.orders : current.orders,
      enquiries: Array.isArray(payload.enquiries) ? payload.enquiries : current.enquiries,
      newsletter: Array.isArray(payload.newsletter) ? payload.newsletter : current.newsletter,
      settings: { ...current.settings, ...payload.settings },
      adminAuth: current.adminAuth,
    };
    saveStore(restored);
    res.json({ restored: true, products: restored.products.length });
  });

  app.post('/api/admin/test-whatsapp-alert', async (req, res) => {
    if (!isAdmin(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const store = ensureStore();
    const testSettings: StudioSettings = { ...store.settings, ...(req.body?.settings || {}) };
    if (
      testSettings.whatsappAlertMode === 'webhook' &&
      testSettings.orderWebhookUrl &&
      !isSafeWebhookUrl(testSettings.orderWebhookUrl)
    ) {
      res.status(400).json({ status: 'Failed', detail: 'Invalid webhook URL.' });
      return;
    }
    const result = await dispatchAdminWhatsAppAlert(
      '🧶 *VERIFICATION ALERT — The Crocheting Era*\nAutomatic WhatsApp order alerts are connected and ready for new orders!',
      testSettings,
      { verification: true }
    );
    res.json(result);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`The Crocheting Era studio running on http://localhost:${PORT}`);
  });
}

startServer();
