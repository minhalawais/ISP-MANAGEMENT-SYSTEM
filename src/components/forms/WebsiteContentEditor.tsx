"use client"

import type React from "react"
import { Plus, Trash2 } from "lucide-react"

interface WhyChooseUsItem {
  title: string
  description: string
}

interface FaqItem {
  question: string
  answer: string
}

interface TestimonialItem {
  name: string
  area?: string
  quote: string
}

interface WebsiteContent {
  hero_headline?: string
  hero_subheadline?: string
  hero_image_url?: string
  brand_color?: string
  service_city?: string
  install_sla?: string
  coverage_blurb?: string
  about_text?: string
  established_year?: number | string
  business_hours?: string
  support_hours?: string
  show_customer_count?: boolean
  customer_portal_url?: string
  payment_methods?: string[]
  why_choose_us?: WhyChooseUsItem[]
  faqs?: FaqItem[]
  testimonials?: TestimonialItem[]
  social_links?: { facebook?: string; instagram?: string; whatsapp?: string }
}

interface WebsiteContentEditorProps {
  content: WebsiteContent
  onChange: (content: WebsiteContent) => void
}

const inputClasses =
  "w-full h-9 px-3 text-sm border border-slate-200 rounded-md bg-white text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-[#3A86FF]/30 focus:border-[#3A86FF] transition-all"
const textareaClasses =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-[#3A86FF]/30 focus:border-[#3A86FF] transition-all resize-none"
const labelClasses = "block text-xs font-medium text-slate-600 mb-1"
const sectionLabelClasses = "text-xs font-semibold text-[#2A5C8A] uppercase tracking-wide"

export function WebsiteContentEditor({ content, onChange }: WebsiteContentEditorProps) {
  const update = (patch: Partial<WebsiteContent>) => onChange({ ...content, ...patch })

  const whyChooseUs = content.why_choose_us || []
  const faqs = content.faqs || []
  const testimonials = content.testimonials || []
  const social = content.social_links || {}

  const updateWhyItem = (idx: number, patch: Partial<WhyChooseUsItem>) => {
    const next = whyChooseUs.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    update({ why_choose_us: next })
  }
  const addWhyItem = () => update({ why_choose_us: [...whyChooseUs, { title: "", description: "" }] })
  const removeWhyItem = (idx: number) => update({ why_choose_us: whyChooseUs.filter((_, i) => i !== idx) })

  const updateFaqItem = (idx: number, patch: Partial<FaqItem>) => {
    const next = faqs.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    update({ faqs: next })
  }
  const addFaqItem = () => update({ faqs: [...faqs, { question: "", answer: "" }] })
  const removeFaqItem = (idx: number) => update({ faqs: faqs.filter((_, i) => i !== idx) })

  const updateTestimonial = (idx: number, patch: Partial<TestimonialItem>) => {
    const next = testimonials.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    update({ testimonials: next })
  }
  const addTestimonial = () =>
    update({ testimonials: [...testimonials, { name: "", area: "", quote: "" }] })
  const removeTestimonial = (idx: number) =>
    update({ testimonials: testimonials.filter((_, i) => i !== idx) })

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className={sectionLabelClasses}>Hero</p>
        <div>
          <label className={labelClasses}>Headline</label>
          <input
            type="text"
            value={content.hero_headline || ""}
            onChange={(e) => update({ hero_headline: e.target.value })}
            placeholder="Home internet for the way your city lives"
            className={inputClasses}
          />
        </div>
        <div>
          <label className={labelClasses}>Subheadline</label>
          <textarea
            value={content.hero_subheadline || ""}
            onChange={(e) => update({ hero_subheadline: e.target.value })}
            placeholder="Check coverage, compare packages and speak with the local team."
            rows={2}
            className={textareaClasses}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClasses}>Service city / region</label>
            <input
              type="text"
              value={content.service_city || ""}
              onChange={(e) => update({ service_city: e.target.value })}
              placeholder="e.g. Faisalabad & surrounding areas"
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Verified installation promise</label>
            <input
              type="text"
              value={content.install_sla || ""}
              onChange={(e) => update({ install_sla: e.target.value })}
              placeholder="Only enter a promise your team can consistently meet"
              className={inputClasses}
            />
          </div>
        </div>
        <div>
          <label className={labelClasses}>Hero image URL (optional)</label>
          <input
            type="text"
            value={content.hero_image_url || ""}
            onChange={(e) => update({ hero_image_url: e.target.value })}
            placeholder="https://… or leave blank for default ISP visual"
            className={inputClasses}
          />
          <p className="mt-1 text-[11px] text-slate-400">Full-bleed real service photo. Blank uses the built-in Pakistani home image.</p>
        </div>
        <div>
          <label className={labelClasses}>Website accent colour</label>
          <div className="flex items-center gap-3">
            <input type="color" value={/^#[0-9a-f]{6}$/i.test(content.brand_color || "") ? content.brand_color : "#087c69"} onChange={(e) => update({ brand_color: e.target.value })} className="h-9 w-12 rounded border border-slate-200 bg-white p-1" />
            <input type="text" value={content.brand_color || ""} onChange={(e) => update({ brand_color: e.target.value })} placeholder="#087c69" pattern="#[0-9A-Fa-f]{6}" className={inputClasses} />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Use a dark, accessible brand colour. The public site keeps the surrounding palette controlled.</p>
        </div>
      </div>

      <div className="space-y-3 border-t border-slate-100 pt-4">
        <p className={sectionLabelClasses}>About</p>
        <div>
          <label className={labelClasses}>About text</label>
          <textarea
            value={content.about_text || ""}
            onChange={(e) => update({ about_text: e.target.value })}
            placeholder="A short paragraph describing the company and its service."
            rows={3}
            className={textareaClasses}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClasses}>Established year</label>
            <input
              type="number"
              value={content.established_year ?? ""}
              onChange={(e) => update({ established_year: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="2015"
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Business hours</label>
            <input
              type="text"
              value={content.business_hours || ""}
              onChange={(e) => update({ business_hours: e.target.value })}
              placeholder="Mon-Sat, 9am-6pm"
              className={inputClasses}
            />
          </div>
        </div>
        <div>
          <label className={labelClasses}>Coverage blurb</label>
          <textarea
            value={content.coverage_blurb || ""}
            onChange={(e) => update({ coverage_blurb: e.target.value })}
            placeholder="Short text under coverage section"
            rows={2}
            className={textareaClasses}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClasses}>Support hours</label>
            <input type="text" value={content.support_hours || ""} onChange={(e) => update({ support_hours: e.target.value })} placeholder="Mon-Sat, 9am-10pm" className={inputClasses} />
          </div>
          <div>
            <label className={labelClasses}>Customer portal URL</label>
            <input type="text" value={content.customer_portal_url || ""} onChange={(e) => update({ customer_portal_url: e.target.value })} placeholder="/customer-portal" className={inputClasses} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={content.show_customer_count === true} onChange={(e) => update({ show_customer_count: e.target.checked })} className="h-4 w-4 rounded border-slate-300" />
          Publish active-customer count as social proof
        </label>
      </div>

      <div className="space-y-3 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between">
          <p className={sectionLabelClasses}>Why choose us</p>
          <button
            type="button"
            onClick={addWhyItem}
            className="flex items-center gap-1 text-xs font-medium text-[#3A86FF] hover:text-[#2A5C8A]"
          >
            <Plus className="h-3.5 w-3.5" /> Add item
          </button>
        </div>
        {whyChooseUs.length === 0 && (
          <p className="text-xs text-slate-400">No items yet — a default set will be shown on the site.</p>
        )}
        {whyChooseUs.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-start bg-slate-50 rounded-md p-3">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={item.title}
                onChange={(e) => updateWhyItem(idx, { title: e.target.value })}
                placeholder="Title (e.g. Local support)"
                className={inputClasses}
              />
              <textarea
                value={item.description}
                onChange={(e) => updateWhyItem(idx, { description: e.target.value })}
                placeholder="Short description"
                rows={2}
                className={textareaClasses}
              />
            </div>
            <button
              type="button"
              onClick={() => removeWhyItem(idx)}
              className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
              title="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-3 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between">
          <p className={sectionLabelClasses}>Testimonials</p>
          <button
            type="button"
            onClick={addTestimonial}
            className="flex items-center gap-1 text-xs font-medium text-[#3A86FF] hover:text-[#2A5C8A]"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        {testimonials.length === 0 && (
          <p className="text-xs text-slate-400">Optional. No testimonial is shown unless a real, approved quote is entered.</p>
        )}
        {testimonials.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-start bg-slate-50 rounded-md p-3">
            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateTestimonial(idx, { name: e.target.value })}
                  placeholder="Customer name"
                  className={inputClasses}
                />
                <input
                  type="text"
                  value={item.area || ""}
                  onChange={(e) => updateTestimonial(idx, { area: e.target.value })}
                  placeholder="Area (optional)"
                  className={inputClasses}
                />
              </div>
              <textarea
                value={item.quote}
                onChange={(e) => updateTestimonial(idx, { quote: e.target.value })}
                placeholder="Short quote"
                rows={2}
                className={textareaClasses}
              />
            </div>
            <button
              type="button"
              onClick={() => removeTestimonial(idx)}
              className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
              title="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-3 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between">
          <p className={sectionLabelClasses}>FAQs</p>
          <button
            type="button"
            onClick={addFaqItem}
            className="flex items-center gap-1 text-xs font-medium text-[#3A86FF] hover:text-[#2A5C8A]"
          >
            <Plus className="h-3.5 w-3.5" /> Add FAQ
          </button>
        </div>
        {faqs.length === 0 && (
          <p className="text-xs text-slate-400">No FAQs yet — a default set will be shown on the site.</p>
        )}
        {faqs.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-start bg-slate-50 rounded-md p-3">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={item.question}
                onChange={(e) => updateFaqItem(idx, { question: e.target.value })}
                placeholder="Question"
                className={inputClasses}
              />
              <textarea
                value={item.answer}
                onChange={(e) => updateFaqItem(idx, { answer: e.target.value })}
                placeholder="Answer"
                rows={2}
                className={textareaClasses}
              />
            </div>
            <button
              type="button"
              onClick={() => removeFaqItem(idx)}
              className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
              title="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-3 border-t border-slate-100 pt-4">
        <p className={sectionLabelClasses}>Social links</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelClasses}>Facebook URL</label>
            <input
              type="text"
              value={social.facebook || ""}
              onChange={(e) => update({ social_links: { ...social, facebook: e.target.value } })}
              placeholder="https://facebook.com/..."
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Instagram URL</label>
            <input
              type="text"
              value={social.instagram || ""}
              onChange={(e) => update({ social_links: { ...social, instagram: e.target.value } })}
              placeholder="https://instagram.com/..."
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>WhatsApp number</label>
            <input
              type="text"
              value={social.whatsapp || ""}
              onChange={(e) => update({ social_links: { ...social, whatsapp: e.target.value } })}
              placeholder="Leave blank to use phone number"
              className={inputClasses}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default WebsiteContentEditor
