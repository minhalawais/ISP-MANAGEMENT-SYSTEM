"use client"

import { Trash2 } from "lucide-react"
import { Modal } from "../modal.tsx"
import { MODAL_CANCEL_BTN, MODAL_DANGER_BTN, MODAL_FOOTER } from "../ui/modalStyles.ts"

type ConfirmBulkDeleteModalProps = {
  isVisible: boolean
  onClose: () => void
  onConfirm: () => void
  count: number
  entityLabel: string
  warning?: string | null
  isLoading?: boolean
}

export function ConfirmBulkDeleteModal({
  isVisible,
  onClose,
  onConfirm,
  count,
  entityLabel,
  warning,
  isLoading,
}: ConfirmBulkDeleteModalProps) {
  const plural = count === 1 ? entityLabel : `${entityLabel}s`

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title={`Delete ${count} ${plural}?`}
      size="sm"
      isLoading={isLoading}
    >
      <p className="text-sm text-slate-700">
        This permanently deletes the selected {plural}. Linked records may also be removed. This
        cannot be undone.
      </p>
      {warning ? <p className="mt-3 text-sm text-coral-red font-medium">{warning}</p> : null}
      <div className={MODAL_FOOTER}>
        <button type="button" onClick={onClose} disabled={isLoading} className={MODAL_CANCEL_BTN}>
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading || count < 1}
          className={MODAL_DANGER_BTN}
        >
          <Trash2 className="h-4 w-4" />
          {isLoading ? "Deleting…" : `Delete (${count})`}
        </button>
      </div>
    </Modal>
  )
}
