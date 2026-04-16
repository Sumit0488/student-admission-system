import api from './api';

// Accounts
export const getAccounts = () => api.get('/api/accounts');
export const createAccount = (data) => api.post('/api/accounts', data);
export const updateAccount = (id, data) => api.put(`/api/accounts/${id}`, data);
export const deleteAccount = (id) => api.delete(`/api/accounts/${id}`);

// Fee Heads
export const getFeeHeads = (params) => api.get('/api/fee/heads', { params });
export const createFeeHead = (data) => api.post('/api/fee/heads', data);
export const updateFeeHead = (id, data) => api.put(`/api/fee/heads/${id}`, data);
export const deleteFeeHead = (id) => api.delete(`/api/fee/heads/${id}`);

// Fee Categories
export const getFeeCategories = (params) => api.get('/api/fee/categories', { params });
export const createFeeCategory = (data) => api.post('/api/fee/categories', data);
export const updateFeeCategory = (id, data) => api.put(`/api/fee/categories/${id}`, data);

// Fee Structures
export const getFeeStructures = (params) => api.get('/api/fee/structures', { params });
export const createFeeStructure = (data) => api.post('/api/fee/structures', data);

// Fee Schedules
export const getFeeSchedules = (params) => api.get('/api/fee/schedules', { params });
export const createFeeSchedule = (data) => api.post('/api/fee/schedules', data);
export const updateFeeSchedule = (id, data) => api.put(`/api/fee/schedules/${id}`, data);
export const getFeeScheduleById = (id) => api.get(`/api/fee/schedules/${id}`);
export const getFeeScheduleStats = (id) => api.get(`/api/fee/schedules/${id}/stats`);
export const patchFeeScheduleStatus = (id, status) => api.patch(`/api/fee/schedules/${id}/status`, { status });
export const createOrdersFromFeeStructure = (id) => api.post(`/api/fee/schedules/${id}/create-orders`);
export const bulkUploadOrders = (id, rows) => api.post(`/api/fee/schedules/${id}/bulk-upload-orders`, { rows });
export const getFeeOrdersBySchedule = (id, params) => api.get(`/api/fee/orders`, { params: { fee_schedule_id: id, ...params } });
export const getFeeStructuresBySchedule = (id, params) => api.get(`/api/fee/structures`, { params });

// Fee Orders
export const getFeeOrders = (params) => api.get('/api/fee/orders', { params });
export const createFeeOrder = (data) => api.post('/api/fee/orders', data);
export const updateFeeOrder = (id, data) => api.put(`/api/fee/orders/${id}`, data);
export const collectFeePayment = (orderId, data) => api.post(`/api/fee/orders/${orderId}/collect`, data);

// Fee Transactions
export const getFeeTransactions = (params) => api.get('/api/fee/transactions', { params });
export const getFeeTransactionsByOrderIds = (orderIds, params) =>
  api.get('/api/fee/transactions', { params: { order_ids: orderIds.join(','), limit: 2000, ...params } });
export const getFeeTransactionStats = () => api.get('/api/fee/transactions/stats');
export const createFeeTransaction = (data) => api.post('/api/fee/transactions', data);
export const bulkUploadPayments = (rows) => api.post('/api/fee/transactions/bulk-upload', { rows });

// Pay Records
export const getPayRecords = (params) => api.get('/api/fee/pay-records', { params });
export const createPayRecord = (data) => api.post('/api/fee/pay-records', data);
export const updatePayRecord = (id, data) => api.put(`/api/fee/pay-records/${id}`, data);
export const deletePayRecord = (id) => api.delete(`/api/fee/pay-records/${id}`);

// Fee Refunds
export const getFeeRefunds = (params) => api.get('/api/fee/refunds', { params });
export const createFeeRefund = (data) => api.post('/api/fee/refunds', data);
