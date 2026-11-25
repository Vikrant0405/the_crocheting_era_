import React, { useState } from 'react';
import QRCode from 'qrcode';
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Gift,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import type { CartItem, Order, PaymentMethod, StudioSettings } from '../types';
import { CrochetArtwork } from './CrochetArtwork';
import { buildWhatsAppUrl, formatINR } from '../utils/studio';

interface CartDrawerProps {
  isOpen: boolean;
  startAtCheckout: boolean;
  onClose: () => void;
  items: CartItem[];
  settings: StudioSettings;
  onUpdateQuantity: (index: number, delta: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onOrderCreated: (order: Order) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  startAtCheckout,
  onClose,
  items,
  settings,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderCreated,
}) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmed'>(
    startAtCheckout ? 'checkout' : 'cart'
  );
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');

  // Checkout fields
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Google Pay');
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [generatedQrUrl, setGeneratedQrUrl] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setStep(startAtCheckout ? 'checkout' : 'cart');
    }
  }, [isOpen, startAtCheckout]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const upiEnabled = settings.upiEnabled !== false;
  const giftWrapAllowed = settings.giftWrapEnabled !== false;

  React.useEffect(() => {
    if (!settings.codEnabled && paymentMethod === 'Cash on Delivery') {
      setPaymentMethod(upiEnabled ? 'Google Pay' : 'UPI');
    } else if (!upiEnabled && paymentMethod !== 'Cash on Delivery' && settings.codEnabled) {
      setPaymentMethod('Cash on Delivery');
    }
  }, [settings.codEnabled, upiEnabled, paymentMethod]);

  React.useEffect(() => {
    if (!giftWrapAllowed && giftWrap) {
      setGiftWrap(false);
      setGiftMessage('');
    }
  }, [giftWrapAllowed, giftWrap]);

  const giftFee = giftWrapAllowed && giftWrap ? settings.giftWrapFee : 0;
  const flatShipping = settings.shippingFee ?? 79;
  const shippingFee =
    items.length === 0 ? 0 : subtotal >= settings.freeShippingThreshold ? 0 : flatShipping;
  const total = subtotal + giftFee + shippingFee;

  const upiPayUri = settings.upiId
    ? `upi://pay?pa=${encodeURIComponent(settings.upiId.trim())}&pn=${encodeURIComponent(
        settings.upiPayeeName || 'The Crocheting Era'
      )}&am=${total}&cu=INR&tn=${encodeURIComponent('The Crocheting Era Order')}`
    : '';

  React.useEffect(() => {
    let active = true;
    if (!upiPayUri || settings.upiQrImageUrl) {
      setGeneratedQrUrl('');
      return;
    }
    QRCode.toDataURL(upiPayUri, { width: 220, margin: 1 })
      .then((url) => {
        if (active) setGeneratedQrUrl(url);
      })
      .catch(() => {
        if (active) setGeneratedQrUrl('');
      });
    return () => {
      active = false;
    };
  }, [upiPayUri, settings.upiQrImageUrl]);

  if (!isOpen) return null;

  const availablePayments: PaymentMethod[] = upiEnabled
    ? ['UPI', 'Google Pay', 'PhonePe', 'Paytm']
    : [];
  if (settings.codEnabled) {
    availablePayments.push('Cash on Delivery');
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          phone,
          email,
          address,
          city,
          state: stateName,
          pincode,
          items,
          giftWrap: giftWrapAllowed && giftWrap,
          giftMessage: giftWrapAllowed && giftWrap ? giftMessage : '',
          paymentMethod,
          upiTransactionId:
            paymentMethod !== 'Cash on Delivery' ? upiTransactionId.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not place order.');
        return;
      }
      setConfirmedOrder(data);
      onOrderCreated(data);
      onClearCart();
      setGiftWrap(false);
      setGiftMessage('');
      setUpiTransactionId('');
      setStep('confirmed');
    } catch {
      setErrorMsg('Network error while placing order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const buildOrderWhatsApp = (order: Order) => {
    const lines = [
      `Hello The Crocheting Era! New Order *${order.id}*`,
      `Customer: ${order.customerName}`,
      `Phone: ${order.phone}`,
      `Delivery: ${order.address}, ${order.city}, ${order.state} - ${order.pincode}`,
      `Payment Method: ${order.paymentMethod}${order.upiTransactionId ? ` (UTR: ${order.upiTransactionId})` : ''}`,
      '',
      'Items:',
      ...order.items.map(
        (i) =>
          `• ${i.name} (${i.selectedColor.name}) × ${i.quantity} — ${formatINR(i.price * i.quantity)}${i.customNote ? ` [Note: ${i.customNote}]` : ''}`
      ),
      '',
      `Total: ${formatINR(order.total)}`,
    ];
    if (order.giftWrap) {
      lines.push(`Boutique Gift Wrap: Included${order.giftMessage ? ` ("${order.giftMessage}")` : ''}`);
    }
    return buildWhatsAppUrl(settings.whatsappNumber, lines.join('\n'));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-xs">
      <div
        className="flex h-full w-full max-w-lg flex-col bg-[#FBF7F3] shadow-2xl border-l border-[#E6DDD7]"
        role="dialog"
        aria-label="Shopping Bag and Checkout"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E6DDD7] bg-white px-6 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-[#8B3152]" />
            <h2 className="font-display text-2xl font-semibold text-[#2A2225]">
              {step === 'cart' && `Your Bag (${items.reduce((s, i) => s + i.quantity, 0)})`}
              {step === 'checkout' && 'Checkout Details'}
              {step === 'confirmed' && 'Order Confirmed'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bag"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#6E6266] hover:bg-[#F2EAE1] hover:text-[#2A2225]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'confirmed' && confirmedOrder ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#51664A]/30 bg-[#E4EBE2] p-6 text-center space-y-2">
                <CheckCircle2 className="mx-auto h-10 w-10 text-[#51664A]" />
                <h3 className="font-display text-2xl font-semibold text-[#2A2225]">
                  Thank you, {confirmedOrder.customerName}!
                </h3>
                <p className="text-xs font-mono text-[#3C4F36]">
                  Order #{confirmedOrder.id} · {confirmedOrder.status}
                </p>
                <p className="text-sm text-[#3C4F36]">
                  We have received your handmade order. Save your Order ID to track crafting progress anytime.
                </p>
              </div>

              <div className="rounded-2xl border border-[#E6DDD7] bg-white p-5 space-y-3 text-sm">
                <div className="flex justify-between text-xs text-[#6E6266]">
                  <span>Payment Method</span>
                  <span className="font-semibold text-[#2A2225]">{confirmedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-xs text-[#6E6266]">
                  <span>Delivering To</span>
                  <span className="font-semibold text-[#2A2225] text-right">
                    {confirmedOrder.city}, {confirmedOrder.pincode}
                  </span>
                </div>
                <div className="border-t border-[#F2EAE1] pt-3 space-y-2">
                  {confirmedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span>
                        {item.name} ({item.selectedColor.name}) × {item.quantity}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {formatINR(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#F2EAE1] pt-3 flex justify-between font-semibold text-base tabular-nums">
                  <span>Total Paid / Due</span>
                  <span className="text-[#8B3152]">{formatINR(confirmedOrder.total)}</span>
                </div>
              </div>

              <a
                href={buildOrderWhatsApp(confirmedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#8B3152] px-5 py-3 text-sm font-semibold text-white hover:bg-[#65213B]"
              >
                <MessageCircle className="h-4 w-4" />
                Share Receipt &amp; Pay via WhatsApp / UPI
              </a>

              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[44px] rounded-xl border border-[#E6DDD7] bg-white px-5 py-2.5 text-sm font-semibold text-[#2A2225] hover:bg-[#F2EAE1]"
              >
                Continue Browsing
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center space-y-4 py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F4DCE2] text-[#8B3152]">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-[#2A2225]">
                Your bag is empty
              </h3>
              <p className="max-w-xs text-sm text-[#6E6266]">
                Explore our pastel crochet flowers, cozy soft toys, and personalized gift hampers.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] rounded-xl bg-[#8B3152] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#65213B]"
              >
                Browse Creations
              </button>
            </div>
          ) : step === 'cart' ? (
            <div className="space-y-5">
              {/* Free shipping indicator */}
              <div className="rounded-xl bg-[#E4EBE2]/70 border border-[#51664A]/20 px-4 py-2.5 text-xs text-[#3C4F36]">
                {subtotal >= settings.freeShippingThreshold
                  ? 'You unlocked complimentary studio delivery across India!'
                  : `Add ${formatINR(settings.freeShippingThreshold - subtotal)} more for free shipping.`}
              </div>

              {/* Cart Items */}
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={`${item.productId}-${item.selectedColor.name}-${idx}`}
                    className="flex gap-3.5 rounded-2xl border border-[#E6DDD7] bg-white p-3.5"
                  >
                    <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-[#F5EFE8]">
                      <CrochetArtwork
                        motif={item.motif}
                        primaryColor={item.selectedColor.hex}
                        accentColor={item.selectedColor.accentHex}
                        customImageUrl={item.customImageUrl}
                        alt={item.name}
                        className="h-full w-full"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-[#2A2225] truncate">
                            {item.name}
                          </h3>
                          <p className="text-xs text-[#6E6266]">
                            {item.selectedColor.name}
                          </p>
                          {item.customNote && (
                            <p className="mt-1 text-[11px] text-[#8B3152] truncate">
                              Note: {item.customNote}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(idx)}
                          aria-label={`Remove ${item.name}`}
                          className="p-1 text-[#6E6266] hover:text-[#8B3152]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="inline-flex h-8 items-center rounded-lg border border-[#E6DDD7] bg-[#FBF7F3]">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(idx, -1)}
                            aria-label="Decrease quantity"
                            className="flex h-full w-7 items-center justify-center text-[#2A2225]"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-semibold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(idx, 1)}
                            aria-label="Increase quantity"
                            className="flex h-full w-7 items-center justify-center text-[#2A2225]"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <span className="text-sm font-semibold tabular-nums text-[#2A2225]">
                          {formatINR(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gift Packaging */}
              {giftWrapAllowed && (
                <div className="rounded-2xl border border-[#E6DDD7] bg-white p-4 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={giftWrap}
                      onChange={(e) => setGiftWrap(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[#8B3152]"
                    />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between font-semibold text-[#2A2225]">
                        <span className="inline-flex items-center gap-1.5">
                          <Gift className="h-3.5 w-3.5 text-[#8B3152]" />
                          Special Boutique Gift Packaging
                        </span>
                        <span className="tabular-nums">+{formatINR(settings.giftWrapFee)}</span>
                      </div>
                      <p className="mt-0.5 text-[#6E6266]">
                        Pastel keepsake box, satin ribbon, dried lavender sprig &amp; handwritten card.
                      </p>
                    </div>
                  </label>
                  {giftWrap && (
                    <textarea
                      rows={2}
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      placeholder="Write your personalized gift card message..."
                      className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-xs focus:border-[#8B3152] focus:outline-none"
                    />
                  )}
                </div>
              )}
            </div>
          ) : (
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4">
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="text-xs font-semibold text-[#8B3152] hover:underline"
              >
                ← Back to Bag Summary
              </button>

              <div className="rounded-2xl border border-[#E6DDD7] bg-white p-5 space-y-3.5">
                <h3 className="font-display text-xl font-semibold text-[#2A2225]">
                  Delivery Address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                      Full Name *
                    </label>
                    <input
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter full name"
                      className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm focus:border-[#8B3152] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                      Phone / WhatsApp *
                    </label>
                    <input
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm focus:border-[#8B3152] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                    Email (Optional for receipt)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm focus:border-[#8B3152] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                    Street Address / Flat / Landmark *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House / Flat no., building, street, landmark"
                    className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm focus:border-[#8B3152] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#6E6266] mb-1">City *</label>
                    <input
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm focus:border-[#8B3152] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6E6266] mb-1">State *</label>
                    <input
                      required
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      placeholder="State"
                      className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm focus:border-[#8B3152] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                      PIN Code *
                    </label>
                    <input
                      required
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="6-digit PIN"
                      className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm tabular-nums focus:border-[#8B3152] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E6DDD7] bg-white p-5 space-y-3">
                <h3 className="font-display text-xl font-semibold text-[#2A2225]">
                  Payment Method
                </h3>
                {availablePayments.length === 0 ? (
                  <p className="text-xs text-[#8B3152]">
                    All checkout methods are currently paused. Please contact the studio on WhatsApp.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {availablePayments.map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`min-h-[42px] rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                          paymentMethod === method
                            ? 'border-[#8B3152] bg-[#F4DCE2]/60 text-[#65213B]'
                            : 'border-[#E6DDD7] bg-[#FBF7F3] text-[#2A2225]'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                )}

                {paymentMethod !== 'Cash on Delivery' &&
                  upiEnabled &&
                  (settings.upiQrImageUrl || settings.upiId) && (
                    <div className="rounded-xl border border-[#EFE6DD] bg-[#FBF7F3] p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        {(settings.upiQrImageUrl || generatedQrUrl) && (
                          <div className="h-32 w-32 shrink-0 overflow-hidden rounded-xl border border-[#E6DDD7] bg-white p-1.5">
                            <img
                              src={settings.upiQrImageUrl || generatedQrUrl}
                              alt="Studio UPI Payment QR"
                              className="h-full w-full object-contain"
                            />
                          </div>
                        )}
                        <div className="space-y-2 text-xs text-[#4E4347] text-center sm:text-left">
                          <p className="font-semibold text-[#2A2225]">
                            Scan &amp; Pay {formatINR(total)}
                          </p>
                          {settings.upiId && (
                            <div className="inline-flex items-center gap-2 rounded-lg border border-[#E6DDD7] bg-white px-2.5 py-1.5 font-mono text-[11px] text-[#2A2225]">
                              <span>{settings.upiId}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard?.writeText(settings.upiId || '');
                                  setCopiedUpi(true);
                                  setTimeout(() => setCopiedUpi(false), 1800);
                                }}
                                aria-label="Copy UPI ID"
                                className="text-[#8B3152] hover:text-[#65213B]"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                          {copiedUpi && (
                            <p className="text-[11px] font-medium text-[#51664A]">UPI ID copied!</p>
                          )}
                          {upiPayUri && (
                            <div>
                              <a
                                href={upiPayUri}
                                className="inline-flex items-center gap-1 font-semibold text-[#8B3152] hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Pay via UPI App
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#6E6266] mb-1">
                          UPI Transaction / UTR Reference No. (Optional if paid now)
                        </label>
                        <input
                          value={upiTransactionId}
                          onChange={(e) => setUpiTransactionId(e.target.value)}
                          placeholder="Enter 12-digit UTR after paying"
                          className="w-full rounded-xl border border-[#E6DDD7] bg-white px-3 py-2 text-xs font-mono focus:border-[#8B3152] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                <p className="text-xs text-[#6E6266] leading-relaxed">
                  {paymentMethod === 'Cash on Delivery'
                    ? 'Pay in cash or UPI upon delivery. Orders are confirmed quickly via WhatsApp.'
                    : settings.upiId || settings.upiQrImageUrl
                    ? `Scan the QR above or share your ${paymentMethod} confirmation via WhatsApp once placed.`
                    : `After placing your order, we confirm your ${paymentMethod} payment link directly via WhatsApp before crafting starts.`}
                </p>
              </div>

              {errorMsg && (
                <p className="rounded-xl bg-[#F4DCE2] px-4 py-2.5 text-xs font-medium text-[#65213B]">
                  {errorMsg}
                </p>
              )}
            </form>
          )}
        </div>

        {/* Footer Totals */}
        {items.length > 0 && step !== 'confirmed' && (
          <div className="border-t border-[#E6DDD7] bg-white px-6 py-4 space-y-3">
            <div className="space-y-1.5 text-xs text-[#6E6266] tabular-nums">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-[#2A2225]">{formatINR(subtotal)}</span>
              </div>
              {giftWrap && (
                <div className="flex justify-between">
                  <span>Boutique Gift Packaging</span>
                  <span>{formatINR(giftFee)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shippingFee === 0 ? 'Free' : formatINR(shippingFee)}</span>
              </div>
              <div className="flex justify-between border-t border-[#F2EAE1] pt-2 text-base font-semibold text-[#2A2225]">
                <span>Total</span>
                <span className="text-[#8B3152]">{formatINR(total)}</span>
              </div>
            </div>

            {step === 'cart' ? (
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="w-full min-h-[48px] rounded-xl bg-[#8B3152] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#65213B]"
              >
                Proceed to Checkout · {formatINR(total)}
              </button>
            ) : (
              <button
                type="submit"
                form="checkout-form"
                disabled={submitting}
                className="w-full min-h-[48px] rounded-xl bg-[#8B3152] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#65213B] disabled:opacity-50"
              >
                {submitting ? 'Confirming Order...' : `Place Order · ${formatINR(total)}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
