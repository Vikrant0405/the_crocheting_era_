import React from 'react';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import type { Product, ColorOption } from '../types';
import { CrochetArtwork } from './CrochetArtwork';
import { formatINR } from '../utils/studio';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (id: string) => void;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product, color: ColorOption) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted,
  onToggleWishlist,
  onSelectProduct,
  onQuickAdd,
}) => {
  const defaultColor = product.colors[0] || {
    name: 'Blush',
    hex: '#E3A1B4',
    accentHex: '#8B3152',
  };

  return (
    <article className="group flex flex-col rounded-2xl bg-white border border-[#E6DDD7] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-14px_rgba(139,49,82,0.16)]">
      <div className="relative aspect-[4/3] w-full bg-[#F5EFE8] overflow-hidden">
        <button
          type="button"
          onClick={() => onSelectProduct(product)}
          className="block h-full w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B3152]"
          aria-label={`View details for ${product.name}`}
        >
          <CrochetArtwork
            motif={product.motif}
            primaryColor={defaultColor.hex}
            accentColor={defaultColor.accentHex}
            customImageUrl={product.customImageUrl}
            realPhotoUrl={product.realPhotoUrl}
            realPhotoPosition={product.realPhotoPosition}
            alt={product.name}
            className="h-full w-full"
          />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#6E6266] shadow-sm transition-colors hover:bg-white hover:text-[#8B3152] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B3152]"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isWishlisted ? 'fill-[#8B3152] text-[#8B3152]' : ''
            }`}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2 text-xs text-[#6E6266]">
          <span className="truncate">
            {product.category} <span aria-hidden="true">·</span> {product.prepTime}
          </span>
          <span className="inline-flex items-center gap-1 shrink-0 tabular-nums text-[#2A2225] font-medium">
            <Star className="h-3.5 w-3.5 fill-[#D8A24A] text-[#D8A24A]" />
            {product.reviewCount > 0 ? product.rating.toFixed(1) : 'New'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onSelectProduct(product)}
          className="mt-2 text-left text-base font-semibold leading-snug text-[#2A2225] transition-colors hover:text-[#8B3152]"
        >
          {product.name}
        </button>

        <div className="mt-3 flex items-center gap-1.5" aria-label="Available colours">
          {product.colors.slice(0, 4).map((c) => (
            <span
              key={c.name}
              title={c.name}
              className="h-3.5 w-3.5 rounded-full border border-black/10"
              style={{ backgroundColor: c.hex }}
            />
          ))}
          {product.colors.length > 4 && (
            <span className="text-xs text-[#6E6266]">+{product.colors.length - 4}</span>
          )}
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between gap-3 border-t border-[#F2EAE1]">
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-base font-semibold text-[#2A2225]">
              {formatINR(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-[#6E6266] line-through">
                {formatINR(product.originalPrice)}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={product.stock === 0}
            onClick={() => onQuickAdd(product, defaultColor)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#F4DCE2] px-3.5 py-2 text-xs font-semibold text-[#65213B] transition-colors hover:bg-[#8B3152] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {product.stock === 0 ? 'Sold Out' : 'Add to Bag'}
          </button>
        </div>
      </div>
    </article>
  );
};
