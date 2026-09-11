"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  GripVertical,
  ImagePlus,
  Loader2,
  Trash2,
  UploadCloud,
} from "lucide-react";
import type { CloudinaryImage } from "@/types/catalog";

type UploadResponse = {
  url: string;
  publicId: string;
};

type ExpectedImageSize = {
  width: number;
  height: number;
  label: string;
};

function getImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const size = { width: image.naturalWidth, height: image.naturalHeight };
      URL.revokeObjectURL(objectUrl);
      resolve(size);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("ছবিটির width ও height পড়া যায়নি।"));
    };

    image.src = objectUrl;
  });
}

export default function ImageUploader({
  images,
  onChange,
  folder,
  multiple = true,
  label = "ছবি আপলোড করুন",
  help = "JPG, PNG বা WebP • সর্বোচ্চ 10MB",
  expectedSize,
}: {
  images: CloudinaryImage[];
  onChange: (images: CloudinaryImage[]) => void;
  folder: "products" | "combos" | "banners" | "guides";
  multiple?: boolean;
  label?: string;
  help?: string;
  expectedSize?: ExpectedImageSize;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setWarning("");

    try {
      const selected = multiple ? Array.from(files) : [files[0]];

      if (expectedSize) {
        for (const file of selected) {
          const actual = await getImageSize(file);
          const isMismatch =
            actual.width !== expectedSize.width ||
            actual.height !== expectedSize.height;

          if (isMismatch) {
            const message = `${expectedSize.label}-এর সঠিক size ${expectedSize.width} × ${expectedSize.height}px। আপনি ${actual.width} × ${actual.height}px ছবি নির্বাচন করেছেন। এই ছবিটি crop, stretch বা blur হতে পারে।`;
            setWarning(message);

            const shouldUpload = window.confirm(
              `${message}\n\nতারপরও ছবিটি upload করতে চান?`,
            );

            if (!shouldUpload) return;
          }
        }
      }

      setUploading(true);
      const uploaded: CloudinaryImage[] = [];
      for (const file of selected) {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("folder", folder);
        const response = await fetch("/api/cloudinary/upload", {
          method: "POST",
          body: formData,
        });
        const body = (await response.json()) as UploadResponse & {
          message?: string;
        };
        if (!response.ok)
          throw new Error(body.message ?? "ছবি আপলোড করা যায়নি");
        uploaded.push({ url: body.url, publicId: body.publicId });
      }
      onChange(multiple ? [...images, ...uploaded] : uploaded);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "ছবি আপলোড করা যায়নি",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div
          className={
            multiple ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-3"
          }
        >
          {images.map((image, index) => (
            <article
              key={`${image.url}-${index}`}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="relative aspect-[16/9] bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt="Uploaded preview"
                  className="h-full w-full object-cover"
                />
                {index === 0 && multiple && (
                  <span className="absolute left-2 top-2 rounded-full bg-[#062a54] px-2.5 py-1 text-[10px] font-black text-white">
                    প্রধান ছবি
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                <div className="flex items-center">
                  {multiple && (
                    <>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                        className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                        aria-label="ছবি বামে নিন"
                      >
                        <GripVertical className="size-4 rotate-90" />
                      </button>
                      <button
                        type="button"
                        disabled={index === images.length - 1}
                        onClick={() => move(index, 1)}
                        className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                        aria-label="ছবি ডানে নিন"
                      >
                        <GripVertical className="size-4 -rotate-90" />
                      </button>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      images.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  className="grid size-8 place-items-center rounded-lg text-rose-600 hover:bg-rose-50"
                  aria-label="ছবি সরান"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {(multiple || images.length === 0) && (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex min-h-28 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 text-center transition hover:border-[#ef4277] hover:bg-rose-50/40 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="mb-2 size-6 animate-spin text-[#ef4277]" />
          ) : images.length ? (
            <ImagePlus className="mb-2 size-6 text-[#ef4277]" />
          ) : (
            <UploadCloud className="mb-2 size-7 text-[#ef4277]" />
          )}
          <span className="text-sm font-black text-[#062a54]">
            {uploading ? "আপলোড হচ্ছে..." : label}
          </span>
          <span className="mt-1 text-xs text-slate-500">{help}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple={multiple}
        hidden
        onChange={(event) => void upload(event.target.files)}
      />
      {error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
          {error}
        </p>
      )}
      {warning && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{warning}</span>
        </p>
      )}
    </div>
  );
}
