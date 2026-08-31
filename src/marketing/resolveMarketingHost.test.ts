import { resolveMarketingHost } from "./resolveMarketingHost"

describe("resolveMarketingHost", () => {
  beforeEach(() => window.sessionStorage.clear())

  it("resolves every production hostname through company host configuration", () => {
    expect(resolveMarketingHost("nexus.mbanet.com.pk", "")).toBe("nexus.mbanet.com.pk")
    expect(resolveMarketingHost("new-vendor.example.pk", "")).toBe("new-vendor.example.pk")
  })

  it("treats ConnectX as a vendor website host", () => {
    expect(resolveMarketingHost("connectx.mbanet.com.pk", "")).toBe("connectx.mbanet.com.pk")
  })

  it("retains a local vendor preview across navigation and reload", () => {
    expect(resolveMarketingHost("localhost", "?site=fastnet.mbanet.com.pk")).toBe("fastnet.mbanet.com.pk")
    expect(resolveMarketingHost("localhost", "")).toBe("fastnet.mbanet.com.pk")
  })

  it("normalizes a full URL supplied as the local preview host", () => {
    expect(resolveMarketingHost("localhost", "?site=https%3A%2F%2FFastNet.MBANet.com.pk%2Fplans"))
      .toBe("fastnet.mbanet.com.pk")
  })
})
