export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const clean = phone.replace(/[^\d]/g, '') || '919876543210';
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function buildProductEnquiryMessage(params: {
  name: string;
  price: number;
  color: string;
  quantity?: number;
  customNote?: string;
}): string {
  const lines = [
    'Hello The Crocheting Era Studio!',
    '',
    `I would love to order / enquire about: *${params.name}*`,
    `Price: ${formatINR(params.price)}`,
    `Preferred Colour: ${params.color}`,
  ];
  if (params.quantity) {
    lines.push(`Quantity: ${params.quantity}`);
  }
  if (params.customNote && params.customNote.trim()) {
    lines.push(`Customization Request: ${params.customNote.trim()}`);
  }
  lines.push('', 'Could you please confirm availability and estimated delivery?');
  return lines.join('\n');
}
