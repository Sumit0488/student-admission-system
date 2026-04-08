import api from './api';
import qc from './queryCache';

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
export const getSchedules = async () => {
  const cached = qc.get('schedules');
  if (cached) return { data: cached };
  const res = await api.get(`${BASE}/schedules`);
  qc.set('schedules', res.data);
  return res;
};
export const getAdmissionStages = () => api.get(`${BASE}/schedules/stages`);
export const getSchedule = (id) => api.get(`${BASE}/schedules/${id}`);
export const createSchedule = async (data) => {
  const res = await api.post(`${BASE}/schedules/create`, data);
  qc.del('schedules');
  return res;
};
export const updateSchedule = async (id, d) => {
  const res = await api.put(`${BASE}/schedules/${id}`, d);
  qc.del('schedules');
  return res;
};
export const deleteSchedule = async (id) => {
  const res = await api.delete(`${BASE}/schedules/${id}`);
  qc.del('schedules');
  return res;
};

// ── Approvals ──────────────────────────────────────────────────────────────────
export const getApprovals = (params = {}) => api.get(`${BASE}/approvals`, { params });
export const updateApproval = (id, data) => api.put(`${BASE}/approvals/${id}`, data);

// ── Certificates ───────────────────────────────────────────────────────────────
export const getCertificates = async (params = {}) => {
  // Only cache the no-param call (full list used by CertificatesPage)
  if (Object.keys(params).length === 0) {
    const cached = qc.get('certificates');
    if (cached) return { data: cached };
    const res = await api.get(`${BASE}/certificates`, { params });
    qc.set('certificates', res.data);
    return res;
  }
  return api.get(`${BASE}/certificates`, { params });
};
export const getCertificatesByStudent = (usn) =>
  api.get(`${BASE}/certificates`, { params: { usn } });
export const createCertificate = (data) => api.post(`${BASE}/certificates/create`, data);
export const issueCertificate = (data) => api.post(`${BASE}/certificates/issue`, data);
export const approveCertificate = async (id) => {
  const res = await api.patch(`${BASE}/certificates/${id}/approve`);
  qc.del('certificates');
  return res;
};
export const rejectCertificate = async (id) => {
  const res = await api.patch(`${BASE}/certificates/${id}/reject`);
  qc.del('certificates');
  return res;
};
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
export const getAllCertificateRequests = async (params = {}) => {
  // Only cache the no-param call (ApprovalsPage initial load)
  if (Object.keys(params).length === 0) {
    const cached = qc.get('certRequests');
    if (cached) return { data: cached };
    const res = await api.get(`${BASE}/certificate-requests`, { params });
    qc.set('certRequests', res.data);
    return res;
  }
  return api.get(`${BASE}/certificate-requests`, { params });
};
export const updateCertificateRequest = async (id, data) => {
  const res = await api.put(`${BASE}/certificate-requests/${id}`, data);
  qc.del('certRequests');
  return res;
};

// ── Certificate Templates ──────────────────────────────────────────────────────
export const getTemplates = async () => {
  const cached = qc.get('templates');
  if (cached) return { data: cached };
  const res = await api.get(`${BASE}/certificates/templates`);
  qc.set('templates', res.data);
  return res;
};
export const getTemplate = (id) => api.get(`${BASE}/certificates/templates/${id}`);
export const createTemplate = async (data) => {
  const res = await api.post(`${BASE}/certificates/templates`, data);
  qc.del('templates');
  return res;
};
export const updateTemplate = async (id, d) => {
  const res = await api.put(`${BASE}/certificates/templates/${id}`, d);
  qc.del('templates');
  return res;
};
export const deleteTemplate = async (id) => {
  const res = await api.delete(`${BASE}/certificates/templates/${id}`);
  qc.del('templates');
  return res;
};
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
