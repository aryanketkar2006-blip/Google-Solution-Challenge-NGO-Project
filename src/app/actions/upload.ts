"use server";

import { v2 as cloudinary } from "cloudinary";

export async function uploadImageToCloudinary(formData: FormData) {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    const file = formData.get("file") as File;
    if (!file) {
      throw new Error("No file provided");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");
    const fileUri = `data:${file.type};base64,${base64Data}`;

    const result = await cloudinary.uploader.upload(fileUri, {
      folder: "civix_reports",
    });

    return { url: result.secure_url };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload failed";
    throw new Error(message);
  }
}
