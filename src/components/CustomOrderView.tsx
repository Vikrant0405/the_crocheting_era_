import React, { useState } from 'react';
import { CheckCircle2, ImagePlus, MessageCircle, Palette, Sparkles, Upload } from 'lucide-react';
import { buildWhatsAppUrl } from '../utils/studio';

interface CustomOrderViewProps {
  whatsappNumber: string;
}

const PRODUCT_TYPES = [
  'Crochet Flower Bouquet',
  'Festive Crochet Garland / Toran',
  'Handmade Crochet Cardigan',
  'Handmade Soft Toy / Amigurumi',
  'Crochet Handbag / Tote',
  'Baby Blanket / Booties Set',
  'Keychain / Hair Accessories (Bulk or Single)',
  'Home Decor (Coasters / Wall Hanging)',
  'Personalized Gift Box / Couple Keepsake',
];

const PASTEL_PALETTES = [
  { name: 'Blush Rose & Cream', colors: ['#F4DCE2', '#E3A1B4', '#FBF7F3'] },
  { name: 'Lavender & Oat', colors: ['#EAE3F4', '#B9A9D6', '#F2EAE1'] },
  { name: 'Sage Botanical', colors: ['#E4EBE2', '#89A082', '#F5EFE8'] },
  { name: 'Sunlit Honey & Linen', colors: ['#F8E6B8', '#EAB949', '#F4EDE4'] },
  { name: 'Rosewood & Berry', colors: ['#F4DCE2', '#8B3152', '#DFC6CC'] },
  { name: 'Custom Shade Mix', colors: ['#E3A1B4', '#B9A9D6', '#89A082'] },
];

const SIZE_OPTIONS = [
  'Mini / Pocket Size',
  'Standard Boutique Size',
  'Deluxe / Statement Size',
  'Bulk Order (10+ pieces)',
];

export const CustomOrderView: React.FC<CustomOrderViewProps> = ({ whatsappNumber }) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [productType, setProductType] = useState(PRODUCT_TYPES[0]);
  const [selectedPalette, setSelectedPalette] = useState(PASTEL_PALETTES[0].name);
  const [customShadeNote, setCustomShadeNote] = useState('');
  const [size, setSize] = useState(SIZE_OPTIONS[1]);
  const [budget, setBudget] = useState('');
  const [requirements, setRequirements] = useState('');
  const [refImageName, setRefImageName] = useState('');
  const [refImagePreview, setRefImagePreview] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRefImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRefImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const buildCustomWhatsAppMessage = () => {
    const lines = [
      'Hello The Crocheting Era!',
      '',
      'I would like to create a *Custom Crochet Order*:',
      `• Name: ${customerName || 'Customer'}`,
      `• Phone: ${phone || 'Not shared'}`,
      `• Product Type: ${productType}`,
      `• Preferred Palette: ${selectedPalette}${customShadeNote ? ` (${customShadeNote})` : ''}`,
      `• Size / Quantity: ${size}`,
      `• Estimated Budget: ${budget ? `₹${budget}` : 'Flexible'}`,
      `• Reference Image: ${refImageName ? `${refImageName} (I will attach this photo in chat)` : 'None'}`,
      '',
      `Customization Details:\n${requirements || 'Please share yarn options and timeline.'}`,
    ];
    return lines.join('\n');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: size.startsWith('Bulk') ? 'Bulk Order' : 'Custom Order',
          customerName,
          phone,
          productType,
          preferredColor: `${selectedPalette}${customShadeNote ? ` (${customShadeNote})` : ''}`,
          size,
          budget: budget ? `₹${budget}` : undefined,
          referenceImageName: refImageName || undefined,
          requirements,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmittedId(data.id);
      } else {
        setSubmitError(data.error || 'Could not save your custom request. Please try again.');
      }
    } catch {
      setSubmitError('Network error while saving your request. You can still message us directly on WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  };

  const waUrl = buildWhatsAppUrl(whatsappNumber, buildCustomWhatsAppMessage());

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#8B3152]">
          Bespoke Crochet Studio
        </p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl font-semibold text-[#2A2225] leading-tight">
          Create Your Own Crochet
        </h1>
        <p className="mt-3 text-base text-[#574D50] leading-relaxed">
          Have a specific bouquet colour, nursery blanket theme, or personalized gift hamper in mind?
          Design your piece below and discuss yarn shades directly with me on WhatsApp.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-8 rounded-2xl border border-[#E6DDD7] bg-white p-6 sm:p-8 space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#2A2225] mb-1.5">
                Your Name *
              </label>
              <input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3.5 py-2.5 text-sm focus:border-[#8B3152] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#2A2225] mb-1.5">
                WhatsApp Number *
              </label>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter WhatsApp number"
                className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3.5 py-2.5 text-sm focus:border-[#8B3152] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#2A2225] mb-1.5">
                1. Product Type
              </label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3.5 py-2.5 text-sm focus:border-[#8B3152] focus:outline-none"
              >
                {PRODUCT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#2A2225] mb-1.5">
                2. Size / Order Scale
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3.5 py-2.5 text-sm focus:border-[#8B3152] focus:outline-none"
              >
                {SIZE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Color Palette Picker */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#2A2225]">
              <Palette className="h-4 w-4 text-[#8B3152]" />
              3. Preferred Yarn Palette
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {PASTEL_PALETTES.map((pal) => {
                const active = selectedPalette === pal.name;
                return (
                  <button
                    key={pal.name}
                    type="button"
                    onClick={() => setSelectedPalette(pal.name)}
                    className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                      active
                        ? 'border-[#8B3152] bg-[#FBF7F3] shadow-xs'
                        : 'border-[#E6DDD7] bg-white hover:border-[#C5B6AF]'
                    }`}
                  >
                    <div className="flex -space-x-1.5 shrink-0">
                      {pal.colors.map((hex, idx) => (
                        <span
                          key={idx}
                          className="h-5 w-5 rounded-full border border-white shadow-xs"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-[#2A2225] leading-tight">
                      {pal.name}
                    </span>
                  </button>
                );
              })}
            </div>
            <input
              value={customShadeNote}
              onChange={(e) => setCustomShadeNote(e.target.value)}
              placeholder="Optional: specify exact yarn shades (e.g. dusty lilac petals + ivory wrapping)"
              className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3.5 py-2.5 text-sm focus:border-[#8B3152] focus:outline-none"
            />
          </div>

          {/* Reference Image & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#2A2225] mb-1.5">
                4. Upload Reference Image (Optional)
              </label>
              <label className="flex min-h-[96px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#CDBEB5] bg-[#FBF7F3] p-4 text-center transition-colors hover:border-[#8B3152]">
                {refImagePreview ? (
                  <div className="flex items-center gap-3 w-full">
                    <img
                      src={refImagePreview}
                      alt="Reference preview"
                      className="h-14 w-14 rounded-lg object-cover border border-[#E6DDD7]"
                    />
                    <div className="text-left min-w-0">
                      <p className="text-xs font-semibold text-[#2A2225] truncate">
                        {refImageName}
                      </p>
                      <p className="text-[11px] text-[#51664A]">Ready to share on WhatsApp</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <ImagePlus className="h-5 w-5 text-[#8B3152]" />
                    <span className="mt-1.5 text-xs font-medium text-[#2A2225]">
                      Choose inspiration photo
                    </span>
                    <span className="text-[11px] text-[#6E6266]">JPG, PNG up to 5MB</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2A2225] mb-1.5">
                5. Target Budget (₹ INR)
              </label>
              <input
                type="number"
                min={200}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Optional budget in ₹"
                className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3.5 py-2.5 text-sm tabular-nums focus:border-[#8B3152] focus:outline-none"
              />
              <p className="mt-2 text-xs text-[#6E6266] leading-relaxed">
                We suggest flower counts, yarn grades, and wrapping styles tailored to your budget.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2A2225] mb-1.5">
              6. Describe Your Customization & Occasion *
            </label>
            <textarea
              required
              rows={4}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Tell us about initials, occasion date, gift message, flower varieties (roses, tulips, sunflowers), or bulk return-gift quantities..."
              className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3.5 py-2.5 text-sm focus:border-[#8B3152] focus:outline-none"
            />
          </div>

          {submittedId && (
            <div className="rounded-xl border border-[#51664A]/30 bg-[#E4EBE2] p-4 text-sm text-[#2A2225] space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#51664A] mt-0.5" />
                <div>
                  <p className="font-semibold">
                    Custom request logged ({submittedId})!
                  </p>
                  <p className="mt-0.5 text-xs text-[#3C4F36]">
                    Your design brief is saved in our studio queue. Click below to open WhatsApp
                    with your pre-filled summary{refImageName ? ' and attach your inspiration photo' : ''}.
                  </p>
                </div>
              </div>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-2 text-xs font-semibold text-white hover:bg-[#1EBE5D]"
              >
                <MessageCircle className="h-4 w-4" />
                Continue to WhatsApp Chat
              </a>
            </div>
          )}

          {submitError && (
            <div className="rounded-xl border border-[#E6B8B8] bg-[#FDF2F2] px-4 py-3 text-xs font-medium text-[#9B2C2C]">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[50px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#8B3152] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#65213B] disabled:opacity-50"
          >
            <MessageCircle className="h-4 w-4" />
            {submitting ? 'Saving Custom Request...' : 'Save Custom Request & Prepare WhatsApp'}
          </button>
        </form>

        {/* Studio Guide Sidebar */}
        <aside className="lg:col-span-4 space-y-5">
          <div className="rounded-2xl border border-[#E6DDD7] bg-[#F4DCE2]/45 p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#8B3152]">
              <Sparkles className="h-5 w-5" />
              <h2 className="font-display text-2xl font-semibold text-[#2A2225]">
                How Custom Orders Work
              </h2>
            </div>
            <ol className="space-y-4 text-sm text-[#4A4043]">
              <li className="flex gap-3">
                <span className="font-mono text-xs font-semibold text-[#8B3152] pt-0.5">01</span>
                <span>Share your inspiration, palette, and deadline using this builder.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs font-semibold text-[#8B3152] pt-0.5">02</span>
                <span>We send yarn swatch photos on WhatsApp within a few hours to confirm exact shades.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs font-semibold text-[#8B3152] pt-0.5">03</span>
                <span>We hand-crochet your piece and share progress photos before gift-wrapping & dispatch.</span>
              </li>
            </ol>
          </div>

          <div className="rounded-2xl border border-[#E6DDD7] bg-white p-6 space-y-3">
            <h3 className="font-display text-xl font-semibold text-[#2A2225]">
              Bulk &amp; Artist Collaborations
            </h3>
            <p className="text-sm text-[#6E6266] leading-relaxed">
              Planning a wedding, festival, birthday favour, or creator bulk order? We craft custom
              keychains, garlands, bouquets, and cardigans across Maharashtra and pan-India. You can
              also DM us directly on Instagram at{' '}
              <a
                href="https://www.instagram.com/the_crocheting_era/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#8B3152] hover:underline"
              >
                @the_crocheting_era
              </a>
              .
            </p>
            <div className="pt-2 border-t border-[#F2EAE1] text-xs text-[#6E6266] flex items-center gap-2">
              <Upload className="h-3.5 w-3.5 text-[#8B3152]" />
              <span>Typical bulk lead time: 10–14 days</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
