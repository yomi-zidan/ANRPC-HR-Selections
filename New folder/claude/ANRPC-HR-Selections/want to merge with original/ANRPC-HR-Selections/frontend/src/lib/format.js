const LOCALE = "ar-EG-u-nu-latn"; // Arabic text with Latin digits

export function formatDate(value, options) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(
    LOCALE,
    options || { year: "numeric", month: "long", day: "numeric" }
  );
}

export function formatNumber(value, digits = 0) {
  const number = Number(value || 0);
  return number.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function formatBytes(value) {
  const size = Number(value || 0);
  if (size < 1024) return `${size} بايت`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} ك.ب`;
  return `${(size / (1024 * 1024)).toFixed(1)} م.ب`;
}

export const isTeam = (type) => Number(type) === 2;
export const typeLabel = (type) => (isTeam(type) ? "فريق عمل" : "فردي");

export function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "؟";
  return parts.slice(0, 2).map((part) => part[0]).join(" ");
}

/** Contest state derived from ContestSettings (OpenDate / DeadlineDate / IsActive). */
export function contestState(contest) {
  if (!contest) return { key: "none", label: "غير محدد", tone: "neutral", daysLeft: null };

  const now = new Date();
  const open = new Date(contest.OpenDate);
  const deadline = new Date(contest.DeadlineDate);
  deadline.setHours(23, 59, 59, 999);

  const daysLeft = Math.ceil((deadline - now) / 86400000);

  if (!Number(contest.IsActive)) return { key: "inactive", label: "المسابقة متوقفة", tone: "neutral", daysLeft };
  if (now < open) return { key: "upcoming", label: "لم يبدأ التقديم بعد", tone: "info", daysLeft };
  if (now > deadline) return { key: "closed", label: "انتهى التقديم", tone: "danger", daysLeft: 0 };
  return { key: "open", label: "التقديم مفتوح", tone: "success", daysLeft };
}

export function downloadBlob(blob, name = "file") {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Builds a CSV (with BOM so Excel shows Arabic correctly). */
export function toCSV(rows, columns) {
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const head = columns.map((column) => escape(column.label)).join(",");
  const body = rows.map((row) =>
    columns.map((column) => escape(column.value(row))).join(",")
  );
  return "\uFEFF" + [head, ...body].join("\r\n");
}
