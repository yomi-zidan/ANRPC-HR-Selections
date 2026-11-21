"use client";

import { Download, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Modal } from "@/components/ui";
import { downloadBlob } from "@/lib/format";

function DocxPreview({ blob }) {
  const previewRef = useRef(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const container = previewRef.current;
    if (!blob || !container) return undefined;
    let active = true;
    import("docx-preview")
      .then(({ renderAsync }) => renderAsync(blob, container, container, { inWrapper: true, breakPages: true, ignoreWidth: false }))
      .then(() => { if (active) setLoading(false); })
      .catch(() => { if (active) { setError(true); setLoading(false); } });
    return () => { active = false; container.replaceChildren(); };
  }, [blob]);

  if (error) return <div className="px-6 py-16 text-center"><FileText size={30} className="mx-auto mb-4 text-primary" /><p className="font-bold">تعذرت معاينة ملف Word</p><p className="mt-2 text-sm text-fg-muted">يمكنك تنزيل الملف لفتحه على جهازك.</p></div>;
  return <div className="relative max-h-[70dvh] min-h-[50dvh] w-full overflow-auto bg-white text-black"><div ref={previewRef} dir="auto" className="min-h-[50dvh] w-full overflow-auto p-4 [&_.docx-wrapper]:!bg-white [&_.docx-wrapper]:!p-0" />{loading && <div className="absolute inset-0 flex items-center justify-center bg-white/90 text-sm font-semibold text-slate-600">جاري تحميل معاينة المستند...</div>}</div>;
}

/**
 * Previews a protected attachment that has already been fetched as a Blob.
 * Supports images, PDFs, and DOCX inline; legacy DOC files fall back to download.
 */
export default function FilePreviewModal({ file, onClose }) {
  const mime = file?.blob?.type || "";
  const name = file?.name || "attachment";
  const isImage = mime.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(name);
  const isPdf = mime === "application/pdf" || /\.pdf$/i.test(name);
  const isDocx = /\.docx$/i.test(name);
  if (!file) return null;

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={name}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
          <Button icon={Download} onClick={() => downloadBlob(file.blob, name)}>تنزيل الملف</Button>
        </>
      }
    >
      <div className="flex min-h-[60dvh] items-center justify-center bg-surface-2">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={file.url} alt={name} className="max-h-[70dvh] max-w-full object-contain p-4" />
        ) : isPdf ? (
          <iframe src={file.url} title={name} className="h-[70dvh] w-full border-0" />
        ) : isDocx ? (
          <DocxPreview blob={file.blob} />
        ) : (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface text-primary shadow-card">
              <FileText size={30} />
            </span>
            <p className="font-bold">لا تتوفر معاينة لهذا النوع من الملفات</p>
            <p className="mt-2 text-sm text-fg-muted">يمكنك تنزيل الملف لفتحه على جهازك.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
