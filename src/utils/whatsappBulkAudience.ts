export interface WhatsAppAudiencePackage {
  id: string;
  name: string;
}

export interface WhatsAppAudienceCustomer {
  id: string;
  first_name: string;
  last_name: string;
  internet_id: string;
  phone_1: string;
  area_id: string | null;
  area_name: string | null;
  sub_area_id: string | null;
  sub_area_name: string | null;
  isp_id: string | null;
  isp_name: string | null;
  connection_type: string | null;
  packages: WhatsAppAudiencePackage[];
}

export interface WhatsAppAudienceFilters {
  areaIds: string[];
  subAreaIds: string[];
  planIds: string[];
  ispIds: string[];
  connectionTypes: string[];
}

export const EMPTY_WHATSAPP_AUDIENCE_FILTERS: WhatsAppAudienceFilters = {
  areaIds: [],
  subAreaIds: [],
  planIds: [],
  ispIds: [],
  connectionTypes: [],
};

const includesValue = (selected: string[], value: string | null) =>
  selected.length === 0 || (value !== null && selected.includes(value));

export const filterWhatsAppAudience = (
  customers: WhatsAppAudienceCustomer[],
  filters: WhatsAppAudienceFilters,
  searchQuery: string,
) => {
  const query = searchQuery.trim().toLowerCase();

  return customers.filter((customer) => {
    const searchable = [
      customer.first_name,
      customer.last_name,
      customer.internet_id,
      customer.phone_1,
      customer.area_name,
      customer.sub_area_name,
      customer.isp_name,
      ...customer.packages.map((item) => item.name),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return (
      (!query || searchable.includes(query)) &&
      includesValue(filters.areaIds, customer.area_id) &&
      includesValue(filters.subAreaIds, customer.sub_area_id) &&
      includesValue(filters.ispIds, customer.isp_id) &&
      includesValue(filters.connectionTypes, customer.connection_type) &&
      (filters.planIds.length === 0 ||
        customer.packages.some((item) => filters.planIds.includes(item.id)))
    );
  });
};

export const countActiveAudienceFilters = (filters: WhatsAppAudienceFilters) =>
  Object.values(filters).reduce((total, values) => total + values.length, 0);

