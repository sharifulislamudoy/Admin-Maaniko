import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FOLDERS = new Set(["products", "combos", "banners", "guides"]);
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export async function POST(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || (token.role !== "ADMIN" && token.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.formData();
    const file = data.get("file");
    const requestedFolder = String(data.get("folder") ?? "products");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "একটি ছবি নির্বাচন করুন" },
        { status: 400 },
      );
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { message: "শুধু JPG, PNG, WebP বা AVIF ছবি ব্যবহার করুন" },
        { status: 400 },
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "ছবির সাইজ 10MB-এর কম হতে হবে" },
        { status: 400 },
      );
    }

    const cloudName = requiredEnv("CLOUDINARY_CLOUD_NAME");
    const apiKey = requiredEnv("CLOUDINARY_API_KEY");
    const apiSecret = requiredEnv("CLOUDINARY_API_SECRET");
    const safeFolder = ALLOWED_FOLDERS.has(requestedFolder)
      ? requestedFolder
      : "products";
    const folder = `maaniko/${safeFolder}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createHash("sha1")
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex");

    const upload = new FormData();
    upload.set("file", file);
    upload.set("api_key", apiKey);
    upload.set("timestamp", timestamp);
    upload.set("folder", folder);
    upload.set("signature", signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: upload,
        cache: "no-store",
      },
    );
    const body = (await response.json()) as {
      secure_url?: string;
      public_id?: string;
      error?: { message?: string };
    };

    if (!response.ok || !body.secure_url || !body.public_id) {
      return NextResponse.json(
        { message: body.error?.message ?? "Cloudinary upload failed" },
        { status: response.status || 502 },
      );
    }

    return NextResponse.json({
      url: body.secure_url,
      publicId: body.public_id,
    });
  } catch (reason) {
    return NextResponse.json(
      {
        message:
          reason instanceof Error ? reason.message : "ছবি আপলোড করা যায়নি",
      },
      { status: 500 },
    );
  }
}
