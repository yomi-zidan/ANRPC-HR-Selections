import { clearAuthSession, getToken } from "./auth";

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, { status = 0, errors = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

function buildMessage(data, fallback) {
  if (data?.errors && typeof data.errors === "object") {
    const joined = Object.values(data.errors).flat().filter(Boolean).join(" ");
    if (joined) return joined;
  }
  return data?.message || fallback;
}

function buildQuery(params) {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      search.append(key, String(value).trim());
    }
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

async function request(role, path, options = {}) {
  const { method = "GET", body, params, signal, isPublic = false } = options;

  const headers = { Accept: "application/json" };
  if (!isPublic) {
    const token = getToken(role);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let payload;
  if (body instanceof FormData) {
    payload = body; // the browser sets the multipart boundary itself
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}${buildQuery(params)}`, {
      method,
      headers,
      body: payload,
      signal,
      cache: "no-store",
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new ApiError(
      "تعذر الاتصال بالخادم. تأكد من اتصالك بالشبكة ثم حاول مرة أخرى."
    );
  }

  if (response.status === 401 && !isPublic) {
    clearAuthSession(role);
    if (typeof window !== "undefined") {
      window.location.replace(`/login?role=${role}&expired=1`);
    }
    throw new ApiError("انتهت جلسة الدخول. برجاء تسجيل الدخول مرة أخرى.", {
      status: 401,
    });
  }

  return response;
}

/** JSON request. Throws ApiError with a readable Arabic message on failure. */
export async function api(role, path, options) {
  const response = await request(role, path, options);

  let data = null;
  try {
    data = await response.json();
  } catch {
    // non-JSON body
  }

  if (!response.ok || data?.success === false) {
    throw new ApiError(buildMessage(data, "حدث خطأ غير متوقع، حاول مرة أخرى."), {
      status: response.status,
      errors: data?.errors || null,
    });
  }

  return data;
}

/** Protected file download/preview returned as a Blob. */
export async function apiBlob(role, path, options) {
  const response = await request(role, path, options);

  if (!response.ok) {
    let data = null;
    try {
      data = await response.json();
    } catch {
      // ignore
    }
    throw new ApiError(buildMessage(data, "تعذر تحميل الملف."), {
      status: response.status,
    });
  }

  const blob = await response.blob();
  if (!blob.size) throw new ApiError("الملف فارغ أو تعذر قراءته.");
  return blob;
}
