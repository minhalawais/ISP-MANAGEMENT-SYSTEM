# QA Audit Report — Automated Suite vs Catalog

**Date:** 2026-08-31  
**Catalog:** `docs/QA_COMPLETE_TEST_CATALOG.md`  
**Verdict:** Full manual catalog was **not** previously executed. This audit runs the **existing automated suites** and maps coverage / gaps.

---

## 1. Executive summary

| Suite | Result | Counts |
|-------|--------|--------|
| Frontend Jest | **PASS** | 46 suites · **205** tests · 0 failed |
| API pytest | **PASS** | **380** passed · **0** failed · **0** errors |

**Catalog coverage:** Automated tests exercise a **subset** of catalog areas (auth/host, WhatsApp, portals APIs, notifications, recovery/inventory units, invoices). Most CRUD UI cases (multi-checkbox, period filters per page, E2E browser flows, marketing pages, worker processes live) remain **manual / unexecuted**.

**Overall automated health:** Frontend and API suites are both green after fixing the prior 10 failures / 2 teardown errors.

---

## 2. What was run

```text
# Frontend
CI=true npx react-scripts test --watchAll=false
→ Test Suites: 46 passed, 46 total
→ Tests: 205 passed, 205 total

# API (post-fix re-run)
api/venv/Scripts/python.exe -m pytest tests -q --tb=line
→ 380 passed, 0 failed, 0 errors, 52 warnings
```

Logs: `docs/_jest_audit_run.log`, `docs/_pytest_audit_run.log` (local run artifacts).

---

## 3. Previously failed API tests (resolved)

| # | Test | Prior failure | Fix applied |
|---|------|---------------|-------------|
| 1 | `test_auto_invoice_api::test_e2e_dry_run_then_generate_then_idempotent` | Teardown FK: `whatsapp_message_queue.related_invoice_id` | Delete queue rows before invoices in `_cleanup` |
| 2 | `test_auto_invoice_api::test_e2e_lock_busy_skips_work` | Cascading aborted transaction | Same cleanup + rollback on failure |
| 3 | `test_bulk_monthly_invoices::test_generate_persists_same_due_date` | Same WA queue FK | Same pattern in bulk `_cleanup` |
| 4 | `test_bulk_monthly_invoices::test_preview_due_date_parity_with_auto_helper` | Cascading aborted txn | Same |
| 5 | `test_complaint_resolution_billing::test_partial_and_paid` | `SimpleNamespace` missing `.id` | Mock DB-sum path with `invoice.id` + scalar returns |
| 6 | `test_complaint_resolution_billing::test_settle_marks_paid_and_ledger` | `decimal.InvalidOperation` | Mock `scalar` to real Decimal |
| 7 | `test_invoice_filters::test_get_invoices_page_applies_status_filter` | Brittle `str(call)` assert | Assert filter expression `.left.key == "status"` |
| 8–10 | `test_recovery_collect_settle` (collect + 2 settle) | Missing `.customer` / attrs | Fixture `customer` + `invoice_number`; safe `getattr` in CRUD |

**Teardown ERRORs (2):** cleared by Phase 1 cleanup/rollback.

---

## 4. Catalog coverage map (automated)

| Catalog area | Automated coverage | Status |
|--------------|-------------------|--------|
| Shared CRUD UI (checkbox, period, stats click) | Partial (hooks/toolbar/stat cards unit) | **Not full** |
| 20 CRUD page E2E (add/edit/delete/export) | Mostly **none** in browser | **Manual required** |
| Vendor host login | `test_company_host_access`, `test_vendor_domain_login` | Strong unit coverage |
| Customer portal auth/profile/complaints | Several `test_customer_portal_*` | API-level |
| Employee portal access/scope/financial | Several `test_employee_portal_*` | API-level |
| Recovery collect/settle | `test_recovery_collect_settle` | **Pass** |
| Complaint billing | `test_complaint_resolution_billing` | **Pass** |
| Invoices / auto-invoice / bulk monthly | Multiple | **Pass** |
| WhatsApp (queue, lifecycle, window, dispatcher, security) | Large suite | Pass |
| Notifications | phase2/3 + routes + emit hooks | Pass |
| Scheduler | `test_scheduler` | Pass |
| Marketing site API | `test_public_marketing_site` | Pass |
| Live workers (`whatsapp_worker` / `scheduler_worker`) | Not process-tested here | **Manual / staging** |
| Docker | N/A in repo | N/A |
| Reporting/ledger UI | No dedicated FE E2E | **Manual** |
| Public invoice UI pay flow | Limited | **Manual** |

---

## 5. Frontend suite highlights (all pass)

Representative areas covered by Jest (205 tests):

- Notifications page + bell + hook  
- Employee portal: tasks, complaints, customers, profile, financial, recovery table, sheets  
- Customer portal smoke redesign  
- CRUD filters/stats/toolbar/period utils  
- Marketing host resolve + default content  
- Auth redirects, sidebar, login branding  
- Invoice form / subscription lines / WhatsApp bulk audience utils  

These support catalog sections TC-NTF-*, TC-EP-* (UI smoke), TC-CP-* (smoke), TC-CRUD filter utils — **not** full TC-CRUD-011…025 per module.

---

## 6. Audit conclusion

| Question | Answer |
|----------|--------|
| Were all catalog cases already run? | **No** |
| Can we certify production QA from this run alone? | **No** — manual + browser E2E still required |
| Automated gate today | **Frontend: green** · **API: green (380 passed)** |
| Next priority | Manual catalog §12: auth/host → Customer/Invoice/Payment smoke → portals → WhatsApp worker drain → E2E |

---

## 7. Recommended next steps

1. ~~Fix the 10 pytest failures~~ **Done** (2026-08-31).  
2. ~~Re-run `pytest tests -q` until green~~ **Done** — 380 passed.  
3. Execute manual catalog priority order (catalog §12): auth/host → Customer/Invoice/Payment smoke → portals → WhatsApp worker drain → E2E.  
4. Optionally add Playwright for TC-CRUD / TC-EP / TC-CP critical paths.

---

*This report documents automated execution only. Manual catalog rows remain open until executed and signed off.*
