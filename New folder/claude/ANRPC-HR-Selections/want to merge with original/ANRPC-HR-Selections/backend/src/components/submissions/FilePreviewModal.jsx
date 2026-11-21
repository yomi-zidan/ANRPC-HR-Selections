"use client";

import { useEffect, useMemo, useState } from "react";
import { X, FileText, Loader2, AlertCircle } from "lucide-react";

function extensionOf(name = "") {
  return name.split(".").pop()?.toLowerCase() || "";
}

export default function FilePreviewModal({ file, blob, onClose }) {
  const [objectUrl, setObjectUrl] = useState("");
  const [docxHtml, setDocxHtml] = useState("");
  const [loadingDocx, setLoadingDocx] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const extension = useMemo(() => extensionOf(file?.name), [file?.name]);

  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  useEffect(() => {
    let active = true;
    async function renderDocx() {
      if (!blob || extension !== "docx") return;
      setLoadingDocx(true);
      setPreviewError("");
      try {
        const [mammothModule, purifierModule] = await Promise.all([
          import("mammoth"),
          import("dompurify"),
        ]);
        const mammoth = mammothModule.default || mammothModule;
        const DOMPurify = purifierModule.default || purifierModule;
        const arrayBuffer = await blob.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const safeHtml = DOMPurify.sanitize(result.value, {
          USE_PROFILES: { html: true },
        });
        if (active) setDocxHtml(safeHtml);
      } catch (error) {
        if (active) setPreviewError("تعذر عرض ملف Word. يمكنك فتحه باستخدام Microsoft Word.");
      } finally {
        if (active) setLoadingDocx(false);
      }
    }
    renderDocx();
    return () => { active = false; };
  }, [blob, extension]);

  if (!file) return null;

  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(extension);
  const isPdf = extension === "pdf";
  const isDocx = extension === "docx";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-2 sm:p-5" role="dialog" aria-modal="true" aria-label="معاينة المرفق">
      <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" dir="rtl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2 text-[#163B63]">
            <FileText size={20} />
            <h2 className="truncate text-sm font-bold sm:text-base">{file.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="إغلاق المعاينة">
            <X size={21} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-2 sm:p-4">
          {!blob && <div className="flex h-full items-center justify-center gap-2 text-slate-500"><Loader2 className="animate-spin" /> جاري تحميل الملف...</div>}
          {blob && isPdf && objectUrl && <iframe title={file.name} src={objectUrl} className="h-full min-h-[65vh] w-full rounded-lg bg-white" />}
          {blob && isImage && objectUrl && <div className="flex min-h-full items-center justify-center"><img src={objectUrl} alt={file.name} className="max-h-full max-w-full rounded-lg object-contain" /></div>}
          {blob && isDocx && loadingDocx && <div className="flex h-full items-center justify-center gap-2 text-slate-500"><Loader2 className="animate-spin" /> جاري تجهيز مستند Word...</div>}
          {blob && isDocx && previewError && <div className="mx-auto mt-10 flex max-w-xl items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-800"><AlertCircle />{previewError}</div>}
          {blob && isDocx && !loadingDocx && !previewError && <article className="mx-auto min-h-full max-w-4xl bg-white p-6 text-slate-800 shadow-sm sm:p-12" dir="auto"><div className="docx-preview-content" dangerouslySetInnerHTML={{ __html: docxHtml }} /></article>}
          {blob && extension === "doc" && <div className="mx-auto mt-10 max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-5 text-center text-amber-800">ملفات Word القديمة بصيغة DOC لا يدعم المتصفح عرضها مباشرة. يُرجى حفظها بصيغة DOCX أو PDF لمعاينتها داخل الموقع.</div>}
          {blob && !isPdf && !isImage && !isDocx && extension !== "doc" && <div className="mx-auto mt-10 max-w-xl rounded-xl border border-slate-200 bg-white p-5 text-center text-slate-600">نوع الملف غير مدعوم للمعاينة المباشرة.</div>}
        </div>
      </div>
      <style jsx global>{`
        .docx-preview-content { font-family: Arial, sans-serif; line-height: 1.8; overflow-wrap: anywhere; }
        .docx-preview-content img { max-width: 100%; height: auto; }
        .docx-preview-content table { border-collapse: collapse; max-width: 100%; }
        .docx-preview-content td, .docx-preview-content th { border: 1px solid #cbd5e1; padding: 6px; }
      `}</style>
    </div>
  );
}
