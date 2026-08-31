"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Modal } from "../modal.tsx"
import { Upload, Cable, Package, Banknote } from "lucide-react"
import axiosInstance from "../../utils/axiosConfig.ts"
import { getToken } from "../../utils/auth.ts"

interface WireItem {
  id: string
  item_type: string
  quantity: number
  unit_price: number
}

interface WarehouseItem {
  id: string
  item_type: string
  quantity: number
  unit_price: number
}

export type ResolveComplaintPayload = {
  notes: string
  resolutionProof: File | null
  materials: Array<Record<string, unknown>>
  cash_amount: number
  payment_date?: string
  payment_method?: string
}

interface ResolveComplaintModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: ResolveComplaintPayload) => void
}

function todayPktDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" })
}

export const ResolveComplaintModal: React.FC<ResolveComplaintModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [notes, setNotes] = useState("")
  const [resolutionProof, setResolutionProof] = useState<File | null>(null)
  const [wireItems, setWireItems] = useState<WireItem[]>([])
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([])
  const [wireItemId, setWireItemId] = useState("")
  const [wireQty, setWireQty] = useState("")
  const [otherItemId, setOtherItemId] = useState("")
  const [otherQty, setOtherQty] = useState("1")
  const [cashAmount, setCashAmount] = useState("")

  useEffect(() => {
    if (!isOpen) return
    const load = async () => {
      try {
        const token = getToken()
        // Admin uses inventory list; reuse portal options if available for current user, else /inventory/list style
        const res = await axiosInstance.get("/inventory/list", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const rows = Array.isArray(res.data) ? res.data : []
        const wire: WireItem[] = []
        const other: WarehouseItem[] = []
        for (const row of rows) {
          const itemType = String(row.item_type || "")
          const entry = {
            id: String(row.id),
            item_type: itemType,
            quantity: Number(row.quantity || 0),
            unit_price: Number(row.unit_price || 0),
          }
          if (["fiber cable", "fiber_cable", "cable", "wire"].includes(itemType.toLowerCase())) {
            if (entry.quantity > 0) wire.push(entry)
          } else if (entry.quantity > 0 && row.is_active !== false) {
            other.push(entry)
          }
        }
        setWireItems(wire)
        setWarehouseItems(other)
      } catch {
        setWireItems([])
        setWarehouseItems([])
      }
    }
    load()
  }, [isOpen])

  const handleConfirm = () => {
    const materials: Array<Record<string, unknown>> = []
    const wQty = Number(wireQty)
    if (wireItemId && wQty > 0) {
      materials.push({ inventory_item_id: wireItemId, quantity: wQty, usage_outcome: "consumed" })
    }
    const oQty = Number(otherQty)
    if (otherItemId && oQty > 0) {
      materials.push({ inventory_item_id: otherItemId, quantity: oQty, usage_outcome: "consumed" })
    }
    const cash = Number(cashAmount || 0)
    onConfirm({
      notes,
      resolutionProof,
      materials,
      cash_amount: cash,
      payment_method: "cash",
      payment_date: cash > 0 ? todayPktDate() : undefined,
    })
    setNotes("")
    setResolutionProof(null)
    setWireItemId("")
    setWireQty("")
    setOtherItemId("")
    setOtherQty("1")
    setCashAmount("")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResolutionProof(e.target.files[0])
    }
  }

  return (
    <Modal isVisible={isOpen} onClose={onClose} title="Resolve Complaint">
      <div className="mt-4 space-y-3">
        <label htmlFor="resolution-notes" className="block text-sm font-medium text-deep-ocean">
          Resolution Notes
        </label>
        <textarea
          id="resolution-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/20 resize-none"
          placeholder="How the complaint was resolved..."
        />

        <div>
          <label htmlFor="resolution-proof" className="block text-sm font-medium text-deep-ocean">
            Resolution Proof
          </label>
          <label
            htmlFor="resolution-proof"
            className="mt-1 inline-flex items-center h-9 px-3 border border-slate-200 rounded-lg cursor-pointer bg-white text-sm text-slate-600 hover:bg-slate-50"
          >
            <Upload className="h-4 w-4 mr-2 text-electric-blue" />
            <span>{resolutionProof ? resolutionProof.name : "Choose file"}</span>
            <input type="file" id="resolution-proof" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        <div className="rounded-lg border border-slate-200 p-3 space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <Cable className="h-3.5 w-3.5" /> Wire used (optional)
          </p>
          <select
            value={wireItemId}
            onChange={(e) => setWireItemId(e.target.value)}
            className="w-full h-9 px-2 text-xs border border-slate-200 rounded-lg"
          >
            <option value="">No wire</option>
            {wireItems.map((w) => (
              <option key={w.id} value={w.id}>
                {w.item_type} · stock {w.quantity} · Rs {w.unit_price.toLocaleString()}
              </option>
            ))}
          </select>
          {wireItemId ? (
            <input
              type="number"
              min={1}
              value={wireQty}
              onChange={(e) => setWireQty(e.target.value)}
              placeholder="Quantity"
              className="w-full h-9 px-2 text-xs border border-slate-200 rounded-lg"
            />
          ) : null}
        </div>

        <div className="rounded-lg border border-slate-200 p-3 space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <Package className="h-3.5 w-3.5" /> Other inventory (optional)
          </p>
          <select
            value={otherItemId}
            onChange={(e) => setOtherItemId(e.target.value)}
            className="w-full h-9 px-2 text-xs border border-slate-200 rounded-lg"
          >
            <option value="">None</option>
            {warehouseItems.map((w) => (
              <option key={w.id} value={w.id}>
                {w.item_type} · stock {w.quantity} · Rs {w.unit_price.toLocaleString()}
              </option>
            ))}
          </select>
          {otherItemId ? (
            <input
              type="number"
              min={1}
              value={otherQty}
              onChange={(e) => setOtherQty(e.target.value)}
              className="w-full h-9 px-2 text-xs border border-slate-200 rounded-lg"
            />
          ) : null}
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-deep-ocean">
            <Banknote className="h-3.5 w-3.5" /> Cash received (optional)
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={cashAmount}
            onChange={(e) => setCashAmount(e.target.value)}
            placeholder="0"
            className="mt-1 w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="h-9 px-4 bg-white text-slate-600 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!notes.trim()}
          className="h-9 px-4 bg-electric-blue text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          Resolve Complaint
        </button>
      </div>
    </Modal>
  )
}
