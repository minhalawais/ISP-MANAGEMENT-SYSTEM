-- Install concise, fixed WhatsApp billing templates for configured companies.
-- Existing active category templates are preserved as deliberate tenant customizations.

BEGIN;

INSERT INTO whatsapp_templates (
    id,
    company_id,
    name,
    description,
    template_text,
    category,
    message_type,
    is_active,
    default_priority
)
SELECT
    gen_random_uuid(),
    config.company_id,
    'Invoice issued',
    'Professional transactional notification for a newly issued invoice',
    $template$*{{company_name}}*
*Invoice {{invoice_number}}*

Hello {{first_name}},

Your internet invoice for {{billing_period}} is ready.

*Amount due:* Rs. {{amount_due}}
*Due date:* {{due_date_long}}

View your invoice:
{{invoice_link}}

Please arrange payment by the due date.

Need help? Reply to this message.$template$,
    'invoice',
    'invoice'::whatsapp_message_type,
    TRUE,
    10
FROM whatsapp_config config
WHERE NOT EXISTS (
    SELECT 1
    FROM whatsapp_templates template
    WHERE template.company_id = config.company_id
      AND template.category = 'invoice'
      AND template.is_active = TRUE
);

INSERT INTO whatsapp_templates (
    id,
    company_id,
    name,
    description,
    template_text,
    category,
    message_type,
    is_active,
    default_priority
)
SELECT
    gen_random_uuid(),
    config.company_id,
    'Payment due soon',
    'Professional reminder for an invoice approaching its due date',
    $template$*Payment reminder*

Hello {{first_name}},

Invoice *{{invoice_number}}* is due on *{{due_date_long}}*.

*Amount due:* Rs. {{amount_due}}

View your invoice:
{{invoice_link}}

If you have already paid, please disregard this reminder.

*{{company_name}}*$template$,
    'deadline_alert',
    'deadline_alert'::whatsapp_message_type,
    TRUE,
    0
FROM whatsapp_config config
WHERE NOT EXISTS (
    SELECT 1
    FROM whatsapp_templates template
    WHERE template.company_id = config.company_id
      AND template.category = 'deadline_alert'
      AND template.is_active = TRUE
);

COMMIT;
