BEGIN;

UPDATE companies
SET website_content = COALESCE(website_content, '{}'::jsonb) || jsonb_build_object(
    'hero_headline', 'Fast internet for Sabzazar homes',
    'hero_subheadline', 'Check your area, compare monthly packages and arrange your connection with our local team.',
    'coverage_blurb', 'Choose your area and share your street or block. Our team will confirm service availability before installation.'
)
WHERE id = 'fc481823-5b40-43bf-9b60-d539df360785'::uuid
  AND name = 'MBA Net Communications';

COMMIT;
