import { api, apiBlob } from "@/lib/api";

export const employeeLogin = (empn, nationalId) =>
  api("employee", "/employee/login", {
    method: "POST",
    body: { empn, national_id: nationalId },
    isPublic: true,
  });

export const getSubmissionOptions = () => api("employee", "/employee/submission-options");

export const getMySubmissions = async () =>
  (await api("employee", "/employee/submissions")).submissions || [];

export const getMySubmission = async (id) =>
  (await api("employee", `/employee/submissions/${encodeURIComponent(id)}`)).submission;

export const createSubmission = (formData) =>
  api("employee", "/employee/submissions", { method: "POST", body: formData });

export const getMyFileBlob = (fileId) =>
  apiBlob("employee", `/employee/submission-files/${fileId}`);
