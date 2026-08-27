"""Legacy daily recharge scheduler tests retired — monthly batch lives in test_auto_invoice_service."""
import unittest
from unittest.mock import MagicMock, patch

from app.services.auto_invoice_service import BATCH_DAY, get_next_month_dates
from datetime import date


class TestMonthlyBatchContract(unittest.TestCase):
    def test_batch_runs_for_next_month(self):
        start, end, month, year = get_next_month_dates(date(2026, 8, BATCH_DAY))
        self.assertEqual(start.day, 1)
        self.assertEqual(month, 9)
        self.assertEqual(year, 2026)
        self.assertEqual(end, date(2026, 9, 30))


class TestNotificationRetentionJob(unittest.TestCase):
    def test_scheduler_imports_retention(self):
        from app.services.notification_retention import run_notification_retention
        self.assertTrue(callable(run_notification_retention))

    @patch("scheduler.BackgroundScheduler")
    def test_retention_job_registered_when_enabled(self, mock_sched_cls):
        import scheduler as sched_mod

        mock_sched = MagicMock()
        mock_sched.running = False
        mock_sched.get_jobs.return_value = []
        mock_sched_cls.return_value = mock_sched

        app = MagicMock()
        with patch.dict("os.environ", {"NOTIFICATION_RETENTION_ENABLED": "true"}, clear=False):
            sched_mod.scheduler = None
            sched_mod.init_scheduler(app)

        job_ids = [c.kwargs.get("id") for c in mock_sched.add_job.call_args_list]
        self.assertIn("notification_retention_job", job_ids)


if __name__ == "__main__":
    unittest.main()
