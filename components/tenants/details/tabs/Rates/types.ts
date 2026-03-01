export type Service = {
  id: string;
  name: string;
  default_amount: number;
  default_frequency: string;
};

export type TenantService = {
  id: string;
  service_id: string;
  amount: number;
  quantity: number;
  frequency: string;
  is_active: boolean;
  due_date: string | null;
  services: {
    name: string;
  } | null;
};

export {};