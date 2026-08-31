import {
  EMPTY_WHATSAPP_AUDIENCE_FILTERS,
  filterWhatsAppAudience,
  WhatsAppAudienceCustomer,
} from './whatsappBulkAudience';

const customers: WhatsAppAudienceCustomer[] = [
  {
    id: '1', first_name: 'Ali', last_name: 'Raza', internet_id: 'NET-1', phone_1: '03001111111',
    area_id: 'lahore', area_name: 'Lahore', sub_area_id: 'sabzazar', sub_area_name: 'Sabzazar',
    isp_id: 'isp-1', isp_name: 'Local Net', connection_type: 'fiber',
    packages: [{ id: 'plan-20', name: '20 Mbps Fiber' }],
  },
  {
    id: '2', first_name: 'Sara', last_name: 'Khan', internet_id: 'NET-2', phone_1: '03002222222',
    area_id: 'lahore', area_name: 'Lahore', sub_area_id: 'iqbal-town', sub_area_name: 'Iqbal Town',
    isp_id: 'isp-1', isp_name: 'Local Net', connection_type: 'wireless',
    packages: [{ id: 'plan-10', name: '10 Mbps Wireless' }],
  },
  {
    id: '3', first_name: 'Usman', last_name: 'Ahmed', internet_id: 'NET-3', phone_1: '03003333333',
    area_id: 'kasur', area_name: 'Kasur', sub_area_id: null, sub_area_name: null,
    isp_id: 'isp-2', isp_name: 'Partner Net', connection_type: 'fiber',
    packages: [{ id: 'plan-20', name: '20 Mbps Fiber' }],
  },
];

describe('filterWhatsAppAudience', () => {
  it('ANDs filter groups and ORs values within one group', () => {
    const result = filterWhatsAppAudience(customers, {
      ...EMPTY_WHATSAPP_AUDIENCE_FILTERS,
      areaIds: ['lahore', 'kasur'],
      connectionTypes: ['fiber'],
      planIds: ['plan-20'],
    }, '');

    expect(result.map((customer) => customer.id)).toEqual(['1', '3']);
  });

  it('searches customer, location, package, phone, and internet ID fields', () => {
    expect(filterWhatsAppAudience(customers, EMPTY_WHATSAPP_AUDIENCE_FILTERS, 'iqbal')).toHaveLength(1);
    expect(filterWhatsAppAudience(customers, EMPTY_WHATSAPP_AUDIENCE_FILTERS, 'NET-3')[0].id).toBe('3');
    expect(filterWhatsAppAudience(customers, EMPTY_WHATSAPP_AUDIENCE_FILTERS, '0300111')[0].id).toBe('1');
  });
});
