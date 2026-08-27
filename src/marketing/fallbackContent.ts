import type { FaqItem, TestimonialItem } from "./types.ts"

// Defaults so a vendor who hasn't filled Website Content still gets a
// complete, localized Pakistani ISP-style site.

export const FALLBACK_FAQS: FaqItem[] = [
  {
    question: "How long does installation take?",
    answer: "Installation timing depends on coverage, wiring and technician availability. Confirm your area to receive an accurate schedule.",
  },
  {
    question: "Is there a contract?",
    answer: "Contract terms vary by package. Any applicable term is shown with the package or confirmed before installation.",
  },
  {
    question: "What if I have a technical issue?",
    answer: "Message us on WhatsApp or call support. A technician will assist you or schedule a visit.",
  },
  {
    question: "Can I change my package later?",
    answer: "Package changes depend on the options available at your address. Contact the support team to review an upgrade or downgrade.",
  },
  {
    question: "Are installation and router charges included?",
    answer: "One-time installation, ONU or router charges vary by connection. The team confirms every applicable charge before installation.",
  },
  {
    question: "Are the advertised speeds guaranteed?",
    answer: "Package speeds are maximum service speeds. Wi-Fi coverage, devices, websites and network conditions can affect the speed experienced on a device.",
  },
]

export const FALLBACK_TESTIMONIALS: TestimonialItem[] = []

export const FALLBACK_HERO_HEADLINE = "Fast internet for Lahore homes"
export const FALLBACK_HERO_SUBHEADLINE =
  "Check your area, compare monthly packages and arrange your connection with a local team."
export const FALLBACK_INSTALL_SLA = "Installation subject to coverage and site feasibility"
export const FALLBACK_COVERAGE_BLURB =
  "Choose your area below, then confirm your street or society with our team before ordering."
export const FALLBACK_ABOUT_TEXT =
  "We connect homes and businesses with dependable internet, backed by a local team that installs, maintains, and supports every connection."

/** Built-in hero visual when vendor has not set hero_image_url */
export const DEFAULT_HERO_IMAGE = "/marketing/pakistan-home-fiber-hero-v2.webp"
export const DEFAULT_INSTALLATION_IMAGE = "/marketing/local-fiber-installation-v2.webp"
export const DEFAULT_BUSINESS_IMAGE = "/marketing/pakistan-business-internet-v2.webp"
