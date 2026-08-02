export interface Customer {
  id: string;
  internet_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_1: string;
  phone_2: string | null;
  area: string | null; // API might return string name or null
  area_id?: string;
  installation_address: string;
  service_plan: string | null;
  service_plan_id?: string;
  isp: string | null;
  connection_type: string;
  status: string; // 'active', 'inactive', 'suspended', etc.
  is_active: boolean;
  cnic: string;
  created_at?: string;
  current_balance?: number; // Optional, might be in a separate ledger call
  // Add other fields as needed based on models.py
}

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  area_id?: string;
  service_plan_id?: string;
}

export interface CustomerListResponse {
  data: Customer[];
  total: number;
  page: number;
  pages: number;
}
