"use client";

import Link from "next/link";
import { forwardRef, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  Star,
  X,
} from "lucide-react";
import { getInitials } from "@/lib/format";

export const cx = (...parts) => parts.filter(Boolean).join(" ");

/* ───────────── Button ───────────── */
const buttonVariants = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover shadow-sm",
  accent: "bg-accent text-accent-fg hover:bg-accent-hover shadow-sm",
  outline: "border border-line bg-surface text-fg hover:bg-surface-2",
  soft: "bg-primary-soft text-primary hover:bg-primary-soft-hover",
  ghost: "text-fg-muted hover:bg-surface-2 hover:text-fg",
  danger: "bg-danger-bg text-danger-fg hover:opacity-85",
};

const buttonSizes = {
  sm: "h-9 gap-1.5 px-3.5 text-xs",
  md: "h-11 gap-2 px-5 text-sm",
  lg: "h-12 gap-2 px-7 text-sm",
  icon: "h-10 w-10 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon: Icon,
  href,
  className,
  children,
  disabled,
  type = "button",
  ...props
}) {
  const classes = cx(
    "inline-flex shrink-0 select-none items-center justify-center rounded-xl font-semibold transition",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    buttonVariants[variant],
    buttonSizes[size],
    className
  );

  const content = (
    <>
      {loading ? <Loader2 size={size === "sm" ? 14 : 17} className="animate-spin" /> : Icon && <Icon size={size === "sm" ? 14 : 17} />}
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled || loading} className={classes} {...props}>
      {content}
    </button>
  );
}

/* ───────────── Surfaces ───────────── */
export function Card({ className, children, as: Tag = "section", ...props }) {
  return (
    <Tag className={cx("rounded-2xl border border-line bg-surface shadow-card", className)} {...props}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, icon: Icon, action, className }) {
  return (
    <div className={cx("flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6", className)}>
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Icon size={19} />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-bold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-fg-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ───────────── Badge ───────────── */
const badgeTones = {
  neutral: "bg-surface-2 text-fg-muted",
  primary: "bg-primary-soft text-primary",
  success: "bg-success-bg text-success-fg",
  warning: "bg-warning-bg text-warning-fg",
  danger: "bg-danger-bg text-danger-fg",
  info: "bg-info-bg text-info-fg",
  accent: "bg-accent/20 text-warning-fg",
};

export function Badge({ tone = "neutral", icon: Icon, children, className }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold",
        badgeTones[tone],
        className
      )}
    >
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}

/* ───────────── Form controls ───────────── */
export function Field({ label, hint, error, required, children, className, htmlFor }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="mb-2 flex items-center gap-1 text-[13px] font-semibold text-fg-muted">
          {label}
          {required && <span className="text-danger-fg">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-danger-fg">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef(function Input({ className, icon: Icon, ...props }, ref) {
  if (Icon) {
    return (
      <div className="relative">
        <Icon size={17} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-fg-subtle" />
        <input ref={ref} className={cx("field-control h-11 ps-10", className)} {...props} />
      </div>
    );
  }
  return <input ref={ref} className={cx("field-control h-11", className)} {...props} />;
});

export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cx("field-control min-h-28 resize-y py-3 leading-7", className)}
      {...props}
    />
  );
});

export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cx("field-control h-11 appearance-none pe-10", className)} {...props}>
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 text-fg-subtle" />
    </div>
  );
});

export function Switch({ checked, onChange, label, description, disabled }) {
  const id = useId();
  return (
    <label htmlFor={id} className={cx("flex items-center justify-between gap-4", disabled ? "opacity-60" : "cursor-pointer")}>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-fg-muted">{description}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className="h-6 w-11 rounded-full bg-line transition peer-checked:bg-primary peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary" />
        <span className="absolute start-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:-translate-x-5" />
      </span>
    </label>
  );
}

export function Segmented({ options, value, onChange, className }) {
  return (
    <div role="tablist" className={cx("inline-flex rounded-xl bg-surface-2 p-1", className)}>
      {options.map((option) => {
        const active = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cx(
              "inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition",
              active ? "bg-surface text-primary shadow-sm" : "text-fg-muted hover:text-fg"
            )}
          >
            {Icon && <Icon size={16} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* ───────────── Feedback ───────────── */
const alertTones = {
  danger: { icon: AlertCircle, cls: "bg-danger-bg text-danger-fg" },
  success: { icon: CheckCircle2, cls: "bg-success-bg text-success-fg" },
  info: { icon: Info, cls: "bg-info-bg text-info-fg" },
  warning: { icon: AlertCircle, cls: "bg-warning-bg text-warning-fg" },
};

export function Alert({ tone = "danger", children, onClose, className }) {
  if (!children) return null;
  const { icon: Icon, cls } = alertTones[tone];
  return (
    <div role="alert" className={cx("flex items-start gap-3 rounded-xl px-4 py-3 text-sm leading-6 animate-fade-in", cls, className)}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="إغلاق" className="rounded-md p-0.5 opacity-70 hover:opacity-100">
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export function Spinner({ size = 20, className }) {
  return <Loader2 size={size} className={cx("animate-spin", className)} />;
}

export function PageLoader({ text = "جاري التحميل..." }) {
  return (
    <div className="flex min-h-[45vh] flex-col items-center justify-center gap-3 text-fg-muted">
      <Spinner size={28} className="text-primary" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cx("skeleton", className)} />;
}

export function EmptyState({ icon: Icon, title, text, action, className }) {
  return (
    <div className={cx("flex flex-col items-center px-6 py-14 text-center", className)}>
      {Icon && (
        <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 text-fg-subtle">
          <Icon size={30} strokeWidth={1.6} />
        </span>
      )}
      <h3 className="text-base font-bold">{title}</h3>
      {text && <p className="mt-2 max-w-md text-sm leading-7 text-fg-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <Card className="mx-auto max-w-xl p-8 text-center">
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-bg text-danger-fg">
        <AlertCircle size={26} />
      </span>
      <h2 className="text-lg font-bold">تعذر تحميل البيانات</h2>
      <p className="mt-2 text-sm leading-7 text-fg-muted">{message}</p>
      {onRetry && (
        <Button className="mt-6" onClick={onRetry}>
          إعادة المحاولة
        </Button>
      )}
    </Card>
  );
}

/* ───────────── Page structure ───────────── */
export function PageHeader({ title, subtitle, back, actions, className }) {
  return (
    <div className={cx("mb-6 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-fg-muted transition hover:text-primary"
          >
            <ArrowRight size={16} />
            {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-balance">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm leading-6 text-fg-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const statTones = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-bg text-success-fg",
  warning: "bg-warning-bg text-warning-fg",
  info: "bg-info-bg text-info-fg",
  danger: "bg-danger-bg text-danger-fg",
};

export function StatCard({ title, value, icon: Icon, tone = "primary", hint, loading }) {
  return (
    <Card className="p-5 transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-fg-muted">{title}</p>
          {loading ? (
            <Skeleton className="mt-3 h-9 w-20" />
          ) : (
            <p className="mt-2 text-3xl font-extrabold tracking-tight" dir="ltr">
              {value}
            </p>
          )}
          {hint && <p className="mt-1 text-xs text-fg-subtle">{hint}</p>}
        </div>
        <span className={cx("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", statTones[tone])}>
          <Icon size={20} />
        </span>
      </div>
    </Card>
  );
}

export function Avatar({ name, size = 40, className }) {
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-primary",
        className
      )}
    >
      {getInitials(name)}
    </span>
  );
}

/* ───────────── Stars ───────────── */
export function Stars({ value = 0, onChange, size = 20, readOnly = false, className }) {
  const [hover, setHover] = useState(0);
  const shown = hover || Math.round(value);

  return (
    <div dir="ltr" className={cx("inline-flex items-center gap-1", className)} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= shown;
        const icon = (
          <Star
            size={size}
            strokeWidth={1.7}
            className={cx("transition", filled ? "fill-accent text-accent" : "text-fg-subtle/60")}
          />
        );
        if (readOnly) return <span key={n}>{icon}</span>;
        return (
          <button
            key={n}
            type="button"
            aria-label={`تقييم ${n} من 5`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange?.(n)}
            className="rounded-md p-0.5 transition hover:scale-110"
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}

/* ───────────── Modal ───────────── */
export function Modal({ open, onClose, title, children, size = "md", footer }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event) => event.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const widths = { md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-5xl" };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#031116]/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className={cx(
          "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-pop animate-pop sm:rounded-3xl",
          widths[size]
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <h2 className="min-w-0 truncate text-base font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="rounded-lg p-2 text-fg-muted hover:bg-surface-2 hover:text-fg">
            <X size={19} />
          </button>
        </div>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface-2/50 px-5 py-4 sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ───────────── Pagination ───────────── */
export function Pagination({ page, pageCount, onChange, total, pageSize }) {
  if (pageCount <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-sm text-fg-muted sm:px-6">
      <span>
        عرض <b className="text-fg">{from}–{to}</b> من <b className="text-fg">{total}</b>
      </span>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="icon" className="!h-9 !w-9" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="السابق">
          <ChevronRight size={17} />
        </Button>
        <span className="min-w-16 text-center text-xs font-bold">
          {page} / {pageCount}
        </span>
        <Button variant="outline" size="icon" className="!h-9 !w-9" disabled={page >= pageCount} onClick={() => onChange(page + 1)} aria-label="التالي">
          <ChevronLeft size={17} />
        </Button>
      </div>
    </div>
  );
}

/* ───────────── Progress ring ───────────── */
export function ProgressRing({ percent = 0, size = 132, stroke = 12, label, sublabel }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(percent, 0), 100) / 100);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-extrabold" dir="ltr">{label}</span>
        {sublabel && <span className="text-[11px] text-fg-muted">{sublabel}</span>}
      </div>
    </div>
  );
}
