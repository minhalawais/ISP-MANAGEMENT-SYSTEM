# WhatsApp Production Runbook

## Required deployment order

1. Pause WhatsApp sending for all tenants.
2. Back up PostgreSQL.
3. Apply `scripts/2026-08-27_whatsapp_production_hardening.sql` directly, or run
   `python scripts/apply_whatsapp_production_hardening.py` from the `api` directory.
4. Apply `scripts/2026-08-27_whatsapp_professional_templates.sql` directly, or run
   `python scripts/apply_whatsapp_professional_templates.py` from the `api` directory.
5. Set `EVOLUTION_API_KEY` and `WHATSAPP_TOKEN_ENCRYPTION_KEY`.
6. Deploy the API without an embedded dispatcher or scheduler.
7. Run `python scripts/encrypt_whatsapp_tokens.py` once.
8. Start one `python scheduler_worker.py` process.
9. Start one or more `python whatsapp_worker.py` processes.
10. Unpause one canary tenant and verify queue, quota, and webhook state changes.

Generate the encryption key once and store it in the deployment secret manager:

```powershell
.\venv\Scripts\python.exe -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Do not rotate or remove this key before re-encrypting existing instance tokens.

## Process commands

```powershell
.\venv\Scripts\python.exe run.py
.\venv\Scripts\python.exe scheduler_worker.py
.\venv\Scripts\python.exe whatsapp_worker.py
```

Only the API process should receive web traffic. Run exactly one scheduler. Multiple
WhatsApp workers are supported because queue rows are claimed with `SKIP LOCKED` and
per-company dispatch slots are reserved atomically.

## Recovery

Messages left in `processing` for more than ten minutes are automatically moved to
`retry_wait`. Messages marked `unknown` are intentionally not retried automatically;
an operator should reconcile them with Evolution before using the dashboard retry action.
