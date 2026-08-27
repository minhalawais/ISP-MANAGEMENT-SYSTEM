from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
import atexit
import logging
import os

import pytz

from app.services.auto_invoice_service import BATCH_DAY, generate_next_month_invoices
from app.services.notification_retention import run_notification_retention

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PAK_TZ = pytz.timezone("Asia/Karachi")
scheduler = None


def check_deadline_alerts(app=None, force=False):
    """
    Enqueue WhatsApp deadline alerts for invoices due in N days.
    Sending is owned by WhatsAppDispatcher.
    """
    from app import db
    from app.models import Invoice, WhatsAppConfig, WhatsAppMessageQueue
    from app.services.whatsapp_queue_service import WhatsAppQueueService

    logger.info("Running deadline alerts check: %s", datetime.now(PAK_TZ))

    if not app:
        logger.error("No Flask app provided to check_deadline_alerts")
        return

    with app.app_context():
        try:
            now_pkt = datetime.now(PAK_TZ)
            configs = WhatsAppConfig.query.filter_by(
                auto_send_deadline_alerts=True,
                sending_paused=False,
            ).all()

            for config in configs:
                configured_time = config.deadline_check_time or "09:00"
                if not force:
                    try:
                        scheduled = datetime.strptime(configured_time, "%H:%M").time()
                    except ValueError:
                        scheduled = datetime.strptime("09:00", "%H:%M").time()
                    if now_pkt.time().replace(second=0, microsecond=0) < scheduled:
                        continue
                    if config.last_deadline_check_date == now_pkt.date():
                        continue

                company_id = str(config.company_id)
                days_before = config.deadline_alert_days_before or 2
                target_date = now_pkt.date() + timedelta(days=days_before)

                invoices = Invoice.query.filter(
                    Invoice.company_id == company_id,
                    Invoice.due_date == target_date,
                    Invoice.status.in_(["pending", "partially_paid", "overdue"]),
                    Invoice.is_active == True,
                ).all()

                logger.info(
                    "Found %s invoices due in %s days for company %s",
                    len(invoices),
                    days_before,
                    company_id,
                )

                for invoice in invoices:
                    try:
                        customer = invoice.customer
                        if not customer or not customer.phone_1:
                            continue

                        try:
                            from app.utils.phone_formatter import format_phone_number

                            formatted_mobile = format_phone_number(customer.phone_1)
                        except (ValueError, Exception) as fmt_err:
                            logger.warning(
                                "Invalid phone for customer %s: %s", customer.id, fmt_err
                            )
                            continue

                        from app.models import Company, WhatsAppTemplate
                        from app.services.whatsapp_placeholders import (
                            apply_whatsapp_placeholders,
                            invoice_outstanding_amount,
                        )
                        from app.services.spintax_engine import get_default_template

                        if invoice_outstanding_amount(invoice) <= 0:
                            logger.info(
                                "Skipping settled or zero-value invoice %s",
                                invoice.invoice_number,
                            )
                            continue

                        company = Company.query.get(company_id)
                        template_row = WhatsAppTemplate.query.filter_by(
                            company_id=company_id,
                            category="deadline_alert",
                            is_active=True,
                        ).first()
                        template = template_row.template_text if template_row else get_default_template("deadline_alert")
                        message = apply_whatsapp_placeholders(
                            template,
                            company=company,
                            customer=customer,
                            invoice=invoice,
                        )

                        WhatsAppQueueService.enqueue_message(
                            company_id=company_id,
                            customer_id=str(customer.id),
                            mobile=formatted_mobile,
                            message_content=message,
                            message_type="deadline_alert",
                            priority=config.default_alert_priority,
                            related_invoice_id=str(invoice.id),
                            deduplication_key=f"deadline:{company_id}:{invoice.id}:{invoice.due_date.isoformat()}",
                        )
                        logger.info(
                            "Enqueued deadline alert for invoice %s",
                            invoice.invoice_number,
                        )
                    except Exception as e:
                        logger.error(
                            "Error creating deadline alert for invoice %s: %s",
                            invoice.id,
                            e,
                        )
                config.last_deadline_check_date = now_pkt.date()
                db.session.commit()
        except Exception as e:
            logger.error("Error in deadline alerts check: %s", e)


def init_scheduler(app):
    """
    In-process APScheduler BackgroundScheduler.

    Jobs:
      - generate_next_month_invoices — day BATCH_DAY (28) 01:00
      - tenant-aware WhatsApp deadline scan — every minute

    Disable invoice scheduler with AUTO_INVOICE_SCHEDULER_ENABLED=false.
    """
    if not app:
        logger.error("No Flask app provided to init_scheduler")
        return

    global scheduler
    if scheduler and scheduler.running:
        logger.info("Scheduler already running — skipping re-init")
        return

    scheduler = BackgroundScheduler(timezone=PAK_TZ)

    invoice_enabled = os.environ.get("AUTO_INVOICE_SCHEDULER_ENABLED", "true").lower() not in (
        "0",
        "false",
        "no",
        "off",
    )
    if invoice_enabled:
        scheduler.add_job(
            func=generate_next_month_invoices,
            args=[app],
            trigger=CronTrigger(day=BATCH_DAY, hour=1, minute=0, timezone=PAK_TZ),
            id="generate_next_month_invoices_job",
            name=f"Generate next-month invoices (day {BATCH_DAY})",
            replace_existing=True,
        )
    else:
        logger.info("AUTO_INVOICE_SCHEDULER_ENABLED is off — invoice job not registered")

    scheduler.add_job(
        func=check_deadline_alerts,
        args=[app],
        trigger=CronTrigger(minute='*', timezone=PAK_TZ),
        id="whatsapp_deadline_alerts_job",
        name="Enqueue tenant WhatsApp deadline alerts",
        replace_existing=True,
    )

    retention_enabled = os.environ.get("NOTIFICATION_RETENTION_ENABLED", "true").lower() not in (
        "0",
        "false",
        "no",
        "off",
    )
    if retention_enabled:
        scheduler.add_job(
            func=run_notification_retention,
            args=[app],
            trigger=CronTrigger(hour=2, minute=30, timezone=PAK_TZ),
            id="notification_retention_job",
            name="Purge old in-app notifications",
            replace_existing=True,
        )
    else:
        logger.info("NOTIFICATION_RETENTION_ENABLED is off — retention job not registered")

    scheduler.start()
    logger.info("Background scheduler started. Registered jobs:")
    for job in scheduler.get_jobs():
        logger.info("  + %s | next: %s", job.name, job.next_run_time)

    def _shutdown_scheduler():
        global scheduler
        if scheduler and scheduler.running:
            scheduler.shutdown(wait=False)
            logger.info("Scheduler shut down")

    atexit.register(_shutdown_scheduler)
    return scheduler
