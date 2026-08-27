export interface MarketingPlan {
  id: string
  name: string
  description: string
  speed_mbps: number | null
  data_cap_gb: number | null
  price: number | null
  product_type: "internet" | "tv" | "iptv" | "addon" | "static_ip"
  customer_type: "residential" | "business"
  upload_speed_mbps: number | null
  installation_fee: number | null
  equipment_fee: number | null
  tax_inclusive: boolean
  contract_term_months: number | null
  technology: string | null
  is_unlimited: boolean
  is_featured: boolean
}

export interface MarketingCoverageArea {
  id: string
  name: string
  sub_zones: { id: string; name: string }[]
}

export interface WhyChooseUsItem {
  title: string
  description: string
}

export interface FaqItem {
  question: string
  answer: string
}

export interface SocialLinks {
  facebook?: string
  instagram?: string
  whatsapp?: string
}

export interface TestimonialItem {
  name: string
  area?: string
  quote: string
}

export interface MarketingWebsiteContent {
  hero_headline?: string
  hero_subheadline?: string
  /** Absolute or same-origin URL for full-bleed hero photo */
  hero_image_url?: string
  brand_color?: string
  /** City / region line shown under brand (e.g. "Faisalabad & surrounding areas") */
  service_city?: string
  /** Short install promise (e.g. "Most installs within 24–48 hours") */
  install_sla?: string
  about_text?: string
  established_year?: number | null
  why_choose_us?: WhyChooseUsItem[]
  faqs?: FaqItem[]
  testimonials?: TestimonialItem[]
  coverage_blurb?: string
  business_hours?: string
  support_hours?: string
  show_customer_count?: boolean
  payment_methods?: string[]
  support_portal_url?: string
  customer_portal_url?: string
  social_links?: SocialLinks
}

export interface MarketingSiteStats {
  plan_count: number
  area_count: number
  customer_count: number | null
}

export interface MarketingSite {
  id: string
  name: string
  address: string
  contact_number: string
  email: string
  website: string
  tagline: string
  currency_symbol: string
  logo_url: string | null
  favicon_url: string | null
  website_content: MarketingWebsiteContent
  plans: MarketingPlan[]
  addons: MarketingPlan[]
  areas: string[]
  coverage: MarketingCoverageArea[]
  stats: MarketingSiteStats
}
