import React, { createContext, useContext, useState, useEffect } from 'react';
import type { 
  Tenant, Transaction, Invoice, Employee, InventoryItem, 
  PurchaseOrder, AuditLog, ErpProject, NotificationLog, LeaveRequest, ErpTask
} from '../types';


interface ErpContextProps {
  activeTenant: Tenant;
  tenants: Tenant[];
  setTenant: (id: string) => void;
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'status' | 'date'>) => Promise<void>;
  invoices: Invoice[];
  processOcrInvoice: (file: File) => Promise<void>;
  payInvoice: (id: string) => Promise<void>;
  employees: Employee[];
  runPayroll: (period: string) => Promise<void>;
  updateLeave: (reqId: string, empId: string, days: number, approve: boolean) => Promise<void>;
  updateEmployee: (id: string, updatedFields: Partial<Employee>) => Promise<void>;
  leaveRequests: LeaveRequest[];
  applyForLeave: (days: number, startDate: string, reason: string) => Promise<void>;
  isAdmin: boolean;
  isManager: boolean;
  isEmployee: boolean;
  inventory: InventoryItem[];
  purchaseOrders: PurchaseOrder[];
  createPO: (po: Omit<PurchaseOrder, 'id' | 'status' | 'date'>) => Promise<void>;
  deliverPO: (id: string) => Promise<void>;
  projects: ErpProject[];
  updateProjectTask: (projId: string, taskId: string, progress: number, status: 'Todo' | 'In Progress' | 'Done') => Promise<void>;
  updateProject: (id: string, updatedFields: Partial<ErpProject>) => Promise<void>;
  addProjectTask: (projId: string, task: Omit<ErpTask, 'id' | 'progress' | 'status'>) => Promise<void>;
  auditLogs: AuditLog[];
  verifyAuditTrail: () => Promise<boolean>;
  notifications: NotificationLog[];
  triggerNotification: (type: NotificationLog['type'], recipient: string, message: string) => Promise<void>;
  apiHistory: { timestamp: string; method: string; url: string; status: number; duration: number }[];
  logApiCall: (method: string, url: string, status: number, duration: number) => void;
  currentUser: { name: string; email: string; tenantId: string } | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, tenantId: string) => Promise<boolean>;
  logout: () => void;
  usersList: { name: string; email: string; tenantId: string }[];
  fetchUsersList: () => Promise<void>;
  adminCreateUser: (name: string, email: string, password: string, tenantId: string) => Promise<boolean>;
  adminDeleteUser: (email: string) => Promise<boolean>;
}

const ErpContext = createContext<ErpContextProps | undefined>(undefined);

// Web Crypto SHA-256 function
async function computeHash(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const ErpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Tenants Setup
  const tenants: Tenant[] = [
    { id: 't-amdox', name: 'Amdox Technologies', provider: 'Keycloak', mfaEnabled: true, domain: 'amdox.io' },
    { id: 't-apex', name: 'Apex Logistics Inc.', provider: 'Azure AD', mfaEnabled: true, domain: 'apexlogistics.com' },
    { id: 't-google', name: 'Global Retail Corp', provider: 'Google Workspace', mfaEnabled: true, domain: 'globalretail.com' }
  ];
  const [activeTenant, setActiveTenant] = useState<Tenant>(tenants[0]);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; tenantId: string } | null>(() => {
    const saved = localStorage.getItem('amx_user');
    return saved ? JSON.parse(saved) : null;
  });

  const isLoadingRef = React.useRef(true);
  const lastHashRef = React.useRef('0000000000000000000000000000000000000000000000000000000000000000');
  const auditLogQueueRef = React.useRef<Promise<void>>(Promise.resolve());

  const getApiUrl = () => {
    const envUrl = (import.meta as any).env?.VITE_API_URL;
    return envUrl || 'http://localhost:4005';
  };

  const loadTenantState = async (tenantId: string) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/v1/data/${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.status !== 'empty') {
          if (data.transactions) setTransactions(data.transactions);
          if (data.invoices) setInvoices(data.invoices);
          if (data.employees) setEmployees(data.employees);
          if (data.inventory) setInventory(data.inventory);
          if (data.purchaseOrders) setPurchaseOrders(data.purchaseOrders);
          if (data.projects) setProjects(data.projects);
          if (data.auditLogs) {
            setAuditLogs(data.auditLogs);
            const lastLog = data.auditLogs[data.auditLogs.length - 1];
            lastHashRef.current = lastLog ? lastLog.hash : '0000000000000000000000000000000000000000000000000000000000000000';
          } else {
            lastHashRef.current = '0000000000000000000000000000000000000000000000000000000000000000';
          }
          if (data.leaveRequests) setLeaveRequests(data.leaveRequests);
          if (data.notifications) setNotifications(data.notifications);
          console.log(`ERP state loaded from database for tenant: ${tenantId}`);
          return true;
        }
      }
    } catch (err) {
      console.error('Failed to load state from SQLite database:', err);
    }
    return false;
  };

  const saveTenantState = async (tenantId: string, customState?: any) => {
    try {
      const stateToSave = customState || {
        transactions,
        invoices,
        employees,
        inventory,
        purchaseOrders,
        projects,
        auditLogs,
        notifications,
        leaveRequests
      };

      await fetch(`${getApiUrl()}/api/v1/data/${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stateToSave)
      });
      console.log(`ERP state persisted to SQLite database for tenant: ${tenantId}`);
    } catch (err) {
      console.error('Failed to persist ERP state:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      const tenant = tenants.find(t => t.id === currentUser.tenantId);
      if (tenant) {
        setActiveTenant(tenant);
      }
    }
  }, [currentUser]);

  // 2. State definition
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [projects, setProjects] = useState<ErpProject[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [apiHistory, setApiHistory] = useState<{ timestamp: string; method: string; url: string; status: number; duration: number }[]>([]);

  // Helpers
  const logApiCall = (method: string, url: string, status: number, duration: number) => {
    setApiHistory(prev => [{
      timestamp: new Date().toLocaleTimeString(),
      method, url, status, duration
    }, ...prev].slice(0, 50));
  };


  const addAuditLog = (action: string, module: string, details: string): Promise<void> => {
    const newPromise = auditLogQueueRef.current.then(async () => {
      const timestamp = new Date().toISOString();
      const userId = "usr-042";
      const id = `audit-${Math.random().toString(36).substr(2, 9)}`;
      const prevHash = lastHashRef.current;
      const blockString = `${id}|${timestamp}|${userId}|${action}|${module}|${details}|${activeTenant.id}|${prevHash}`;
      const hash = await computeHash(blockString);

      lastHashRef.current = hash;

      const newLog: AuditLog = {
        id, timestamp, userId, action, module, details, tenantId: activeTenant.id, hash, prevHash
      };
      setAuditLogs(prev => [...prev, newLog]);
    });

    auditLogQueueRef.current = newPromise;
    return newPromise;
  };

  // Load or Seed Initial Data
  useEffect(() => {
    const initializeData = async () => {
      isLoadingRef.current = true;
      const loaded = await loadTenantState(activeTenant.id);

      if (!loaded) {
        console.log(`Seeding initial data for tenant: ${activeTenant.id}`);
        // 1. Transactions
        const initialTx: Transaction[] = [
          {
            id: 'tx-1001',
            date: '2026-06-15',
            description: 'Initial Equity Funding',
            ref: 'JE-001',
            currency: 'USD',
            exchangeRate: 1.0,
            status: 'Posted',
            debits: [{ account: 'Cash & Cash Equivalents', amount: 500000 }],
            credits: [{ account: 'Common Stock Capital', amount: 500000 }]
          },
          {
            id: 'tx-1002',
            date: '2026-06-16',
            description: 'SaaS Software Subscriptions Expense',
            ref: 'JE-002',
            currency: 'USD',
            exchangeRate: 1.0,
            status: 'Posted',
            debits: [{ account: 'IT & Cloud Infrastructure Expense', amount: 15000 }],
            credits: [{ account: 'Accounts Payable', amount: 15000 }]
          },
          {
            id: 'tx-1003',
            date: '2026-06-18',
            description: 'Office Lease Deposit Payment',
            ref: 'JE-003',
            currency: 'EUR',
            exchangeRate: 1.08,
            status: 'Posted',
            debits: [{ account: 'Prepaid Expenses', amount: 8000 }],
            credits: [{ account: 'Cash & Cash Equivalents', amount: 8000 }]
          }
        ];

        // Build audit logs from initial transactions
        let chain: AuditLog[] = [];
        let prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
        
        for (let i = 0; i < initialTx.length; i++) {
          const tx = initialTx[i];
          const id = `audit-tx-${i}`;
          const timestamp = new Date(tx.date).toISOString();
          const details = `Journal Entry ref: ${tx.ref} of amount ${tx.debits[0].amount} ${tx.currency}`;
          const action = `Post Transaction ${tx.id}`;
          const block = `${id}|${timestamp}|usr-system|${action}|Finance|${details}|t-amdox|${prevHash}`;
          const hash = await computeHash(block);
          
          chain.push({
            id,
            timestamp,
            userId: 'usr-system',
            action,
            module: 'Finance',
            details,
            tenantId: 't-amdox',
            hash,
            prevHash
          });
          prevHash = hash;
        }

        setTransactions(initialTx);
        setAuditLogs(chain);

        // Invoices
        const initialInvoices: Invoice[] = [
          {
            id: 'inv-401',
            vendorName: 'AWS Enterprise Cloud',
            invoiceNumber: 'AWS-2026-9872',
            date: '2026-06-10',
            amount: 12450.00,
            currency: 'USD',
            status: 'Match_Success',
            ocrData: { vendorConfidence: 99.8, amountConfidence: 98.4, dateConfidence: 99.1 },
            threeWayMatch: { poId: 'PO-301', poMatched: true, receiptId: 'REC-202', receiptMatched: true, priceMatched: true }
          },
          {
            id: 'inv-402',
            vendorName: 'Global Office Supplies',
            invoiceNumber: 'GOS-6512',
            date: '2026-06-14',
            amount: 850.00,
            currency: 'USD',
            status: 'Pending',
            ocrData: { vendorConfidence: 94.2, amountConfidence: 91.5, dateConfidence: 89.2 },
            threeWayMatch: { poId: 'PO-304', poMatched: true, receiptId: 'REC-205', receiptMatched: false, priceMatched: true }
          },
          {
            id: 'inv-403',
            vendorName: 'Fastrack Courier Logistics',
            invoiceNumber: 'FCL-778',
            date: '2026-06-19',
            amount: 2200.00,
            currency: 'EUR',
            status: 'Match_Failed',
            ocrData: { vendorConfidence: 88.0, amountConfidence: 95.0, dateConfidence: 74.0 },
            threeWayMatch: { poId: 'PO-302', poMatched: true, receiptId: 'REC-203', receiptMatched: true, priceMatched: false }
          }
        ];
        setInvoices(initialInvoices);

        // Employees
        const initialEmployees: Employee[] = [
          {
            id: 'emp-101',
            name: 'Rohith Raj',
            email: 'rajuchaswik@gmail.com',
            role: 'Principal Engineer',
            department: 'Product Development',
            salary: 145000,
            leaveBalance: 18,
            status: 'Active',
            payrollHistory: [
              { period: 'May 2026', netPay: 9280, tax: 1820, deductions: 980, status: 'Processed' }
            ]
          },
          {
            id: 'emp-102',
            name: 'Himanshu Devatwal',
            email: 'himanshudevatwal@gmail.com',
            role: 'Financial Director',
            department: 'Finance',
            salary: 155000,
            leaveBalance: 20,
            status: 'Active',
            payrollHistory: [
              { period: 'May 2026', netPay: 9920, tax: 1950, deductions: 1020, status: 'Processed' }
            ]
          },
          {
            id: 'emp-103',
            name: 'Rutvee Bhut',
            email: 'rutveeb.15@gmail.com',
            role: 'Supply Chain Specialist',
            department: 'Procurement',
            salary: 95000,
            leaveBalance: 15,
            status: 'Active',
            payrollHistory: []
          },
          {
            id: 'emp-104',
            name: 'Radhey Mohan',
            email: 'rmpatidar98@gmail.com',
            role: 'AI / ML Engineer',
            department: 'R&D',
            salary: 130000,
            leaveBalance: 22,
            status: 'Active',
            payrollHistory: []
          }
        ];
        setEmployees(initialEmployees);

        // Inventory
        const initialInventory: InventoryItem[] = [
          { id: 'inv-1', name: 'Optic Fiber Transceiver 10G', sku: 'OPT-10G-LR', category: 'Hardware', quantity: 145, minStockLevel: 50, reorderQuantity: 200, unitPrice: 85.00, supplier: 'Cisco Systems', status: 'In Stock' },
          { id: 'inv-2', name: 'Kubernetes Master Node Servers', sku: 'SRV-DL360-G11', category: 'Servers', quantity: 8, minStockLevel: 10, reorderQuantity: 15, unitPrice: 4200.00, supplier: 'HPE', status: 'Low Stock' },
          { id: 'inv-3', name: 'Encrypted Hardware Security Module', sku: 'HSM-AES256-Y', category: 'Security', quantity: 0, minStockLevel: 5, reorderQuantity: 10, unitPrice: 8900.00, supplier: 'Yubico', status: 'Out of Stock' },
          { id: 'inv-4', name: 'Developer Workstations Pro', sku: 'WORK-W11-X86', category: 'Hardware', quantity: 65, minStockLevel: 20, reorderQuantity: 50, unitPrice: 2100.00, supplier: 'Lenovo Inc', status: 'In Stock' }
        ];
        setInventory(initialInventory);

        // Purchase Orders
        const initialPOs: PurchaseOrder[] = [
          {
            id: 'PO-301',
            poNumber: 'PO-2026-0001',
            vendorName: 'AWS Enterprise Cloud',
            date: '2026-06-01',
            amount: 12450.00,
            status: 'Approved',
            items: [{ name: 'Cloud Infrastructure Hosting', qty: 1, unitPrice: 12450.00 }]
          },
          {
            id: 'PO-302',
            poNumber: 'PO-2026-0002',
            vendorName: 'Fastrack Courier Logistics',
            date: '2026-06-02',
            amount: 2500.00,
            status: 'Sent',
            items: [{ name: 'International Freight Shipping Services', qty: 1, unitPrice: 2500.00 }]
          },
          {
            id: 'PO-304',
            poNumber: 'PO-2026-0004',
            vendorName: 'Global Office Supplies',
            date: '2026-06-12',
            amount: 850.00,
            status: 'Delivered',
            items: [{ name: 'Office Ergonomic Chairs', qty: 2, unitPrice: 425.00 }]
          }
        ];
        setPurchaseOrders(initialPOs);

        // Projects
        const initialProjects: ErpProject[] = [
          {
            id: 'proj-1',
            name: 'AI Forecast Module Integration',
            code: 'PRJ-2026-FCAST',
            manager: 'Radhey Mohan',
            budget: 75000,
            actualCost: 32000,
            startDate: '2026-06-01',
            endDate: '2026-07-15',
            tasks: [
              { id: 'tsk-101', name: 'Train Prophet Baseline on Historical Sales', assignee: 'Radhey Mohan', startDate: '2026-06-01', endDate: '2026-06-12', progress: 100, status: 'Done' },
              { id: 'tsk-102', name: 'Build LSTM Recurrent Neural Net for Volatility', assignee: 'Aryan Solanki', startDate: '2026-06-10', endDate: '2026-06-25', progress: 75, status: 'In Progress' },
              { id: 'tsk-103', name: 'Integrate API Gateway and ML Flow Pipeline', assignee: 'Bitthal Tejra', startDate: '2026-06-20', endDate: '2026-07-10', progress: 10, status: 'Todo' }
            ]
          },
          {
            id: 'proj-2',
            name: 'SOC 2 Security Audit Alignment',
            code: 'PRJ-2026-SOC2',
            manager: 'Himanshu Devatwal',
            budget: 120000,
            actualCost: 95000,
            startDate: '2026-05-15',
            endDate: '2026-06-30',
            tasks: [
              { id: 'tsk-201', name: 'Setup IAM Rules & Keycloak Multi-Tenant MFA', assignee: 'Rohith Raj', startDate: '2026-05-15', endDate: '2026-05-30', progress: 100, status: 'Done' },
              { id: 'tsk-202', name: 'Enforce Cryptographic Hash-Chain on Ledger Audit Log', assignee: 'Rutvee Bhut', startDate: '2026-06-01', endDate: '2026-06-18', progress: 100, status: 'Done' },
              { id: 'tsk-203', name: 'Compile Evidence Portal for auditors', assignee: 'Bitthal Tejra', startDate: '2026-06-15', endDate: '2026-06-30', progress: 40, status: 'In Progress' }
            ]
          }
        ];
        setProjects(initialProjects);

        // Notifications
        const initialNotifications: NotificationLog[] = [
          { id: 'n-1', timestamp: '2026-06-21T13:42:00.000Z', type: 'In-app', recipient: 'admin@amdox.io', message: 'Low inventory alert: Kubernetes Master Node Servers quantity below threshold.', status: 'Success', attempts: 1 },
          { id: 'n-2', timestamp: '2026-06-21T13:45:00.000Z', type: 'Email', recipient: 'rmpatidar98@gmail.com', message: 'Assigned new task: Build LSTM Recurrent Neural Net.', status: 'Success', attempts: 1 },
          { id: 'n-3', timestamp: '2026-06-21T13:48:00.000Z', type: 'Webhook', recipient: 'https://hooks.amdox.io/erp-sync', message: 'Transaction tx-1003 posted to Ledger.', status: 'Success', attempts: 1 }
        ];
        setNotifications(initialNotifications);

        const initialLeaveRequests: LeaveRequest[] = [
          {
            id: 'req-mock-1',
            empId: 'emp-103',
            empName: 'Rutvee Bhut',
            days: 4,
            reason: 'Annual Family Vacation',
            startDate: '2026-07-02',
            status: 'Pending'
          }
        ];
        setLeaveRequests(initialLeaveRequests);

        lastHashRef.current = prevHash;

        // Persist seed data to database
        const seededState = {
          transactions: initialTx,
          invoices: initialInvoices,
          employees: initialEmployees,
          inventory: initialInventory,
          purchaseOrders: initialPOs,
          projects: initialProjects,
          auditLogs: chain,
          notifications: initialNotifications,
          leaveRequests: initialLeaveRequests
        };
        await saveTenantState(activeTenant.id, seededState);
      }

      setTimeout(() => {
        isLoadingRef.current = false;
      }, 100);
    };

    initializeData();
  }, [activeTenant]);

  // Auto-persist state changes
  useEffect(() => {
    if (isLoadingRef.current) return;

    if (
      transactions.length === 0 &&
      invoices.length === 0 &&
      employees.length === 0 &&
      inventory.length === 0
    ) {
      return;
    }

    const handler = setTimeout(() => {
      saveTenantState(activeTenant.id);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [transactions, invoices, employees, inventory, purchaseOrders, projects, auditLogs, notifications, leaveRequests, activeTenant.id]);

  // Set tenant
  const setTenant = (id: string) => {
    const selected = tenants.find(t => t.id === id);
    if (selected) {
      isLoadingRef.current = true;
      setActiveTenant(selected);
      addAuditLog(`Switched Tenant Context`, `Auth`, `Successfully loaded tenant context for ${selected.name}`);
    }
  };

  // Finance Actions
  const addTransaction = async (tx: Omit<Transaction, 'id' | 'status' | 'date'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Posted'
    };

    setTransactions(prev => [newTx, ...prev]);
    await addAuditLog(`Post Journal Entry`, `Finance`, `Posted JE ${newTx.ref} - ${newTx.description} of ${newTx.debits[0].amount} ${newTx.currency}`);
    await triggerNotification('Webhook', 'https://hooks.amdox.io/ledger-sync', `Journal Entry ${newTx.id} Posted`);
  };

  // AP/AR Actions
  const processOcrInvoice = async (file: File) => {
    // Simulating OCR Processing Delay
    const nameNoExtension = file.name.split('.')[0];
    const mockAmount = Math.floor(Math.random() * 5000) + 150;
    
    // Check PO match
    const matchingPO = purchaseOrders.find(po => po.status === 'Delivered') || purchaseOrders[0];
    
    const newInv: Invoice = {
      id: `inv-${Math.floor(400 + Math.random() * 100)}`,
      vendorName: nameNoExtension.replace(/[-_]/g, ' '),
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      amount: mockAmount,
      currency: 'USD',
      status: 'Pending',
      ocrData: {
        vendorConfidence: Number((90 + Math.random() * 10).toFixed(1)),
        amountConfidence: Number((85 + Math.random() * 14).toFixed(1)),
        dateConfidence: Number((88 + Math.random() * 12).toFixed(1))
      },
      threeWayMatch: {
        poId: matchingPO.id,
        poMatched: true,
        receiptId: `REC-${Math.floor(200 + Math.random() * 100)}`,
        receiptMatched: Math.random() > 0.3,
        priceMatched: mockAmount <= matchingPO.amount + 50
      }
    };

    // Auto update status based on matches
    if (newInv.threeWayMatch.poMatched && newInv.threeWayMatch.receiptMatched && newInv.threeWayMatch.priceMatched) {
      newInv.status = 'Match_Success';
    } else {
      newInv.status = 'Match_Failed';
    }

    setInvoices(prev => [newInv, ...prev]);
    await addAuditLog(`OCR Invoice Scan`, `AP/AR`, `Processed invoice file "${file.name}" via AI OCR parser. Detected ${mockAmount} USD.`);
  };

  const payInvoice = async (id: string) => {
    const inv = invoices.find(item => item.id === id);
    if (!inv) return;

    // Create Double Entry Transaction for payment
    await addTransaction({
      description: `Payment for Invoice ${inv.invoiceNumber}`,
      ref: 'PAY-RUN',
      currency: inv.currency,
      exchangeRate: 1.0,
      debits: [{ account: 'Accounts Payable', amount: inv.amount }],
      credits: [{ account: 'Cash & Cash Equivalents', amount: inv.amount }]
    });

    setInvoices(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: 'Paid' };
      }
      return item;
    }));
    await addAuditLog(`Invoice Disbursement`, `AP/AR`, `Disbursed funds for invoice ${id}`);
  };

  // HR & Payroll Actions
  const runPayroll = async (period: string) => {
    const newTransactionsList: Omit<Transaction, 'id' | 'status' | 'date'>[] = [];
    
    const updatedEmployees = employees.map(emp => {
      if (emp.status === 'Active') {
        const gross = emp.salary / 12;
        const tax = gross * 0.15;
        const deductions = gross * 0.05;
        const netPay = gross - tax - deductions;

        const newPay = {
          period,
          netPay: Number(netPay.toFixed(2)),
          tax: Number(tax.toFixed(2)),
          deductions: Number(deductions.toFixed(2)),
          status: 'Processed' as const
        };

        newTransactionsList.push({
          description: `Payroll Wages Expense - ${emp.name} (${period})`,
          ref: 'PAYROLL',
          currency: 'USD',
          exchangeRate: 1.0,
          debits: [{ account: 'Wages and Salary Expense', amount: Number(gross.toFixed(2)) }],
          credits: [
            { account: 'Payroll Liabilities', amount: Number((tax + deductions).toFixed(2)) },
            { account: 'Cash & Cash Equivalents', amount: Number(netPay.toFixed(2)) }
          ]
        });

        return {
          ...emp,
          payrollHistory: [newPay, ...emp.payrollHistory]
        };
      }
      return emp;
    });

    setEmployees(updatedEmployees);

    for (const tx of newTransactionsList) {
      await addTransaction(tx);
    }

    await addAuditLog(`Execute Payroll Run`, `HR & Payroll`, `Executed monthly payroll ledger run for ${period}`);
    await triggerNotification('Email', 'finance-team@amdox.io', `Payroll run for ${period} executed successfully`);
  };

  const updateLeave = async (reqId: string, empId: string, days: number, approve: boolean) => {
    const emp = employees.find(e => e.id === empId);
    const approvedText = approve ? 'Approved' : 'Rejected';
    await addAuditLog(`Leave Request ${approvedText}`, `HR & Payroll`, `${approvedText} leave request of ${days} days for ${emp ? emp.name : 'Unknown Employee'}`);

    if (approve && emp) {
      setEmployees(prev => prev.map(e => {
        if (e.id === empId) {
          return {
            ...e,
            leaveBalance: e.leaveBalance - days,
            status: 'Leave'
          };
        }
        return e;
      }));
    }

    setLeaveRequests(prev => prev.filter(r => r.id !== reqId));
  };

  const updateEmployee = async (id: string, updatedFields: Partial<Employee>) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === id) {
        return { ...emp, ...updatedFields };
      }
      return emp;
    }));
    // We get the updated employee name from the modified array
    setEmployees(prev => {
      const emp = prev.find(e => e.id === id);
      addAuditLog(`Update Employee Record`, `HR & Payroll`, `Updated employee details for ${emp?.name || id}`);
      return prev;
    });
  };

  const applyForLeave = async (days: number, startDate: string, reason: string) => {
    const loggedInEmployee = employees.find(e => e.email.toLowerCase() === currentUser?.email.toLowerCase());
    
    const newRequest: LeaveRequest = {
      id: `req-${Math.floor(100 + Math.random() * 900)}`,
      empId: loggedInEmployee?.id || 'emp-unknown',
      empName: currentUser?.name || 'Unknown Employee',
      days,
      startDate,
      reason,
      status: 'Pending'
    };

    setLeaveRequests(prev => [...prev, newRequest]);
    await addAuditLog(`Leave Request Applied`, `HR & Payroll`, `${currentUser?.name} applied for ${days} days of leave starting ${startDate}`);
  };

  const isAdmin = currentUser?.email === 'admin@amdox.io';
  
  const loggedInEmployee = employees.find(e => e.email.toLowerCase() === currentUser?.email.toLowerCase());
  const isManager = currentUser?.email === 'himanshudevatwal@gmail.com' || (!!loggedInEmployee && (
    loggedInEmployee.role.toLowerCase().includes('director') || 
    loggedInEmployee.role.toLowerCase().includes('manager') || 
    loggedInEmployee.role.toLowerCase().includes('lead')
  ));
  
  const isEmployee = !isAdmin && !isManager;

  // Supply Chain Actions
  const createPO = async (po: Omit<PurchaseOrder, 'id' | 'status' | 'date'>) => {
    const newPO: PurchaseOrder = {
      ...po,
      id: `PO-${Math.floor(300 + Math.random() * 100)}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Sent'
    };
    setPurchaseOrders(prev => [newPO, ...prev]);
    await addAuditLog(`Generate Purchase Order`, `Supply Chain`, `Created and sent PO ${newPO.poNumber} to ${newPO.vendorName} of value ${newPO.amount} USD`);
  };

  const deliverPO = async (id: string) => {
    const po = purchaseOrders.find(p => p.id === id);
    if (!po) return;

    setInventory(prevInv => prevInv.map(invItem => {
      const matchingItem = po.items.find(item => 
        invItem.name.toLowerCase() === item.name.toLowerCase() || invItem.supplier === po.vendorName
      );
      if (matchingItem) {
        const newQty = invItem.quantity + matchingItem.qty;
        return {
          ...invItem,
          quantity: newQty,
          status: newQty > invItem.minStockLevel ? 'In Stock' : 'Low Stock'
        };
      }
      return invItem;
    }));

    setPurchaseOrders(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: 'Delivered' };
      }
      return item;
    }));

    await addAuditLog(`PO Delivery Received`, `Supply Chain`, `Marked PO ${id} as fully delivered. Automated inventory adjustments complete.`);
  };

  // Project Management Actions
  const updateProjectTask = async (projId: string, taskId: string, progress: number, status: 'Todo' | 'In Progress' | 'Done') => {
    setProjects(prev => prev.map(proj => {
      if (proj.id === projId) {
        const updatedTasks = proj.tasks.map(t => {
          if (t.id === taskId) {
            return { ...t, progress, status };
          }
          return t;
        });

        // Compute total project progress
        const totalProgress = updatedTasks.length > 0 
          ? Math.round(updatedTasks.reduce((acc, t) => acc + t.progress, 0) / updatedTasks.length)
          : 0;

        return {
          ...proj,
          progress: totalProgress,
          tasks: updatedTasks
        };
      }
      return proj;
    }));
    await addAuditLog(`Update Project Task`, `Projects`, `Updated task ${taskId} in project ${projId} to ${progress}% completion`);
  };

  const updateProject = async (id: string, updatedFields: Partial<ErpProject>) => {
    setProjects(prev => prev.map(proj => {
      if (proj.id === id) {
        return { ...proj, ...updatedFields };
      }
      return proj;
    }));
    // Get project name dynamically from final projects state
    setProjects(prev => {
      const proj = prev.find(p => p.id === id);
      addAuditLog(`Update Project Details`, `Projects`, `Updated project details for project ${proj?.name || id}`);
      return prev;
    });
  };

  const addProjectTask = async (projId: string, task: Omit<ErpTask, 'id' | 'progress' | 'status'>) => {
    const newTask: ErpTask = {
      ...task,
      id: `tsk-${Math.floor(100 + Math.random() * 900)}`,
      progress: 0,
      status: 'Todo'
    };
    setProjects(prev => prev.map(proj => {
      if (proj.id === projId) {
        const updatedTasks = [...proj.tasks, newTask];
        const totalProgress = Math.round(updatedTasks.reduce((acc, t) => acc + t.progress, 0) / updatedTasks.length);
        return {
          ...proj,
          progress: totalProgress,
          tasks: updatedTasks
        };
      }
      return proj;
    }));
    await addAuditLog(`Add Project Task`, `Projects`, `Added task "${task.name}" assigned to ${task.assignee}`);
  };

  // Verification of cryptographic integrity of the audit logs
  const verifyAuditTrail = async (): Promise<boolean> => {
    if (auditLogs.length <= 1) return true;
    
    for (let i = 1; i < auditLogs.length; i++) {
      const current = auditLogs[i];
      const prev = auditLogs[i - 1];
      
      // Compute actual previous hash reference
      if (current.prevHash !== prev.hash) {
        console.error(`Audit Trail Break! Discrepancy at block: ${current.id}`);
        return false;
      }
      
      // Re-hash block string
      const blockString = `${current.id}|${current.timestamp}|${current.userId}|${current.action}|${current.module}|${current.details}|${current.tenantId}|${current.prevHash}`;
      const rehash = await computeHash(blockString);
      if (rehash !== current.hash) {
        console.error(`Audit Trail Block Tampered! Block: ${current.id}`);
        return false;
      }
    }
    return true;
  };

  // Notification Trigger
  const triggerNotification = async (type: NotificationLog['type'], recipient: string, message: string) => {
    const newNotif: NotificationLog = {
      id: `n-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
      type, recipient, message, status: 'Success', attempts: 1
    };

    setNotifications(prev => [newNotif, ...prev]);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const start = performance.now();
    try {
      const response = await fetch(`${getApiUrl()}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('amx_user', JSON.stringify(data.user));
      localStorage.setItem('amx_token', data.token);
      setCurrentUser(data.user);

      // Auto-provision employee directory record if not present
      const emailLower = data.user.email.toLowerCase();
      setEmployees(prev => {
        const exists = prev.some(e => e.email.toLowerCase() === emailLower);
        if (!exists && emailLower !== 'admin@amdox.io') {
          return [...prev, {
            id: `emp-${Math.floor(105 + Math.random() * 894)}`,
            name: data.user.name,
            email: data.user.email,
            role: 'Associate',
            department: 'Operations',
            salary: 60000,
            leaveBalance: 20,
            status: 'Active',
            payrollHistory: []
          }];
        }
        return prev;
      });

      logApiCall('POST', '/api/v1/auth/login', 200, Math.round(performance.now() - start));
      return true;
    } catch (err: any) {
      logApiCall('POST', '/api/v1/auth/login', 401, Math.round(performance.now() - start));
      alert(err.message || 'Login failed');
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, tenantId: string): Promise<boolean> => {
    const start = performance.now();
    try {
      const response = await fetch(`${getApiUrl()}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, tenantId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      logApiCall('POST', '/api/v1/auth/register', 201, Math.round(performance.now() - start));
      return true;
    } catch (err: any) {
      logApiCall('POST', '/api/v1/auth/register', 400, Math.round(performance.now() - start));
      alert(err.message || 'Registration failed');
      return false;
    }
  };

  const [usersList, setUsersList] = useState<{ name: string; email: string; tenantId: string }[]>([]);

  const fetchUsersList = async () => {
    const start = performance.now();
    try {
      const response = await fetch(`${getApiUrl()}/api/v1/auth/users`);
      if (response.ok) {
        const data = await response.json();
        setUsersList(data);
        logApiCall('GET', '/api/v1/auth/users', 200, Math.round(performance.now() - start));
      }
    } catch (err) {
      console.error('Failed to fetch users list:', err);
    }
  };

  const adminCreateUser = async (name: string, email: string, password: string, tenantId: string): Promise<boolean> => {
    const start = performance.now();
    try {
      const response = await fetch(`${getApiUrl()}/api/v1/auth/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, tenantId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      // Auto-provision employee record in directory
      const emailLower = email.toLowerCase();
      setEmployees(prev => {
        const exists = prev.some(e => e.email.toLowerCase() === emailLower);
        if (!exists && emailLower !== 'admin@amdox.io') {
          return [...prev, {
            id: `emp-${Math.floor(105 + Math.random() * 894)}`,
            name,
            email,
            role: 'Associate',
            department: 'Operations',
            salary: 60000,
            leaveBalance: 20,
            status: 'Active',
            payrollHistory: []
          }];
        }
        return prev;
      });

      await fetchUsersList();
      logApiCall('POST', '/api/v1/auth/users', 201, Math.round(performance.now() - start));
      return true;
    } catch (err: any) {
      logApiCall('POST', '/api/v1/auth/users', 400, Math.round(performance.now() - start));
      alert(err.message || 'Failed to create user');
      return false;
    }
  };

  const adminDeleteUser = async (email: string): Promise<boolean> => {
    const start = performance.now();
    try {
      const response = await fetch(`${getApiUrl()}/api/v1/auth/users/${email}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      await fetchUsersList();
      logApiCall('DELETE', `/api/v1/auth/users/${email}`, 200, Math.round(performance.now() - start));
      return true;
    } catch (err: any) {
      logApiCall('DELETE', `/api/v1/auth/users/${email}`, 400, Math.round(performance.now() - start));
      alert(err.message || 'Failed to delete user');
      return false;
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUsersList();
    }
  }, [currentUser]);

  const logout = () => {
    localStorage.removeItem('amx_user');
    localStorage.removeItem('amx_token');
    setCurrentUser(null);
  };

  return (
    <ErpContext.Provider value={{
      activeTenant, tenants, setTenant,
      transactions, addTransaction,
      invoices, processOcrInvoice, payInvoice,
      employees, runPayroll, updateLeave, updateEmployee,
      inventory, purchaseOrders, createPO, deliverPO,
      projects, updateProjectTask, updateProject, addProjectTask,
      auditLogs, verifyAuditTrail,
      notifications, triggerNotification,
      apiHistory, logApiCall,
      currentUser, login, register, logout,
      usersList, fetchUsersList, adminCreateUser, adminDeleteUser,
      leaveRequests, applyForLeave, isAdmin, isManager, isEmployee
    }}>
      {children}
    </ErpContext.Provider>
  );
};

export const useErp = () => {
  const context = useContext(ErpContext);
  if (!context) throw new Error('useErp must be used within an ErpProvider');
  return context;
};
