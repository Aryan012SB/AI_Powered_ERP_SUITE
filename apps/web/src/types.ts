export interface Tenant {
  id: string;
  name: string;
  provider: 'Keycloak' | 'Azure AD' | 'Google Workspace' | 'Okta';
  mfaEnabled: boolean;
  domain: string;
}

export interface JournalEntry {
  account: string;
  amount: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  ref: string;
  debits: JournalEntry[];
  credits: JournalEntry[];
  currency: string;
  exchangeRate: number;
  status: 'Draft' | 'Posted' | 'Reconciled';
}

export interface Invoice {
  id: string;
  vendorName: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  currency: string;
  status: 'Pending' | 'Match_Success' | 'Match_Failed' | 'Paid';
  ocrData: {
    vendorConfidence: number;
    amountConfidence: number;
    dateConfidence: number;
  };
  threeWayMatch: {
    poId: string;
    poMatched: boolean;
    receiptId: string;
    receiptMatched: boolean;
    priceMatched: boolean;
  };
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  salary: number;
  leaveBalance: number;
  status: 'Onboarding' | 'Active' | 'Leave' | 'Terminated';
  payrollHistory: {
    period: string;
    netPay: number;
    tax: number;
    deductions: number;
    status: 'Processed' | 'Pending';
  }[];
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minStockLevel: number;
  reorderQuantity: number;
  unitPrice: number;
  supplier: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorName: string;
  date: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Approved' | 'Delivered' | 'Invoiced';
  items: { name: string; qty: number; unitPrice: number }[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  module: string;
  details: string;
  tenantId: string;
  hash: string;
  prevHash: string;
}

export interface ErpTask {
  id: string;
  name: string;
  assignee: string;
  startDate: string;
  endDate: string;
  progress: number; // 0-100
  status: 'Todo' | 'In Progress' | 'Done';
}

export interface ErpProject {
  id: string;
  name: string;
  code: string;
  manager: string;
  budget: number;
  actualCost: number;
  startDate: string;
  endDate: string;
  tasks: ErpTask[];
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  type: 'In-app' | 'Email' | 'SMS' | 'Webhook';
  recipient: string;
  message: string;
  status: 'Success' | 'Failed' | 'Retrying';
  attempts: number;
}
