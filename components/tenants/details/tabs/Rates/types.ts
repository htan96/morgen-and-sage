export type Service = {
  id: string;
  name: string;
  default_amount: number;
  default_frequency: string;
};

export type TenantService = {
  id: string;
  amount: number;
  frequency: string;
  quantity: number;
  is_active: boolean;
  services: {
    id: string;
    name: string;
  } | null;
};

export {};