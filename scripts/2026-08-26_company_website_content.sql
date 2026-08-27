-- ================================================================
-- COMPANY WEBSITE CONTENT
-- Free-form marketing copy for each company's public vendor-domain
-- website (hero headline, why-choose-us, FAQ, business hours, socials).
-- Consumed by GET /public/site and edited via Vendor Management.
--
-- Expected shape (all keys optional; frontend supplies fallbacks):
-- {
--   "hero_headline": "",
--   "hero_subheadline": "",
--   "about_text": "",
--   "established_year": 2015,
--   "why_choose_us": [{"title": "", "description": ""}],
--   "faqs": [{"question": "", "answer": ""}],
--   "business_hours": "",
--   "social_links": {"facebook": "", "instagram": "", "whatsapp": ""}
-- }
-- ================================================================

BEGIN;

ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS website_content JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMIT;
