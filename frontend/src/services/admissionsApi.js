import api from './api';

const BASE = '/api';

// ── Enquiry ────────────────────────────────────────────────────────────────────
export const getEnquiries = (params = {}) => api.get(`${BASE}/enquiry`, { params });
export const createEnquiry = (data) => api.post(`${BASE}/enquiry/create`, data);
export const updateEnquiry = (id, data) => api.put(`${BASE}/enquiry/${id}`, data);
export const addFollowUp = (id, data) => api.post(`${BASE}/enquiry/${id}/followup`, data);
export const convertEnquiry = (id, data = {}) => api.post(`${BASE}/enquiry/convert/${id}`, data);
export const deleteEnquiry = (id) => api.delete(`${BASE}/enquiry/${id}`);

// Stage-move helper — maps a UI pipeline stage to the right DB patch
const STAGE_PATCH = {
  Inquiry: { admissionStage: 'Enquiry', status: 'New' },
  Application: { admissionStage: 'Application' },
  Admitted: { admissionStage: 'Admitted' },
  Rejected: { status: 'Rejected' },
  Cancelled: { admissionStage: 'Cancelled' },
};
export const moveEnquiryStage = (id, stage) => api.put(`${BASE}/enquiry/${id}`, STAGE_PATCH[stage]);

// ── Schedules ──────────────────────────────────────────────────────────────────
export const getSchedules = () => api.get(`${BASE}/schedules`);
export const getAdmissionStages = () => api.get(`${BASE}/schedules/stages`);
export const getSchedule = (id) => api.get(`${BASE}/schedules/${id}`);
export const createSchedule = (data) => api.post(`${BASE}/schedules/create`, data);
export const updateSchedule = (id, d) => api.put(`${BASE}/schedules/${id}`, d);
export const deleteSchedule = (id) => api.delete(`${BASE}/schedules/${id}`);

// ── Approvals ──────────────────────────────────────────────────────────────────
export const getApprovals = (params = {}) => api.get(`${BASE}/approvals`, { params });
export const updateApproval = (id, data) => api.put(`${BASE}/approvals/${id}`, data);

// ── Certificates ───────────────────────────────────────────────────────────────
export const getCertificates = (params = {}) => api.get(`${BASE}/certificates`, { params });
export const getCertificatesByStudent = (usn) =>
  api.get(`${BASE}/certificates`, { params: { usn } });
export const createCertificate = (data) => api.post(`${BASE}/certificates/create`, data);
export const issueCertificate = (data) => api.post(`${BASE}/certificates/issue`, data);
export const approveCertificate = (id) => api.patch(`${BASE}/certificates/${id}/approve`);
export const rejectCertificate = (id) => api.patch(`${BASE}/certificates/${id}/reject`);
export const downloadCertificate = async (id) => {
  // ✅ Match requested URL pattern exactly
  const response = await api.get(`/api/certificates/pdf/${id}`, {
    responseType: 'blob',
  });

  if (response.headers['content-type'] !== 'application/pdf') {
    // If NOT a PDF, it's likely a JSON error message in a blob
    const text = await response.data.text();
    try {
      const error = JSON.parse(text);
      throw new Error(error.message || error.error || 'Invalid response');
    } catch (e) {
      throw new Error(text || 'Invalid response');
    }
  }

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = 'certificate.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ── Certificate Requests (student self-service) ────────────────────────────────
export const submitCertificateRequest = (data) => api.post(`${BASE}/certificate-requests`, data);
export const getStudentRequests = (usn) =>
  api.get(`${BASE}/certificate-requests/student/${encodeURIComponent(usn)}`);
export const getAllCertificateRequests = (params = {}) =>
  api.get(`${BASE}/certificate-requests`, { params });
export const updateCertificateRequest = (id, data) =>
  api.put(`${BASE}/certificate-requests/${id}`, data);

// ── Certificate Templates ──────────────────────────────────────────────────────
export const getTemplates = () => api.get(`${BASE}/certificates/templates`);
export const getTemplate = (id) => api.get(`${BASE}/certificates/templates/${id}`);
export const createTemplate = (data) => api.post(`${BASE}/certificates/templates`, data);
export const updateTemplate = (id, d) => api.put(`${BASE}/certificates/templates/${id}`, d);
export const deleteTemplate = (id) => api.delete(`${BASE}/certificates/templates/${id}`);
export const uploadPdfTemplate = (file) => {
  const fd = new FormData();
  fd.append('pdf', file);
  return api.post(`${BASE}/certificates/templates/upload-pdf`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const uploadTemplateImage = (templateId, file) => {
  const fd = new FormData();
  fd.append('image', file);
  return api.post(`${BASE}/certificates/templates/${templateId}/image`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
