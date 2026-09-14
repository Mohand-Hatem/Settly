import crypto from "node:crypto";
import { uuidv7 } from "uuidv7";
import { env } from "../../../config/index.js";
import * as propertyRepo from "../repository/property.repository.js";
import type {
  AuthorizeUploadInput,
  AuthorizeUploadResponse,
  CompleteUploadInput,
  CompleteUploadResponse,
} from "../schema/upload.schema.js";
import type { PropertyImage } from "../schema/property.schema.js";

/**
 * Cloudinary Direct Signed Upload Service
 * Governed by docs/architecture/STORAGE.md Sections 2-4 and Decision #25
 */

function generateCloudinarySignature(
  params: Record<string, string | number>,
  apiSecret: string
): string {
  const sortedKeys = Object.keys(params).sort();
  const serialized = sortedKeys.map((k) => `${k}=${params[k]}`).join("&");
  return crypto.createHash("sha1").update(`${serialized}${apiSecret}`).digest("hex");
}

export async function authorizeUpload({
  userId,
  input,
}: {
  userId: string;
  input: AuthorizeUploadInput;
}): Promise<AuthorizeUploadResponse> {
  const assetId = uuidv7();
  const cloudName = env.CLOUDINARY_CLOUD_NAME || "settly-dev";
  const apiKey = env.CLOUDINARY_API_KEY || "dev_key";
  const apiSecret = env.CLOUDINARY_API_SECRET || "dev_secret";

  const folder = input.propertyId
    ? `settly/properties/${input.propertyId}`
    : `settly/users/${userId}`;

  // Mandatory re-encoding and EXIF stripping transformation per STORAGE.md Section 4
  const transformation = "q_auto,f_auto,c_limit,w_2400";
  const timestamp = Math.floor(Date.now() / 1000);

  const signParams: Record<string, string | number> = {
    folder,
    public_id: assetId,
    timestamp,
    transformation,
  };

  const signature = generateCloudinarySignature(signParams, apiSecret);

  return {
    assetId,
    provider: "cloudinary",
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    params: {
      ...signParams,
      api_key: apiKey,
      signature,
    },
    constraints: {
      maxBytes: 15 * 1024 * 1024,
      allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    },
  };
}

export async function completeUpload({
  assetId,
  propertyId,
  input,
}: {
  assetId: string;
  propertyId?: string;
  input: CompleteUploadInput;
}): Promise<CompleteUploadResponse> {
  let image: PropertyImage | undefined = undefined;

  if (propertyId) {
    image = await propertyRepo.addPropertyImage({
      propertyId,
      cloudinaryPublicId: input.cloudinaryPublicId,
      url: input.url,
      captionEn: input.captionEn,
      captionAr: input.captionAr,
      isCover: input.isCover,
    });
  }

  return {
    assetId,
    status: "READY",
    image,
  };
}

export async function deleteImage(
  propertyId: string,
  imageId: string
): Promise<boolean> {
  return await propertyRepo.deletePropertyImage(propertyId, imageId);
}

export async function reorderImages(
  propertyId: string,
  imageIds: string[]
): Promise<void> {
  await propertyRepo.reorderPropertyImages(propertyId, imageIds);
}
