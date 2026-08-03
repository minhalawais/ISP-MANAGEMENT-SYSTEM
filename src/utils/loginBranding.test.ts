import { getLoginBrandForHostname } from "./loginBranding.ts"

describe("login branding", () => {
  it("uses ConnectX branding only on the exact ConnectX hostname", () => {
    expect(getLoginBrandForHostname("connectx.mbanet.com.pk")).toBe("connectx")
    expect(getLoginBrandForHostname("CONNECTX.MBANET.COM.PK")).toBe("connectx")
  })

  it("uses Nexus branding for nexus and all other hostnames", () => {
    expect(getLoginBrandForHostname("nexus.mbanet.com.pk")).toBe("nexus")
    expect(getLoginBrandForHostname("localhost")).toBe("nexus")
    expect(getLoginBrandForHostname("not-connectx.mbanet.com.pk")).toBe("nexus")
  })
})
