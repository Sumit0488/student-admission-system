import api from './api';

// Billing Customers
export const getBillingCustomers = (params) => api.get('/api/billing/customers', { params });
export const createBillingCustomer = (data) => api.post('/api/billing/customers', data);
export const updateBillingCustomer = (id, data) => api.put(`/api/billing/customers/${id}`, data);

// Billing Orders
export const getBillingOrders = (params) => api.get('/api/billing/orders', { params });
export const createBillingOrder = (data) => api.post('/api/billing/orders', data);
export const updateBillingOrder = (id, data) => api.put(`/api/billing/orders/${id}`, data);

// Billing Transactions
export const getBillingTransactions = (params) => api.get('/api/billing/transactions', { params });

// Billing Pay Records
export const getBillingPayRecords = (params) => api.get('/api/billing/pay-records', { params });
export const createBillingPayRecord = (data) => api.post('/api/billing/pay-records', data);
