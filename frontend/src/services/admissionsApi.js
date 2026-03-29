import axios from 'axios';

const BASE = '/api';

// ── Enquiry ────────────────────────────────────────────────────────────────────
export const getEnquiries      = (params = {}) => axios.get(`${BASE}/enquiry`, { params });
export const createEnquiry     = (data)        => axios.post(`${BASE}/enquiry/create`, data);
export const updateEnquiry     = (id, data)    => axios.put(`${BASE}/enquiry/${id}`, data);
export const addFollowUp       = (id, data)    => axios.post(`${BASE}/enquiry/${id}/followup`, data);
export const convertEnquiry    = (id, data={}) => axios.post(`${BASE}/enquiry/convert/${id}`, data);
export const deleteEnquiry     = (id)          => axios.delete(`${BASE}/enquiry/${id}`);

// Stage-move helper — maps a UI pipeline stage to the right DB patch
const STAGE_PATCH = {
  Inquiry:     { admissionStage: 'Enquiry',     status: 'New' },
  Application: { admissionStage: 'Application' },
  Admitted:    { admissionStage: 'Admitted' },
  Rejected:    { status: 'Rejected' },
  Cancelled:   { admissionStage: 'Cancelled' },
};
export const moveEnquiryStage = (id, stage) =>
  axios.put(`${BASE}/enquiry/${id}`, STAGE_PATCH[stage]);

// ── Schedules ──────────────────────────────────────────────────────────────────
export const getSchedules        = ()    => axios.get(`${BASE}/schedules`);
export const getAdmissionStages  = ()    => axios.get(`${BASE}/schedules/stages`);
export const getSchedule         = (id)  => axios.get(`${BASE}/schedules/${id}`);
export const createSchedule  = (data)   => axios.post(`${BASE}/schedules/create`, data);
export const updateSchedule  = (id, d)  => axios.put(`${BASE}/schedules/${id}`, d);
export const deleteSchedule  = (id)     => axios.delete(`${BASE}/schedules/${id}`);

// ── Approvals ──────────────────────────────────────────────────────────────────
export const getApprovals    = (params = {}) => axios.get(`${BASE}/approvals`, { params });
export const updateApproval  = (id, data)    => axios.put(`${BASE}/approvals/${id}`, data);

// ── Certificates ───────────────────────────────────────────────────────────────
export const getCertificates            = (params = {}) => axios.get(`${BASE}/certificates`, { params });
export const getCertificatesByStudent   = (usn)         => axios.get(`${BASE}/certificates`, { params: { usn } });
export const createCertificate   = (data) => axios.post(`${BASE}/certificates/create`, data);
export const issueCertificate    = (data) => axios.post(`${BASE}/certificates/issue`, data);
export const approveCertificate  = (id)   => axios.patch(`${BASE}/certificates/${id}/approve`);
export const rejectCertificate   = (id)   => axios.patch(`${BASE}/certificates/${id}/reject`);
export const downloadCertificate = (id)   =>
  axios.get(`${BASE}/certificates/pdf/${id}`, { responseType: 'blob' });

// ── Certificate Requests (student self-service) ────────────────────────────────
export const submitCertificateRequest  = (data)        => axios.post(`${BASE}/certificate-requests`, data);
export const getStudentRequests        = (usn)          => axios.get(`${BASE}/certificate-requests/student/${encodeURIComponent(usn)}`);
export const getAllCertificateRequests = (params = {})  => axios.get(`${BASE}/certificate-requests`, { params });
export const updateCertificateRequest  = (id, data)    => axios.put(`${BASE}/certificate-requests/${id}`, data);

// ── Certificate Templates ──────────────────────────────────────────────────────
export const getTemplates       = ()       => axios.get(`${BASE}/certificates/templates`);
export const getTemplate        = (id)     => axios.get(`${BASE}/certificates/templates/${id}`);
export const createTemplate     = (data)   => axios.post(`${BASE}/certificates/templates`, data);
export const updateTemplate     = (id, d)  => axios.put(`${BASE}/certificates/templates/${id}`, d);
export const deleteTemplate     = (id)     => axios.delete(`${BASE}/certificates/templates/${id}`);
export const uploadPdfTemplate  = (file)   => {
  const fd = new FormData();
  fd.append('pdf', file);
  return axios.post(`${BASE}/certificates/templates/upload-pdf`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
