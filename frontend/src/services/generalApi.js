import api from './api';

// General Students
export const getGeneralStudents = (params) => api.get('/api/general/students', { params });
export const createGeneralStudent = (data) => api.post('/api/general/students', data);
export const updateGeneralStudent = (id, data) => api.put(`/api/general/students/${id}`, data);
export const deleteGeneralStudent = (id) => api.delete(`/api/general/students/${id}`);
export const bulkUploadGeneralStudents = (rows) => api.post('/api/general/students/bulk-upload', { rows });

// Scholarships
export const getScholarships = (params) => api.get('/api/general/scholarships', { params });
export const createScholarship = (data) => api.post('/api/general/scholarships', data);
export const updateScholarship = (id, data) => api.put(`/api/general/scholarships/${id}`, data);
export const deleteScholarship = (id) => api.delete(`/api/general/scholarships/${id}`);

// Bank Loans
export const getBankLoans = (params) => api.get('/api/general/bank-loans', { params });
export const createBankLoan = (data) => api.post('/api/general/bank-loans', data);
export const updateBankLoan = (id, data) => api.put(`/api/general/bank-loans/${id}`, data);
export const deleteBankLoan = (id) => api.delete(`/api/general/bank-loans/${id}`);
