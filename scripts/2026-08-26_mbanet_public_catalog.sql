-- ================================================================
-- MBA NET INITIAL PUBLIC CATALOG
-- Reviewed launch selection for the current local preview tenant.
-- Re-runnable and intentionally excludes TV/IPTV/static-IP/internal plans.
-- ================================================================

BEGIN;

UPDATE service_plans sp
SET product_type = 'internet',
    customer_type = 'residential',
    public_name = CASE sp.speed_mbps
        WHEN 10 THEN 'Home 10'
        WHEN 20 THEN 'Home 20'
        WHEN 30 THEN 'Home 30'
        WHEN 50 THEN 'Home 50'
        WHEN 70 THEN 'Home 70'
        WHEN 100 THEN 'Home 100'
    END,
    is_public = true,
    is_featured = (sp.speed_mbps = 30),
    display_order = sp.speed_mbps
FROM companies c
WHERE sp.company_id = c.id
  AND c.name = 'MBA Net Communications'
  AND sp.name IN (
      'V-10Mbps-Pure',
      'V-20Mbps-Pure',
      'V-30Mbps-Pure',
      'V-50Mbps-Pure',
      'V-70Mbps-Pure',
      'V-100Mbps-Pure'
  );

UPDATE areas a
SET is_public = true
FROM companies c
WHERE a.company_id = c.id
  AND c.name = 'MBA Net Communications'
  AND a.is_active = true
  AND a.name NOT IN ('Test Area 101', 'Wireless');

UPDATE companies
SET website_content = COALESCE(website_content, '{}'::jsonb) || jsonb_build_object(
    'hero_headline', 'Fast home internet for Sabzazar and nearby Lahore neighbourhoods',
    'hero_subheadline', 'Check your area, compare published packages and confirm the connection with our local team.',
    'service_city', 'Sabzazar, Lahore and nearby areas',
    'coverage_blurb', 'Our network serves selected Lahore neighbourhoods. Choose your area, then share your street or block for an exact availability check.',
    'brand_color', '#087c69',
    'customer_portal_url', '/customer-portal',
    'show_customer_count', false
)
WHERE name = 'MBA Net Communications';

COMMIT;
