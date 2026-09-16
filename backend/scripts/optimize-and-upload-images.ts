import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGES_DIR = path.resolve(process.cwd(), "../frontend/public/images");
const OUTPUT_MAP_FILE = path.resolve(process.cwd(), "scripts/cloudinary-images-map.json");

interface ImageUploadResult {
  filename: string;
  originalSizeKB: number;
  optimizedSizeKB: number;
  reductionPercent: string;
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
}

async function optimizeAndUpload() {
  console.log("🚀 Starting Image Optimization (Sharp) & Cloudinary Upload...");
  console.log(`📂 Source directory: ${IMAGES_DIR}`);

  if (!fs.existsSync(IMAGES_DIR)) {
    throw new Error(`Directory not found: ${IMAGES_DIR}`);
  }

  const files = fs.readdirSync(IMAGES_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return [".jpg", ".jpeg", ".png", ".jfif", ".webp"].includes(ext);
  });

  console.log(`📸 Found ${files.length} images to optimize and upload.`);
  const results: Record<string, ImageUploadResult> = {};

  for (const filename of files) {
    const filePath = path.join(IMAGES_DIR, filename);
    const originalStats = fs.statSync(filePath);
    const originalSizeKB = Math.round(originalStats.size / 1024);

    const ext = path.extname(filename).toLowerCase();
    const baseName = path.basename(filename, ext);

    console.log(`\n⏳ Processing: ${filename} (${originalSizeKB} KB)...`);

    // Optimize with Sharp
    let pipeline = sharp(filePath).rotate(); // auto-orient based on EXIF

    const metadata = await pipeline.metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // Resize if excessive (e.g. max width 2048)
    if (width > 2048 || height > 2048) {
      pipeline = pipeline.resize({
        width: 2048,
        height: 2048,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    let optimizedBuffer: Buffer;

    if (ext === ".png") {
      optimizedBuffer = await pipeline
        .webp({ quality: 90, lossless: false })
        .toBuffer();
    } else {
      optimizedBuffer = await pipeline
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
    }

    const optimizedSizeKB = Math.round(optimizedBuffer.length / 1024);
    const reductionPercent = (
      ((originalStats.size - optimizedBuffer.length) / originalStats.size) *
      100
    ).toFixed(1);

    console.log(
      `   ✨ Sharp Optimized: ${originalSizeKB} KB -> ${optimizedSizeKB} KB (-${reductionPercent}%)`
    );

    // Upload to Cloudinary using upload_stream
    const uploadResult = await new Promise<{
      public_id: string;
      secure_url: string;
      width: number;
      height: number;
      format: string;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "settly/catalog",
          public_id: baseName,
          overwrite: true,
          resource_type: "image",
          transformation: [{ quality: "auto", fetch_format: "auto" }],
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("No upload result"));
          } else {
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              width: result.width,
              height: result.height,
              format: result.format,
            });
          }
        }
      );
      uploadStream.end(optimizedBuffer);
    });

    console.log(`   ☁️ Cloudinary Uploaded: ${uploadResult.secure_url}`);

    results[filename] = {
      filename,
      originalSizeKB,
      optimizedSizeKB,
      reductionPercent: `${reductionPercent}%`,
      publicId: uploadResult.public_id,
      secureUrl: uploadResult.secure_url,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
    };
  }

  fs.writeFileSync(OUTPUT_MAP_FILE, JSON.stringify(results, null, 2), "utf8");
  console.log(`\n💾 Saved Cloudinary mapping to ${OUTPUT_MAP_FILE}`);
  console.log("🎉 All images optimized with Sharp and uploaded to Cloudinary successfully!");
}

optimizeAndUpload().catch((err) => {
  console.error("❌ Optimization and upload failed:", err);
  process.exit(1);
});
