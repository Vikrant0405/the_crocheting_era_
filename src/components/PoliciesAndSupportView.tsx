import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  Search,
  Truck,
} from 'lucide-react';
import type { OrderStatus, StudioSettings } from '../types';
import { buildWhatsAppUrl, formatINR } from '../utils/studio';

export type SupportTab = 'track' | 'faq' | 'contact' | 'shipping' | 'privacy' | 'terms';

interface PoliciesAndSupportViewProps {
  initialTab: SupportTab;
  settings: StudioSettings;
  onOpenCustomOrder: () => void;
}

interface TrackedOrder {
  id: string;
  customerName: string;
  city: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    selectedColor: { name: string };
  }>;
  total: number;
  paymentMethod: string;
  status: OrderStatus;
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  giftWrap: boolean;
  createdAt: string;
}

const ORDER_STEPS: OrderStatus[] = [
  'Pending',
  'Crafting',
  'Ready to Ship',
  'Shipped',
  'Delivered',
];

const FAQS = [
  {
    q: 'How long does it take to hand-crochet my order?',
    a: 'Ready-to-ship keychains and scrunchies dispatch within 1–2 days. Bouquets, crochet bags, and plush soft toys take 3–7 days to craft lovingly by hand. Baby blankets typically take 8–10 days.',
  },
  {
    q: 'Can I request different yarn colours or add a personalized name tag?',
    a: 'Yes! On any product page you can open "Want a custom colour, size, or initials?" or use our dedicated Create Your Own Crochet builder to pick your exact pastel palette.',
  },
  {
    q: 'How do I wash and care for handmade crochet products?',
    a: 'For bags, baby blankets, coasters, and scrunchies, hand-wash gently in cool water with mild liquid detergent and lay flat to air dry. Avoid wringing or tumble drying. Crochet flowers can simply be dusted lightly.',
  },
  {
    q: 'Do you accept bulk orders for weddings, baby showers, or birthdays?',
    a: 'Yes, we craft bulk return gifts (mini roses, floral keychains, coasters, and keepsake pouches) with custom ribbon tags. Please reach out at least 10–14 days in advance via Custom Orders or WhatsApp.',
  },
  {
    q: 'Which payment methods are accepted?',
    a: 'We support UPI, Google Pay, PhonePe, Paytm, and Cash on Delivery across India.',
  },
];

export const PoliciesAndSupportView: React.FC<PoliciesAndSupportViewProps> = ({
  initialTab,
  settings,
  onOpenCustomOrder,
}) => {
  const [tab, setTab] = useState<SupportTab>(initialTab);
  const [orderIdInput, setOrderIdInput] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<TrackedOrder | null>(null);
  const [trackError, setTrackError] = useState('');
  const [tracking, setTracking] = useState(false);

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [contactDoneId, setContactDoneId] = useState('');
  const [contactError, setContactError] = useState('');

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const handleTrackOrder = async (e?: React.FormEvent, explicitId?: string) => {
    if (e) e.preventDefault();
    const id = (explicitId ?? orderIdInput).trim();
    if (!id) return;
    setTracking(true);
    setTrackError('');
    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) {
        setTrackedOrder(null);
        setTrackError(data.error || 'Order not found.');
      } else {
        setTrackedOrder(data);
      }
    } catch {
      setTrackError('Could not connect to order tracker.');
    } finally {
      setTracking(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSending(true);
    setContactError('');
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'Contact',
          customerName: contactName,
          phone: contactPhone,
          requirements: contactMsg,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setContactError(data.error || 'Could not send message. Please try again.');
        return;
      }
      setContactDoneId(data.id);
      setContactName('');
      setContactPhone('');
      setContactMsg('');
    } catch {
      setContactError('Network error while sending message.');
    } finally {
      setContactSending(false);
    }
  };

  const tabs: Array<{ id: SupportTab; label: string }> = [
    { id: 'track', label: 'Track Order' },
    { id: 'faq', label: 'FAQ' },
    { id: 'contact', label: 'Contact Us' },
    { id: 'shipping', label: 'Shipping & Returns' },
    { id: 'privacy', label: 'Privacy Policy' },
    { id: 'terms', label: 'Terms & Conditions' },
  ];

  const activeStepIndex = trackedOrder ? ORDER_STEPS.indexOf(trackedOrder.status) : -1;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14 space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#8B3152]">
          Studio Care &amp; Help Desk
        </p>
        <h1 className="mt-1 font-display text-4xl font-semibold text-[#2A2225]">
          Customer Care, Tracking &amp; Policies
        </h1>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[#E6DDD7] pb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`min-h-[40px] rounded-xl border px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              tab === t.id
                ? 'border-[#8B3152] bg-[#8B3152] text-white'
                : 'border-[#E6DDD7] bg-white text-[#2A2225] hover:bg-[#F2EAE1]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Order Tracking */}
      {tab === 'track' && (
        <div className="space-y-6">
          <form
            onSubmit={handleTrackOrder}
            className="rounded-2xl border border-[#E6DDD7] bg-white p-6 space-y-4"
          >
            <h2 className="font-display text-2xl font-semibold text-[#2A2225]">
              Track Your Handmade Order
            </h2>
            <p className="text-sm text-[#6E6266]">
              Enter the Order ID from your checkout confirmation receipt to check your live craft and shipping stage.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="Enter your Order ID"
                className="flex-1 rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-4 py-2.5 text-sm font-mono uppercase focus:border-[#8B3152] focus:outline-none"
              />
              <button
                type="submit"
                disabled={tracking}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#8B3152] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#65213B]"
              >
                <Search className="h-4 w-4" />
                {tracking ? 'Checking...' : 'Track Order'}
              </button>
            </div>
            {trackError && (
              <p className="text-xs font-medium text-[#8B3152]">{trackError}</p>
            )}
          </form>

          {trackedOrder && (
            <div className="rounded-2xl border border-[#E6DDD7] bg-white p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F2EAE1] pb-4">
                <div>
                  <p className="font-mono text-xs font-semibold text-[#8B3152]">
                    Order #{trackedOrder.id}
                  </p>
                  <h3 className="font-display text-2xl font-semibold text-[#2A2225]">
                    {trackedOrder.customerName} · {trackedOrder.city || 'India'}
                  </h3>
                </div>
                <div className="text-right tabular-nums">
                  <p className="text-base font-bold text-[#2A2225]">
                    {formatINR(trackedOrder.total)}
                  </p>
                  <p className="text-xs text-[#6E6266]">{trackedOrder.paymentMethod}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {ORDER_STEPS.map((step, idx) => {
                  const done = idx <= activeStepIndex;
                  return (
                    <div
                      key={step}
                      className={`rounded-xl border p-3 text-center ${
                        done
                          ? 'border-[#51664A]/40 bg-[#E4EBE2] text-[#2A2225]'
                          : 'border-[#E6DDD7] bg-[#FBF7F3] text-[#8E8185]'
                      }`}
                    >
                      <PackageCheck
                        className={`mx-auto h-4 w-4 mb-1 ${
                          done ? 'text-[#51664A]' : 'text-[#C5B6AF]'
                        }`}
                      />
                      <p className="text-xs font-semibold">{step}</p>
                    </div>
                  );
                })}
              </div>

              {(trackedOrder.courierName || trackedOrder.trackingNumber || trackedOrder.trackingUrl) && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#51664A]/30 bg-[#E4EBE2]/55 p-4 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Truck className="h-4 w-4 text-[#51664A] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-[#2A2225]">
                        Courier Dispatch Details
                      </p>
                      <p className="text-[#4E4347] mt-0.5">
                        {[
                          trackedOrder.courierName,
                          trackedOrder.trackingNumber ? `AWB: ${trackedOrder.trackingNumber}` : '',
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  </div>
                  {trackedOrder.trackingUrl &&
                    /^https?:\/\//i.test(trackedOrder.trackingUrl) && (
                      <a
                        href={trackedOrder.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#51664A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#3C4F36]"
                      >
                        Track Shipment
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                </div>
              )}

              <div className="space-y-2 border-t border-[#F2EAE1] pt-4 text-sm">
                {trackedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-[#4E4347]">
                    <span>
                      {item.name} ({item.selectedColor.name}) × {item.quantity}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatINR(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <a
                href={buildWhatsAppUrl(
                  settings.whatsappNumber,
                  `Hello The Crocheting Era! I am checking the progress of my order ${trackedOrder.id}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#E4EBE2] px-4 py-2 text-xs font-semibold text-[#3C4F36] hover:bg-[#D5E1D2]"
              >
                <MessageCircle className="h-4 w-4" />
                Ask Studio for Live Photo Update on WhatsApp
              </a>
            </div>
          )}
        </div>
      )}

      {/* FAQ */}
      {tab === 'faq' && (
        <div className="space-y-3">
          {FAQS.map((item, idx) => {
            const open = openFaq === idx;
            const paymentSummary =
              [
                settings.upiEnabled !== false ? 'UPI, Google Pay, PhonePe, Paytm' : null,
                settings.codEnabled ? 'Cash on Delivery' : null,
              ]
                .filter(Boolean)
                .join(' and ') || 'direct studio WhatsApp payment confirmation';
            const answer =
              idx === 4 ? `We currently support ${paymentSummary} across India.` : item.a;
            return (
              <div
                key={item.q}
                className="rounded-2xl border border-[#E6DDD7] bg-white overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-sm sm:text-base font-semibold text-[#2A2225]"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[#8B3152] transition-transform ${
                      open ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {open && (
                  <div className="border-t border-[#F2EAE1] px-6 py-4 text-sm leading-relaxed text-[#574D50]">
                    {answer}
                  </div>
                )}
              </div>
            );
          })}
          <div className="pt-4">
            <button
              type="button"
              onClick={onOpenCustomOrder}
              className="min-h-[44px] rounded-xl bg-[#8B3152] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#65213B]"
            >
              Start a Custom Crochet Request
            </button>
          </div>
        </div>
      )}

      {/* Contact Us */}
      {tab === 'contact' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <form
            onSubmit={handleContactSubmit}
            className="lg:col-span-7 rounded-2xl border border-[#E6DDD7] bg-white p-6 space-y-4"
          >
            <h2 className="font-display text-2xl font-semibold text-[#2A2225]">
              Send a Note to the Studio
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                  Your Name *
                </label>
                <input
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3.5 py-2.5 text-sm focus:border-[#8B3152] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                  Phone / WhatsApp *
                </label>
                <input
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Enter WhatsApp or phone number"
                  className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3.5 py-2.5 text-sm focus:border-[#8B3152] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                Message or Bulk Enquiry *
              </label>
              <textarea
                required
                rows={4}
                value={contactMsg}
                onChange={(e) => setContactMsg(e.target.value)}
                placeholder="Ask about wedding favours, custom colours, or an existing order..."
                className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3.5 py-2.5 text-sm focus:border-[#8B3152] focus:outline-none"
              />
            </div>

            {contactError && (
              <p className="rounded-xl bg-[#F4DCE2] px-4 py-2.5 text-xs font-medium text-[#65213B]">
                {contactError}
              </p>
            )}

            {contactDoneId && (
              <div className="flex items-center gap-2 rounded-xl bg-[#E4EBE2] px-4 py-3 text-xs font-semibold text-[#3C4F36]">
                <CheckCircle2 className="h-4 w-4" />
                Thank you! Enquiry {contactDoneId} received. We will reply shortly.
              </div>
            )}

            <button
              type="submit"
              disabled={contactSending}
              className="min-h-[46px] rounded-xl bg-[#8B3152] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#65213B]"
            >
              {contactSending ? 'Sending...' : 'Send Message'}
            </button>
          </form>

          <div className="lg:col-span-5 rounded-2xl border border-[#E6DDD7] bg-[#F4DCE2]/40 p-6 space-y-5 h-fit">
            <h3 className="font-display text-2xl font-semibold text-[#2A2225]">
              Direct Studio Channels
            </h3>
            <div className="space-y-3 text-sm text-[#4E4347]">
              <p className="flex items-center gap-2.5">
                <MessageCircle className="h-4 w-4 text-[#8B3152]" />
                <span>WhatsApp: +{settings.whatsappNumber}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-[#8B3152]" />
                <span>{settings.studioEmail}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Instagram className="h-4 w-4 text-[#8B3152]" />
                <span>{settings.instagramHandle}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-[#8B3152]" />
                <span>{settings.studioCity}</span>
              </p>
            </div>
            <a
              href={buildWhatsAppUrl(
                settings.whatsappNumber,
                'Hello The Crocheting Era! I would like to connect with the studio.'
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#8B3152] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#65213B]"
            >
              <MessageCircle className="h-4 w-4" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Shipping & Return Policy */}
      {tab === 'shipping' && (
        <article className="rounded-2xl border border-[#E6DDD7] bg-white p-6 sm:p-8 space-y-4 text-sm leading-relaxed text-[#4E4347]">
          <h2 className="font-display text-2xl font-semibold text-[#2A2225]">
            Shipping &amp; Return Policy
          </h2>
          <p>
            <strong>Crafting &amp; Dispatch Timelines:</strong> Because every piece at Wool &amp;
            Wonder is handmade loop by loop, please allow the preparation time mentioned on each
            product page (typically 1–7 business days) prior to dispatch.
          </p>
          <p>
            <strong>Pan-India Delivery:</strong> Orders above {formatINR(settings.freeShippingThreshold)}{' '}
            ship free across India. Orders below this threshold carry a flat ₹79 shipping fee.
            Transit usually takes 3–6 business days via reliable courier partners.
          </p>
          <p>
            <strong>Returns &amp; Replacements:</strong> As handmade and customized items are
            crafted specifically for your order, returns are accepted only if an item arrives damaged
            in transit or differs from your confirmed order. Please share an unboxing photo or video
            on WhatsApp within 48 hours of delivery for a prompt replacement or resolution.
          </p>
        </article>
      )}

      {/* Privacy Policy */}
      {tab === 'privacy' && (
        <article className="rounded-2xl border border-[#E6DDD7] bg-white p-6 sm:p-8 space-y-4 text-sm leading-relaxed text-[#4E4347]">
          <h2 className="font-display text-2xl font-semibold text-[#2A2225]">
            Privacy Policy
          </h2>
          <p>
            The Crocheting Era – Handmade Crochet Studio respects your privacy. We collect only the
            details needed to craft and deliver your order: your name, phone number, delivery
            address, email (optional), and customization notes.
          </p>
          <p>
            Your contact details are never sold or shared with third-party marketers. They are used
            solely for courier shipping labels, order updates via WhatsApp/email, and studio care.
          </p>
        </article>
      )}

      {/* Terms */}
      {tab === 'terms' && (
        <article className="rounded-2xl border border-[#E6DDD7] bg-white p-6 sm:p-8 space-y-4 text-sm leading-relaxed text-[#4E4347]">
          <h2 className="font-display text-2xl font-semibold text-[#2A2225]">
            Terms &amp; Conditions
          </h2>
          <p>
            Each The Crocheting Era creation is 100% hand-crocheted. Slight variations in stitch
            tension, petal curve, or dye-lot pastel shade are natural hallmarks of authentic human
            craftsmanship.
          </p>
          <p>
            Prices are listed in Indian Rupees (₹). Custom or bulk orders enter production once
            yarn shades and timelines are confirmed with you on WhatsApp.
          </p>
        </article>
      )}
    </div>
  );
};
