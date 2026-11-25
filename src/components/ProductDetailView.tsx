import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Clock,
  Heart,
  MessageCircle,
  Minus,
  Plus,
  Ruler,
  ShoppingBag,
  Sparkles,
  Star,
} from 'lucide-react';
import type { ColorOption, Product, Review } from '../types';
import { CrochetArtwork } from './CrochetArtwork';
import { ProductCard } from './ProductCard';
import { buildProductEnquiryMessage, buildWhatsAppUrl, formatINR } from '../utils/studio';

interface ProductDetailViewProps {
  product: Product;
  allProducts: Product[];
  reviews: Review[];
  whatsappNumber: string;
  wishlistIds: string[];
  onToggleWishlist: (id: string) => void;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, color: ColorOption, quantity: number, customNote?: string) => void;
  onBuyNow: (product: Product, color: ColorOption, quantity: number, customNote?: string) => void;
  onReviewSubmitted: (review: Review) => void;
  allowCustomerReviews?: boolean;
  autoApproveReviews?: boolean;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  allProducts,
  reviews,
  whatsappNumber,
  wishlistIds,
  onToggleWishlist,
  onBack,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  onReviewSubmitted,
  allowCustomerReviews = true,
  autoApproveReviews = true,
}) => {
  const [selectedColor, setSelectedColor] = useState<ColorOption>(
    product.colors[0] || { name: 'Blush Rose', hex: '#E3A1B4', accentHex: '#8B3152' }
  );
  const [activeAngle, setActiveAngle] = useState<'main' | 'closeup' | 'giftbox' | 'photo'>('main');
  const [quantity, setQuantity] = useState(1);
  const [showCustomBox, setShowCustomBox] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [addedNotice, setAddedNotice] = useState(false);

  // Review state
  const [revAuthor, setRevAuthor] = useState('');
  const [revLocation, setRevLocation] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');
  const [revSubmitting, setRevSubmitting] = useState(false);
  const [revFeedback, setRevFeedback] = useState('');

  const productReviews = reviews.filter((r) => r.productId === product.id);
  const related = allProducts
    .filter((p) => p.id !== product.id && (p.category === product.category || p.featured))
    .slice(0, 3);

  const isWishlisted = wishlistIds.includes(product.id);

  const handleAdd = () => {
    onAddToCart(product, selectedColor, quantity, customNote);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2200);
  };

  const whatsappUrl = buildWhatsAppUrl(
    whatsappNumber,
    buildProductEnquiryMessage({
      name: product.name,
      price: product.price,
      color: selectedColor.name,
      quantity,
      customNote,
    })
  );

  const [revError, setRevError] = useState(false);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revAuthor.trim() || !revComment.trim()) return;
    setRevSubmitting(true);
    setRevFeedback('');
    setRevError(false);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          author: revAuthor,
          location: revLocation || 'India',
          rating: revRating,
          comment: revComment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const created: Review = data;
        if (created.approved) {
          onReviewSubmitted(created);
          setRevFeedback('Thank you! Your handmade review has been published.');
        } else {
          setRevFeedback('Thank you! Your review has been received and will appear once approved by our studio.');
        }
        setRevAuthor('');
        setRevLocation('');
        setRevComment('');
        setRevRating(5);
      } else {
        setRevError(true);
        setRevFeedback(data.error || 'Could not submit your review. Please try again.');
      }
    } catch {
      setRevError(true);
      setRevFeedback('Network error while publishing your review.');
    } finally {
      setRevSubmitting(false);
    }
  };

  const galleryTabs: Array<{ id: 'main' | 'closeup' | 'giftbox' | 'photo'; label: string }> = [
    { id: 'main', label: 'Studio View' },
    { id: 'closeup', label: 'Stitch Texture' },
    { id: 'giftbox', label: 'Gift Wrap' },
  ];
  if (product.realPhotoUrl) {
    galleryTabs.push({ id: 'photo', label: 'Craft Photo' });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex min-h-[40px] items-center gap-2 text-sm font-medium text-[#6E6266] transition-colors hover:text-[#8B3152]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Catalogue
      </button>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
        {/* Left Sticky Multi-Image Gallery */}
        <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-4">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#E6DDD7] bg-[#F5EFE8]">
            {activeAngle === 'photo' && product.realPhotoUrl ? (
              <img
                src={product.realPhotoUrl}
                alt={`${product.name} studio photo`}
                referrerPolicy="no-referrer"
                className={`h-full w-full object-cover ${product.realPhotoPosition || 'object-center'} scale-[1.35]`}
              />
            ) : (
              <CrochetArtwork
                motif={product.motif}
                primaryColor={selectedColor.hex}
                accentColor={selectedColor.accentHex}
                variant={activeAngle === 'photo' ? 'main' : activeAngle}
                customImageUrl={activeAngle === 'main' ? product.customImageUrl : undefined}
                alt={product.name}
                className="h-full w-full"
              />
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {galleryTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveAngle(tab.id)}
                className={`group overflow-hidden rounded-xl border p-1.5 text-left transition-all ${
                  activeAngle === tab.id
                    ? 'border-[#8B3152] bg-white shadow-sm'
                    : 'border-[#E6DDD7] bg-[#F7F2EC] opacity-80 hover:opacity-100'
                }`}
              >
                <div className="aspect-[4/3] w-full overflow-hidden rounded-lg">
                  {tab.id === 'photo' && product.realPhotoUrl ? (
                    <img
                      src={product.realPhotoUrl}
                      alt={tab.label}
                      className={`h-full w-full object-cover ${product.realPhotoPosition || 'object-center'} scale-[1.35]`}
                    />
                  ) : (
                    <CrochetArtwork
                      motif={product.motif}
                      primaryColor={selectedColor.hex}
                      accentColor={selectedColor.accentHex}
                      variant={tab.id === 'photo' ? 'main' : tab.id}
                      customImageUrl={tab.id === 'main' ? product.customImageUrl : undefined}
                      alt={tab.label}
                      className="h-full w-full"
                    />
                  )}
                </div>
                <span className="mt-1.5 block text-center text-[11px] font-medium text-[#2A2225] truncate">
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Contiguous Purchase Module */}
        <div className="lg:col-span-6 space-y-6 rounded-2xl border border-[#E6DDD7] bg-white p-6 sm:p-8">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E6266]">
              <span>
                {product.category} <span aria-hidden="true">·</span>{' '}
                {product.stock > 0 ? `In Stock (${product.stock} ready)` : 'Made to Order'}
              </span>
              <span className="inline-flex items-center gap-1 text-[#2A2225] font-medium tabular-nums">
                <Star className="h-3.5 w-3.5 fill-[#D8A24A] text-[#D8A24A]" />
                {product.reviewCount > 0
                  ? `${product.rating.toFixed(1)} (${product.reviewCount} ${product.reviewCount === 1 ? 'review' : 'reviews'})`
                  : 'New · Be the first to review'}
              </span>
            </div>

            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#2A2225] leading-tight">
              {product.name}
            </h1>

            <div className="mt-3 flex items-baseline gap-3 tabular-nums">
              <span className="text-2xl font-bold text-[#8B3152]">
                {formatINR(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-[#6E6266] line-through">
                  {formatINR(product.originalPrice)}
                </span>
              )}
              <span className="text-xs text-[#51664A]">Inclusive of handmade gift tag</span>
            </div>
          </div>

          <p className="text-sm sm:text-base leading-relaxed text-[#574D50]">
            {product.description}
          </p>

          {/* Colour Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#2A2225]">
                Yarn Colour: <span className="font-normal text-[#6E6266]">{selectedColor.name}</span>
              </span>
              <span className="text-[#8B3152]">Live studio preview</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {product.colors.map((color) => {
                const active = selectedColor.name === color.name;
                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                      active
                        ? 'border-[#8B3152] bg-[#FBF7F3] text-[#2A2225] shadow-xs'
                        : 'border-[#E6DDD7] bg-white text-[#6E6266] hover:border-[#C5B6AF]'
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: color.hex }}
                    />
                    {color.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Craft Specifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-[#FBF7F3] p-4 border border-[#EFE6DD] text-xs">
            <div className="flex items-start gap-2.5">
              <Ruler className="h-4 w-4 shrink-0 text-[#8B3152] mt-0.5" />
              <div>
                <p className="font-semibold text-[#2A2225]">Dimensions</p>
                <p className="text-[#6E6266] mt-0.5">{product.sizeInfo}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock className="h-4 w-4 shrink-0 text-[#8B3152] mt-0.5" />
              <div>
                <p className="font-semibold text-[#2A2225]">Preparation Time</p>
                <p className="text-[#6E6266] mt-0.5">{product.prepTime}</p>
              </div>
            </div>
            <div className="sm:col-span-2 flex items-start gap-2.5 border-t border-[#EAE0D7] pt-3">
              <Sparkles className="h-4 w-4 shrink-0 text-[#8B3152] mt-0.5" />
              <div>
                <p className="font-semibold text-[#2A2225]">Material Used</p>
                <p className="text-[#6E6266] mt-0.5">{product.material}</p>
              </div>
            </div>
          </div>

          {/* Custom Colour / Size / Design Request */}
          <div className="rounded-xl border border-[#E6DDD7] bg-[#FBF7F3]/70 p-4">
            <button
              type="button"
              onClick={() => setShowCustomBox((prev) => !prev)}
              className="flex w-full items-center justify-between text-left text-xs font-semibold text-[#2A2225]"
            >
              <span>Want a custom colour, size, or initials?</span>
              <span className="text-[#8B3152]">{showCustomBox ? 'Hide' : 'Add request'}</span>
            </button>
            {showCustomBox && (
              <div className="mt-3">
                <textarea
                  rows={2}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="E.g. Make petals lilac instead of pink, or add initials 'R & M' on ribbon tag..."
                  className="w-full rounded-xl border border-[#DCD0C9] bg-white px-3 py-2 text-xs text-[#2A2225] placeholder:text-[#9A8C90] focus:border-[#8B3152] focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Quantity + Primary CTAs */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex h-12 items-center rounded-xl border border-[#E6DDD7] bg-[#FBF7F3]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="flex h-full w-11 items-center justify-center text-[#2A2225] hover:text-[#8B3152]"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-9 text-center text-sm font-semibold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  aria-label="Increase quantity"
                  className="flex h-full w-11 items-center justify-center text-[#2A2225] hover:text-[#8B3152]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                className="flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#8B3152] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#65213B]"
              >
                {addedNotice ? (
                  <>
                    <Check className="h-4 w-4" />
                    Added to Bag
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    Add to Cart · {formatINR(product.price * quantity)}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                aria-label="Toggle wishlist"
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#E6DDD7] bg-white text-[#6E6266] hover:border-[#8B3152] hover:text-[#8B3152]"
              >
                <Heart
                  className={`h-5 w-5 ${isWishlisted ? 'fill-[#8B3152] text-[#8B3152]' : ''}`}
                />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onBuyNow(product, selectedColor, quantity, customNote)}
                className="min-h-[46px] rounded-xl border border-[#8B3152] bg-[#F4DCE2]/50 px-5 py-2.5 text-sm font-semibold text-[#65213B] transition-colors hover:bg-[#F4DCE2]"
              >
                Buy Now (Checkout)
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#51664A]/30 bg-[#E4EBE2] px-5 py-2.5 text-sm font-semibold text-[#3C4F36] transition-colors hover:bg-[#D5E1D2]"
              >
                <MessageCircle className="h-4 w-4" />
                Enquire on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="mt-16 border-t border-[#E6DDD7] pt-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8B3152]">
                Verified Studio Love
              </p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-[#2A2225]">
                Customer Reviews
              </h2>
            </div>

            {productReviews.length === 0 ? (
              <p className="rounded-2xl border border-[#E6DDD7] bg-white p-6 text-sm text-[#6E6266]">
                Be the first to share your experience with {product.name}. Every review helps our small studio grow!
              </p>
            ) : (
              <div className="space-y-4">
                {productReviews.map((rev) => (
                  <article
                    key={rev.id}
                    className="rounded-2xl border border-[#E6DDD7] bg-white p-5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1 text-[#D8A24A]">
                        {Array.from({ length: rev.rating }).map((_, idx) => (
                          <Star key={idx} className="h-3.5 w-3.5 fill-current" />
                        ))}
                      </div>
                      <span className="text-xs text-[#6E6266]">{rev.createdAt}</span>
                    </div>
                    <p className="text-sm text-[#2A2225] leading-relaxed">“{rev.comment}”</p>
                    <p className="text-xs font-semibold text-[#6E6266]">
                      {rev.author} <span aria-hidden="true">·</span> {rev.location}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            {allowCustomerReviews ? (
              <form
                onSubmit={handleReviewSubmit}
                className="rounded-2xl border border-[#E6DDD7] bg-white p-6 space-y-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-2xl font-semibold text-[#2A2225]">
                    Share a Review
                  </h3>
                  {!autoApproveReviews && (
                    <span className="text-[11px] font-medium text-[#6E6266]">
                      Moderated by studio
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                      Your Name
                    </label>
                    <input
                      required
                      value={revAuthor}
                      onChange={(e) => setRevAuthor(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm focus:border-[#8B3152] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                      City
                    </label>
                    <input
                      value={revLocation}
                      onChange={(e) => setRevLocation(e.target.value)}
                      placeholder="Your city"
                      className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm focus:border-[#8B3152] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                    Rating
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRevRating(star)}
                        aria-label={`Rate ${star} stars`}
                        className="p-1"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            star <= revRating
                              ? 'fill-[#D8A24A] text-[#D8A24A]'
                              : 'text-[#DCD0C9]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6E6266] mb-1">
                    Your Review
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={revComment}
                    onChange={(e) => setRevComment(e.target.value)}
                    placeholder="How did the yarn softness, colours, and gift wrapping feel?"
                    className="w-full rounded-xl border border-[#E6DDD7] bg-[#FBF7F3] px-3 py-2 text-sm focus:border-[#8B3152] focus:outline-none"
                  />
                </div>

                {revFeedback && (
                  <p className={`text-xs font-medium ${revError ? 'text-[#9B2C2C]' : 'text-[#51664A]'}`}>
                    {revFeedback}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={revSubmitting}
                  className="w-full min-h-[44px] rounded-xl bg-[#2A2225] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8B3152] disabled:opacity-50"
                >
                  {revSubmitting ? 'Publishing...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div className="rounded-2xl border border-[#E6DDD7] bg-white p-6 space-y-2">
                <h3 className="font-display text-2xl font-semibold text-[#2A2225]">
                  Reviews Temporarily Paused
                </h3>
                <p className="text-sm text-[#6E6266]">
                  New review submissions are currently paused by the studio owner. You can still share
                  feedback anytime via WhatsApp!
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-16 border-t border-[#E6DDD7] pt-12">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8B3152]">
                Pair With
              </p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-[#2A2225]">
                Related Handmade Creations
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                isWishlisted={wishlistIds.includes(item.id)}
                onToggleWishlist={onToggleWishlist}
                onSelectProduct={onSelectProduct}
                onQuickAdd={(p, c) => onAddToCart(p, c, 1)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
