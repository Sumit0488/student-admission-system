import axios from "axios";

const API = '/api/students';

export const getStudents = async (params = {}) => {
  console.log("GET ALL STUDENTS", params);
  return await axios.get(API, { params });
};

export const getStatusCounts = async () => {
  console.log("GET STATUS COUNTS");
  return await axios.get(`${API}/counts`);
};

export const getStudentById = async (id) => {
  console.log("GET STUDENT BY ID", id);
  return await axios.get(`${API}/${id}`);
};

export const createStudent = async (data) => {
  console.log("CREATE STUDENT");
  return await axios.post(API, data);
};

export const updateStudent = async (id, data) => {
  console.log("UPDATE STUDENT", id);
  return await axios.put(`${API}/${id}`, data);
};

export const deleteStudent = async (id) => {
  console.log("DELETE STUDENT →  DELETE /api/students/" + id);
  return await axios.delete(`${API}/${id}`);
};

export const changeStudentStatus = async (id, status) => {
  console.log("CHANGE STATUS →  PUT /api/students/" + id + "/status", { status });
  return await axios.put(`${API}/${id}/status`, { status });
};

export const exportStudents = async (params = {}) => {
  console.log("EXPORT STUDENTS", params);
  return await axios.get(`${API}/export`, { params, responseType: 'blob' });
};

export const exportFullReport = async () => {
  console.log("EXPORT FULL REPORT");
  return await axios.get(`${API}/export/report`, { responseType: 'blob' });
};

export const getDistinctPrograms = async () => {
  return await axios.get(`${API}/programs`);
};
