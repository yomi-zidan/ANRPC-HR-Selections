export default function HRPageHeader({ eyebrow = "بوابة الموارد البشرية", title, description, action }) {
  return (
    <section dir="rtl" className="relative overflow-hidden rounded-[24px] bg-gradient-to-l from-[#102f50] via-[#173f63] to-[#205477] px-5 py-6 text-white shadow-[0_18px_36px_-26px_rgba(12,40,66,.75)] sm:px-8 sm:py-7">
      <div className="pointer-events-none absolute -left-8 -top-20 h-64 w-64 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -left-2 -top-14 h-48 w-48 rounded-full border border-white/[0.08]" />
      <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold text-sky-200">{eyebrow}</p>
          <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-xs leading-6 text-blue-100/80 sm:text-sm">{description}</p>}
        </div>
        {action}
      </div>
    </section>
  );
}
