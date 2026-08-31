import { render, screen, waitFor } from "@testing-library/react"
import CustomerPortalPage from "../../pages/CustomerPortalPage.tsx"
import customerPortalAxios from "../../utils/customerPortalAxios.ts"

jest.mock("../../utils/customerPortalAxios.ts", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}))

jest.mock("../../utils/customerPortalAuth.ts", () => ({
  getCustomerPortalToken: () => "token",
  setCustomerPortalToken: jest.fn(),
  removeCustomerPortalToken: jest.fn(),
  getCustomerPortalMustChangePassword: () => false,
  setCustomerPortalPendingPassword: jest.fn(),
  getCustomerPortalPendingPassword: () => null,
  clearCustomerPortalPendingPassword: jest.fn(),
}))

jest.mock("../../components/DomainLoginLogo.tsx", () => ({
  DomainLoginLogo: () => <div data-testid="logo">Logo</div>,
}))

jest.mock("../../components/customer-portal/CustomerPortalComplaintDetailModal.tsx", () => ({
  CustomerPortalComplaintDetailModal: () => null,
}))

jest.mock("react-leaflet", () => ({
  MapContainer: ({ children }: any) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  useMap: () => ({ setView: jest.fn(), addControl: jest.fn(), removeControl: jest.fn(), getZoom: () => 12 }),
  useMapEvents: () => null,
}))

jest.mock("leaflet-geosearch", () => ({
  GeoSearchControl: jest.fn(),
  OpenStreetMapProvider: jest.fn(),
}))

const mockedAxios = customerPortalAxios as jest.Mocked<typeof customerPortalAxios>

const profilePayload = {
  customer: {
    id: "c1",
    name: "Minhal Awais",
    email: "a@b.com",
    internet_id: "minhal106-nt",
    phone_1: "923120614727",
    phone_2: null,
    cnic: "3810337484753",
    installation_address: "106-A New Town",
    gps_coordinates: null,
    area: "New Town",
    sub_zone: "New Town",
    isp: "National Broadband",
    connection_type: "internet",
    installation_date: "2026-07-05",
    is_active: true,
    recharge_date: null,
  },
  packages: [{ name: "20 Mbps", price: 2500, speed_mbps: 20, start_date: null }],
  invoices: [],
  payments: [],
  complaints: [],
  summary: {
    total_due: 125,
    total_paid: 12650,
    invoice_count: 4,
    payment_count: 3,
    open_complaints: 0,
  },
}

describe("CustomerPortalPage redesign", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockResolvedValue({ data: profilePayload })
  })

  it("renders portal shell KPIs and edit control without cream palette chrome", async () => {
    render(<CustomerPortalPage />)

    await waitFor(() => expect(screen.getByText("Customer portal")).toBeInTheDocument())
    expect(screen.getByText("Total due")).toBeInTheDocument()
    expect(screen.getByText("Lodge complaint")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument()
    expect(screen.getByText("Active packages")).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /Overview/i })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /Invoices/i })).toBeInTheDocument()
    expect(screen.queryByText("Secure Access")).not.toBeInTheDocument()
  })
})
