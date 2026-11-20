const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function getHRDashboard() {
  const response = await fetch(`${API_URL}/hr/dashboard`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "تعذر تحميل بيانات لوحة التحكم");
  }

  return result.data;
}



export async function getDepartmentParticipants(departmentId) {
  const token = sessionStorage.getItem("hr_token");

  const response = await fetch(
    `${API_URL}/hr/departments/${departmentId}/participants`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    }
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "تعذر تحميل المشاركين");
  }

  return result;
}



export async function getHRSubmissions(filters = {}) {
  const token = sessionStorage.getItem("hr_token");

  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.department) params.set("department", filters.department);
  if (filters.type) params.set("type", filters.type);
  if (filters.evaluation) params.set("evaluation", filters.evaluation);

  const response = await fetch(
    `${API_URL}/hr/submissions?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  const result = await response.json();

  if (response.status === 401) {
    sessionStorage.removeItem("hr_token");
    sessionStorage.removeItem("hr_user");
    window.location.href = "/login";
    throw new Error("انتهت جلسة تسجيل الدخول.");
  }

  if (!response.ok || !result.success) {
    throw new Error(result.message || "تعذر تحميل المشاركات.");
  }

  return result.data;
}

export async function getHRRanking() {
  const token = sessionStorage.getItem("hr_token");

  const response = await fetch(`${API_URL}/hr/ranking`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const result = await response.json();

  if (response.status === 401) {
    sessionStorage.removeItem("hr_token");
    sessionStorage.removeItem("hr_user");
    window.location.href = "/login";
    throw new Error("انتهت جلسة تسجيل الدخول.");
  }

  if (!response.ok || !result.success) {
    throw new Error(result.message || "تعذر تحميل الترتيب.");
  }

  return result.data;
}
