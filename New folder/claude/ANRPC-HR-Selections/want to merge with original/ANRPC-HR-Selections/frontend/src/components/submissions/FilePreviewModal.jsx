"use client";

import { Download, FileText } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { downloadBlob } from "@/lib/format";

/**
 * Previews a protected attachment that has already been fetched as a Blob.
 * Supports images and PDFs inline; other formats (Word…) fall back to download.
 */
export default function FilePreviewModal({ file, onClose }) {
  if (!file) return null;

  const mime = file.blob?.type || "";
  const name = file.name || "attachment";
  const isImage = mime.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(name);
  const isPdf = mime === "application/pdf" || /\.pdf$/i.test(name);

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
