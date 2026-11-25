export type ProductCategory =
  | 'Crochet Flowers'
  | 'Soft Toys'
  | 'Crochet Bags'
  | 'Baby Collection'
  | 'Accessories'
  | 'Home Decor'
  | 'Personalized Gifts';

export type MotifType =
  | 'bouquet'
  | 'sunflower'
  | 'rose'
  | 'teddy'
  | 'bunny'
  | 'tote'
  | 'purse'
  | 'blanket'
  | 'booties'
  | 'keychain'
  | 'scrunchie'
  | 'wall-hanging'
  | 'coasters'
  | 'gift-box';

export interface ColorOption {
  name: string;
  hex: string;
  accentHex?: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  description: string;
  colors: ColorOption[];
  sizeInfo: string;
  material: string;
  prepTime: string;
  stock: number;
  motif: MotifType;
  realPhotoUrl?: string;
  realPhotoPosition?: string;
  customImageUrl?: string;
  featured: boolean;
  bestSeller: boolean;
  rating: number;
  reviewCount: number;
}

export interface Review {
  id: string;
  productId?: string;
  productName?: string;
  author: string;
  location: string;
  rating: number;
  comment: string;
  createdAt: string;
  approved: boolean;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  category: ProductCategory;
  motif: MotifType;
  customImageUrl?: string;
  selectedColor: ColorOption;
  quantity: number;
  customNote?: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Crafting'
  | 'Ready to Ship'
  | 'Shipped'
  | 'Delivered';

export type PaymentMethod =
  | 'UPI'
  | 'Google Pay'
  | 'PhonePe'
  | 'Paytm'
  | 'Cash on Delivery';

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: CartItem[];
  subtotal: number;
  giftWrap: boolean;
  giftMessage?: string;
  shippingFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  upiTransactionId?: string;
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  status: OrderStatus;
  createdAt: string;
  whatsappAlertStatus?: 'Sent' | 'Not Configured' | 'Failed';
  whatsappAlertDetail?: string;
}

export type EnquiryStatus = 'New' | 'In Discussion' | 'Confirmed' | 'Completed';

export interface Enquiry {
  id: string;
  type: 'Custom Order' | 'Bulk Order' | 'Contact';
  customerName: string;
  phone: string;
  productType?: string;
  preferredColor?: string;
  size?: string;
  budget?: string;
  referenceImageName?: string;
  requirements: string;
  status: EnquiryStatus;
  createdAt: string;
}

export type WhatsappAlertMode = 'manual' | 'callmebot' | 'cloud-api' | 'webhook';

export interface StudioSettings {
  whatsappNumber: string;
  instagramHandle: string;
  studioEmail: string;
  studioCity: string;
  codEnabled: boolean;
  upiEnabled?: boolean;
  upiId?: string;
  upiPayeeName?: string;
  upiQrImageUrl?: string;
  giftWrapEnabled?: boolean;
  freeShippingThreshold: number;
  shippingFee?: number;
  giftWrapFee: number;
  allowCustomOrders?: boolean;
  allowCustomerReviews?: boolean;
  autoApproveReviews?: boolean;
  heroImageUrl?: string;
  heroBadgeText?: string;
  aboutStudioImageUrl1?: string;
  aboutStudioImageUrl2?: string;
  whatsappAlertMode?: WhatsappAlertMode;
  callmebotApiKey?: string;
  whatsappCloudPhoneId?: string;
  whatsappCloudToken?: string;
  orderWebhookUrl?: string;
}

export interface AdminAuthRecord {
  username: string;
  passwordHash: string;
  salt: string;
}

export interface StoreData {
  products: Product[];
  reviews: Review[];
  orders: Order[];
  enquiries: Enquiry[];
  newsletter: string[];
  settings: StudioSettings;
  adminAuth?: AdminAuthRecord;
}
