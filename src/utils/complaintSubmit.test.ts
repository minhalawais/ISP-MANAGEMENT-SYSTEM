import { buildComplaintFormData, buildComplaintJsonPayload, getComplaintAttachmentFile } from "./complaintSubmit.ts"

const sampleForm = {
  id: "comp-1",
  ticket_number: "TCK-1001",
  customer_id: "cust-1",
  customer_name: "Minhal Awais",
  assigned_to: "emp-9",
  assigned_to_name: "Rubas Sajid",
  description: "No internet",
  category: "no_internet",
  status: "open",
  remarks: null,
  attachment_path: "/uploads/shot.png",
  attachment: "/uploads/shot.png",
  extra_object: { nested: true },
}

describe("complaintSubmit", () => {
  it("builds a JSON payload with only writable scalars", () => {
    expect(buildComplaintJsonPayload(sampleForm)).toEqual({
      customer_id: "cust-1",
      assigned_to: "emp-9",
      description: "No internet",
      category: "no_internet",
      status: "open",
    })
  })

  it("does not treat an existing attachment path as a new file", () => {
    expect(getComplaintAttachmentFile(sampleForm)).toBeNull()
  })

  it("includes a newly selected file in FormData", () => {
    const file = new File(["proof"], "proof.png", { type: "image/png" })
    const body = buildComplaintFormData({ ...sampleForm, attachment: file, assigned_to: "emp-2" })

    expect(body.get("assigned_to")).toBe("emp-2")
    expect(body.get("attachment")).toBeInstanceOf(File)
    expect((body.get("attachment") as File).name).toBe("proof.png")
    expect(body.get("customer_name")).toBeNull()
  })
})
