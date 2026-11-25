import React from 'react';
import { Heart, MessageCircle, Sparkles } from 'lucide-react';
import { buildWhatsAppUrl } from '../utils/studio';

interface AboutViewProps {
  whatsappNumber: string;
  studioImage1?: string;
  studioImage2?: string;
  onNavigateShop: () => void;
  onNavigateCustom: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({
  whatsappNumber,
  studioImage1,
  studioImage2,
  onNavigateShop,
  onNavigateCustom,
}) => {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14 space-y-16">
      {/* Founder Intro */}
      <section className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-6 space-y-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#8B3152]">
            Our Story · Women-Owned Handmade Studio
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#2A2225] leading-tight">
            Every Stitch Tells a Story.
          </h1>
          <p className="text-base leading-relaxed text-[#4E4347]">
            The Crocheting Era began at a sunlit wooden desk with a single 3.5mm bamboo hook, two skeins
            of pastel cotton yarn, and a simple wish: to turn everyday gifts into keepsakes that never
            wilt or feel rushed.
          </p>
          <p className="text-base leading-relaxed text-[#4E4347]">
            What started as handmade bouquets and baby booties for close friends and cousins slowly
            grew through word of mouth into a dedicated studio. As a woman entrepreneur, building
            The Crocheting Era has been about celebrating slow craft in a fast-moving world—choosing
            patience, softness, and human warmth over factory assembly lines.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={onNavigateShop}
              className="min-h-[46px] rounded-xl bg-[#8B3152] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#65213B]"
            >
              Explore Handmade Collection
            </button>
            <button
              type="button"
              onClick={onNavigateCustom}
              className="min-h-[46px] rounded-xl border border-[#8B3152] bg-white px-6 py-2.5 text-sm font-semibold text-[#8B3152] transition-colors hover:bg-[#F4DCE2]/40"
            >
              Create Custom Gift
            </button>
          </div>
        </div>

        {/* Founder & Studio Workspace Visual */}
        <div className="lg:col-span-6 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[#E6DDD7] bg-[#F4DCE2]/35 p-5 flex flex-col justify-between min-h-[300px]">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-white border border-[#E6DDD7]">
              <img
                src={studioImage1 || '/assets/images/7-handmade-crochet-detail.jpg'}
                alt="Handcrafted crochet peacock motif from the studio"
                referrerPolicy="no-referrer"
                className={
                  studioImage1
                    ? 'h-full w-full object-cover'
                    : 'h-full w-full object-cover object-top scale-[1.35]'
                }
              />
            </div>
            <div className="mt-4">
              <p className="font-display text-xl font-semibold text-[#2A2225]">
                Studio Bench &amp; Yarn Library
              </p>
              <p className="mt-1 text-xs text-[#6E6266]">
                Curated combed cotton &amp; milk-cotton spools sorted in natural daylight.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E6DDD7] bg-[#E4EBE2]/45 p-5 flex flex-col justify-between min-h-[300px] mt-6 sm:mt-8">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-white border border-[#E6DDD7]">
              <img
                src={studioImage2 || '/assets/images/2-crochet-flower-ring.jpg'}
                alt="Handmade ruffled crochet scrunchie craft"
                referrerPolicy="no-referrer"
                className={
                  studioImage2
                    ? 'h-full w-full object-cover'
                    : 'h-full w-full object-cover object-bottom scale-[1.35]'
                }
              />
            </div>
            <div className="mt-4">
              <p className="font-display text-xl font-semibold text-[#2A2225]">
                Finished by Hand
              </p>
              <p className="mt-1 text-xs text-[#6E6266]">
                Every petal, ruffle, and gift ribbon is checked personally before dispatch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Handmade Production Process */}
      <section className="rounded-2xl border border-[#E6DDD7] bg-white p-8 sm:p-10">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#8B3152]">
            From Skein to Keepsake
          </p>
          <h2 className="mt-1 font-display text-3xl sm:text-4xl font-semibold text-[#2A2225]">
            Our 4-Step Handmade Process
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: '01',
              title: 'Yarn & Shade Curation',
              body: 'We select soft 100% combed cotton and baby-safe milk cotton yarns in soothing pastels that hold shape.',
            },
            {
              step: '02',
              title: 'Traditional Hookwork',
              body: 'Each petal, granny square, and amigurumi limb is stitched loop by loop using heritage crochet techniques.',
            },
            {
              step: '03',
              title: 'Detail & Assembly',
              body: 'Embroidery, satin ties, cotton linings, and floral wire stems are neatly secured for years of keepsake durability.',
            },
            {
              step: '04',
              title: 'Boutique Gift Wrapping',
              body: 'Your order is steamed, wrapped in pastel kraft paper or linen pouches, and paired with a handwritten card.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-xl bg-[#FBF7F3] border border-[#EFE6DD] p-5 space-y-2"
            >
              <span className="font-mono text-xs font-semibold text-[#8B3152]">{item.step}</span>
              <h3 className="font-display text-xl font-semibold text-[#2A2225]">{item.title}</h3>
              <p className="text-sm text-[#6E6266] leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Support Small Handmade Businesses */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-[#E6DDD7] bg-[#EFE9F6]/55 p-8 space-y-4">
          <Sparkles className="h-6 w-6 text-[#6C5A8A]" />
          <h2 className="font-display text-3xl font-semibold text-[#2A2225]">
            Why Supporting Small Handmade Studios Matters
          </h2>
          <p className="text-sm sm:text-base text-[#4E4347] leading-relaxed">
            Crochet cannot be replicated by machines—every single stitch you hold was looped by human
            hands. When you order from The Crocheting Era, you directly support independent women
            artisans, mindful small-batch craft, and heirloom gifting without mass-produced waste.
          </p>
        </div>

        <div className="rounded-2xl border border-[#E6DDD7] bg-[#F4DCE2]/45 p-8 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <Heart className="h-6 w-6 text-[#8B3152]" />
            <h2 className="font-display text-3xl font-semibold text-[#2A2225]">
              Let’s Talk About Your Gift Idea
            </h2>
            <p className="text-sm sm:text-base text-[#4E4347] leading-relaxed">
              Whether it’s a single sunflower for a best friend or 50 personalized keychains for your
              wedding favours, we’re just one WhatsApp message away.
            </p>
          </div>
          <div>
            <a
              href={buildWhatsAppUrl(
                whatsappNumber,
                'Hello The Crocheting Era! I read your story and would love to chat about an order.'
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#8B3152] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#65213B]"
            >
              <MessageCircle className="h-4 w-4" />
              Message the Studio on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
