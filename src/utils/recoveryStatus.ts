export type RecoveryStatus =
  | "pending"
  | "in_progress"
  | "collected"
  | "completed"
  | "cancelled"

export const RECOVERY_STATUS_LABELS: Record<RecoveryStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  collected: "Collected",
  completed: "Completed",
  cancelled: "Cancelled",
}

export function recoveryStatusLabel(status: string): string {
  return RECOVERY_STATUS_LABELS[status as RecoveryStatus] || status.replace(/_/g, " ")
}

export function employeeMaySetRecoveryStatus(status: string): boolean {
  return status === "pending" || status === "in_progress"
}

export function canOwnerSettleRecovery(status: string): boolean {
  return status === "collected"
}

export function buildCollectPayload(input: {
  invoice_id: string
  recovery_task_id?: string | null
  amount: number | string
  payment_method: string
  payment_date: string
  bank_account_id?: string | null
  notes?: string
  proof?: string
}) {
  const payload: Record<string, unknown> = {
    invoice_id: input.invoice_id,
    amount: Number(input.amount),
    payment_method: input.payment_method,
    payment_date: input.payment_date,
  }
  if (input.recovery_task_id) payload.recovery_task_id = input.recovery_task_id
  if (input.bank_account_id) payload.bank_account_id = input.bank_account_id
  if (input.notes) payload.notes = input.notes
  if (input.proof) payload.proof = input.proof
  return payload
}
