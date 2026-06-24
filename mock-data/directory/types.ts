export type MockCustomerSourceType =
  | "meta"
  | "google"
  | "referral"
  | "seo"
  | "word-of-mouth"
  | "none";

export type MockCustomerSource = {
  type: MockCustomerSourceType;
  label: string;
};

export type MockCustomerRow = {
  _id: string;
  customerID: string;
  name: string;
  subtitle?: string;
  customerType?: "individual" | "corporate";
  source: MockCustomerSource;
  tier: number;
  owner: string;
  dateCreated: string;
  createdAt?: string;
  actions: string;
};

export type MockTravellerRow = {
  _id: string;
  travellerID: string;
  name: string;
  subtitle?: string;
  source: MockCustomerSource;
  tier: number;
  owner: string;
  dateCreated: string;
  createdAt?: string;
  actions: string;
};

export type MockVendorRow = {
  _id: string;
  vendorID: string;
  name: string;
  subtitle?: string;
  source: MockCustomerSource;
  tier: number;
  dateModified: string;
  createdAt?: string;
  actions: string;
};

export type MockBookingHistoryRow = {
  _id: string;
  customId: string;
  quotationType: string;
  travelDate: string;
  status: string;
  totalAmount: number;
  taskCount: number;
  secondaryStatus?: string;
  exploreTag?: string;
  vendorId?: string;
};
