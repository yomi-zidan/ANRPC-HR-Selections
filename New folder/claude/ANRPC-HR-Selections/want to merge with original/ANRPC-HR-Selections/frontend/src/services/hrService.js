import { api, apiBlob } from "@/lib/api";

export const hrLogin = (username, password) =>
  api("hr", "/hr/login", { method: "POST", body: { username, password }, isPublic: true });

export const getHRDashboard = async () => (await api("hr", "/hr/dashboard")).data;

export const getHRSubmissions = async (filters = {}, signal) => {
  const result = await api("hr", "/hr/submissions", { params: filters, signal });
  return {
    submissions: result.data?.submissions || [],
    departments: result.data?.departments || [],
  };
};

export const getHRRanking = async () => {
  const result = await api("hr", "/hr/ranking");
  return {
    employees: result.data?.employees || [],
    departments: result.data?.departments || [],
  };
};

export const getHRSubmission = async (id) =>
  (await api("hr", `/hr/submissions/${encodeURIComponent(id)}`)).submission;

export const evaluateSubmission = (id, { stars, notes }) =>
  api("hr", `/hr/submissions/${encodeURIComponent(id)}/evaluate`, {
    method: "POST",
    body: { stars, notes },
  });

export const getHRFileBlob = (fileId) => apiBlob("hr", `/hr/submission-files/${fileId}`);

// Criteria
export const getCriteria = async () => (await api("hr", "/hr/criteria")).data || [];
export const createCriterion = (payload) =>
  api("hr", "/hr/criteria", { method: "POST", body: payload });
export const updateCriterion = (id, payload) =>
  api("hr", `/hr/criteria/${id}`, { method: "PUT", body: payload });

// Settings
export const getHRSettings = async () => (await api("hr", "/hr/settings")).data;
export const updateContest = (payload) =>
  api("hr", "/hr/settings/contest", { method: "PUT", body: payload });
export const updateStorage = (id, payload) =>
  api("hr", `/hr/settings/storage/${id}`, { method: "PUT", body: payload });
