import {
  buildCollectPayload,
  canOwnerSettleRecovery,
  employeeMaySetRecoveryStatus,
  recoveryStatusLabel,
} from "./recoveryStatus.ts"

describe("recoveryStatus", () => {
  it("labels collected status", () => {
    expect(recoveryStatusLabel("collected")).toBe("Collected")
    expect(recoveryStatusLabel("in_progress")).toBe("In Progress")
  })

  it("restricts employee status updates", () => {
    expect(employeeMaySetRecoveryStatus("pending")).toBe(true)
    expect(employeeMaySetRecoveryStatus("in_progress")).toBe(true)
    expect(employeeMaySetRecoveryStatus("collected")).toBe(false)
    expect(employeeMaySetRecoveryStatus("completed")).toBe(false)
  })

  it("allows owner settle only when collected", () => {
    expect(canOwnerSettleRecovery("collected")).toBe(true)
    expect(canOwnerSettleRecovery("completed")).toBe(false)
    expect(canOwnerSettleRecovery("pending")).toBe(false)
  })

  it("builds collect payload shape", () => {
    expect(
      buildCollectPayload({
        invoice_id: "inv-1",
        recovery_task_id: "rt-1",
        amount: "250.50",
        payment_method: "cash",
        payment_date: "2026-08-21",
        notes: "door",
      })
    ).toEqual({
      invoice_id: "inv-1",
      recovery_task_id: "rt-1",
      amount: 250.5,
      payment_method: "cash",
      payment_date: "2026-08-21",
      notes: "door",
    })
  })
})
