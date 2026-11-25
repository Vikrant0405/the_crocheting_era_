import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { buildWhatsAppUrl } from '../utils/studio';

interface FloatingWhatsAppProps {
  whatsappNumber: string;
  onOpenCustomOrder: () => void;
  onOpenTrackOrder: () => void;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({
  whatsappNumber,
  onOpenCustomOrder,
  onOpenTrackOrder,
}) => {
  const [open, setOpen] = useState(false);

  const quickTopics = [
    {
      label: 'Ask about a product',
      msg: 'Hello The Crocheting Era! I have a question about one of your handmade crochet products.',
    },
    {
      label: 'Discuss bulk / return gifts',
      msg: 'Hello The Crocheting Era! I would like to discuss a bulk crochet order for an upcoming occasion.',
    },
    {
      label: 'Chat directly with studio',
      msg: 'Hello The Crocheting Era! I would love to connect regarding an order.',
    },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="w-72 rounded-2xl border border-[#E6DDD7] bg-white p-4 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#F2EAE1] pb-2.5">
            <div>
              <p className="font-display text-lg font-semibold text-[#2A2225]">
                The Crocheting Era WhatsApp
              </p>
              <p className="text-[11px] text-[#6E6266]">
                Direct studio support for orders &amp; custom gifts
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close WhatsApp menu"
              className="rounded-full p-1 text-[#6E6266] hover:bg-[#F2EAE1]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            {quickTopics.map((topic) => (
              <a
                key={topic.label}
                href={buildWhatsAppUrl(whatsappNumber, topic.msg)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="block rounded-xl bg-[#FBF7F3] px-3 py-2 text-xs font-medium text-[#2A2225] transition-colors hover:bg-[#E4EBE2]"
              >
                {topic.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenCustomOrder();
              }}
              className="w-full text-left rounded-xl bg-[#FBF7F3] px-3 py-2 text-xs font-medium text-[#2A2225] transition-colors hover:bg-[#F4DCE2]"
            >
              Request custom colour / design
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenTrackOrder();
              }}
              className="w-full text-left rounded-xl bg-[#FBF7F3] px-3 py-2 text-xs font-medium text-[#2A2225] transition-colors hover:bg-[#EFE9F6]"
            >
              Check order status
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="WhatsApp Studio Help"
        className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B3152]"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
};
