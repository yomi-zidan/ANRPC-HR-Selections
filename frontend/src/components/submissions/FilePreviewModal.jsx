
"use client";

import { useEffect, useRef, useState } from "react";
import { X, FileText, AlertCircle, Loader2 } from "lucide-react";
import { renderAsync } from "docx-preview";

export default function FilePreviewModal({ file, onClose }) {
  const docxContainerRef = useRef(null);
  const [error, setError] = useState("");
  const [rendering, setRendering] = useState(false);

  const extension = file?.name?.split(".").pop()?.toLowerCase();

  const isPdf = extension === "pdf";
  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(extension);
  const isDocx = extension === "docx";

  useEffect(() => {
    if (!isDocx || !file?.blob || !docxContainerRef.current) {
      return;
    }

    let cancelled = false;

    async function renderDocument() {
      try {
        setError("");

        if (!docxContainerRef.current) return;

        docxContainerRef.current.innerHTML = "";

        setRendering(true);

        await renderAsync(
          file.blob,
          docxContainerRef.current,
          undefined,
          {
            className: "docx-preview",
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            renderHeaders: true,
            renderFooters: true,
            renderFootnotes: true,
            renderEndnotes: true,
          }
        );
      } catch (err) {
        console.error("DOCX Preview Error:", err);

        if (!cancelled) {
          setError(
            "تعذر عرض ملف Word. تأكدي أن الملف بصيغة DOCX وسليم."
          );
        }
      } finally {
        if (!cancelled) {
          setRendering(false);
        }
      }
    }

    renderDocument();

    return () => {
      cancelled = true;
    };
  }, [file, isDocx]);

  if (!file) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-2 sm:p-5"
      dir="rtl"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      tabIndex={-1}
    >
      <div className="flex h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <FileText className="shrink-0 text-[#163B63]" size={23} />

            <div className="min-w-0">
              <h2 className="font-bold text-[#163B63]">
                معاينة المرفق
              </h2>

              <p className="truncate text-xs text-slate-500">
                {file.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            aria-label="إغلاق المعاينة"
          >
            <X size={21} />
          </button>
        </div>

        {/* Preview */}
        <div className="min-h-0 flex-1 overflow-auto bg-slate-100">

          {/* PDF */}
          {isPdf && file.url && (
            <iframe
              src={file.url}
              title={file.name}
              className="h-full min-h-[500px] w-full border-0 bg-white"
            />
          )}

          {/* Images */}
          {isImage && file.url && (
            <div className="flex min-h-full items-center justify-center p-4 sm:p-8">
              <img
                src={file.url}
                alt={file.name}
                className="max-h-full max-w-full rounded-lg object-contain shadow"
              />
            </div>
          )}

          {/* Word DOCX */}
          {isDocx && (
            <div className="min-h-full p-3 sm:p-8">

              {rendering && (
                <div className="mb-4 flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Loader2 size={18} className="animate-spin" />
                  جاري تجهيز مستند Word...
                </div>
              )}

              {error ? (
                <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-center text-red-600">
                  <AlertCircle size={35} />
                  <p>{error}</p>
                </div>
              ) : (
                <div
                  ref={docxContainerRef}
                  className="docx-preview-container mx-auto min-h-full max-w-[900px] bg-white p-4 shadow-sm sm:p-10"
                />
              )}
            </div>
          )}

          {/* Unsupported */}
          {!isPdf && !isImage && !isDocx && (
            <div className="flex min-h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <AlertCircle size={40} className="text-amber-500" />

              <h3 className="font-bold text-slate-700">
                صيغة الملف غير مدعومة للمعاينة المباشرة
              </h3>

              <p className="max-w-lg text-sm leading-7 text-slate-500">
                المعاينة متاحة لملفات PDF والصور وWord بصيغة DOCX.
                ملفات DOC القديمة تحتاج إلى تحويلها إلى PDF.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end border-t border-slate-200 bg-white px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg bg-[#163B63] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#0D2B4B]"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
