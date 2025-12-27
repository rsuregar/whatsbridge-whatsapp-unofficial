/**
 * Image Processing Utility
 * Handles image compression and sticker conversion
 */

import sharp from "sharp";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

class ImageProcessor {
  /**
   * Download image from URL
   */
  private static async downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Compress image
   * @param imageUrl - URL or file path of the image
   * @param quality - Quality (1-100, default: 80)
   * @param maxWidth - Maximum width (default: 1920)
   * @param maxHeight - Maximum height (default: 1920)
   * @returns Compressed image buffer
   */
  static async compressImage(
    imageUrl: string,
    quality: number = 80,
    maxWidth: number = 1920,
    maxHeight: number = 1920
  ): Promise<Buffer> {
    try {
      // Download or read image
      let imageBuffer: Buffer;
      if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        imageBuffer = await this.downloadImage(imageUrl);
      } else {
        imageBuffer = fs.readFileSync(imageUrl);
      }

      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata();

      // Calculate new dimensions
      let width = metadata.width || maxWidth;
      let height = metadata.height || maxHeight;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Compress image
      const compressed = await sharp(imageBuffer)
        .resize(width, height, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();

      return compressed;
    } catch (error: any | Error) {
      throw new Error(
        `Image compression failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Convert image to WebP sticker format (512x512)
   * Supports JPG, JPEG, PNG, WebP, and GIF
   * @param imageUrl - URL or file path of the image
   * @returns Sticker buffer (WebP format, 512x512)
   */
  static async convertToSticker(imageUrl: string): Promise<Buffer> {
    try {
      // Download or read image
      let imageBuffer: Buffer;
      if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        imageBuffer = await this.downloadImage(imageUrl);
      } else {
        imageBuffer = fs.readFileSync(imageUrl);
      }

      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata();
      const format = metadata.format;

      // Check if format is supported
      if (!["jpeg", "jpg", "png", "webp", "gif"].includes(format || "")) {
        throw new Error(
          `Unsupported image format: ${format}. Supported: JPG, JPEG, PNG, WebP, GIF`
        );
      }

      // Convert to WebP sticker (512x512, preserve transparency for PNG)
      let sharpInstance = sharp(imageBuffer);

      // Handle animated GIF
      if (format === "gif") {
        // Take first frame of GIF
        sharpInstance = sharpInstance.gif();
      }

      // Resize to 512x512 and convert to WebP
      const sticker = await sharpInstance
        .resize(512, 512, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
        })
        .webp({ quality: 100 })
        .toBuffer();

      return sticker;
    } catch (error: any | Error) {
      throw new Error(
        `Sticker conversion failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Save buffer to temporary file
   * Returns absolute path to the temporary file
   */
  static async saveToTempFile(
    buffer: Buffer,
    extension: string = "jpg"
  ): Promise<string> {
    // Use path.resolve to ensure absolute path
    const tempDir = path.resolve(process.cwd(), "temp");
    
    // Create temp directory if it doesn't exist with proper permissions
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { 
        recursive: true,
        mode: 0o755 // rwxr-xr-x
      });
    }

    const filename = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
    const filepath = path.resolve(tempDir, filename);
    
    // Write file with proper permissions (rw-r--r--)
    fs.writeFileSync(filepath, buffer, { mode: 0o644 });

    return filepath;
  }

  /**
   * Cleanup temporary file
   */
  static cleanupTempFile(filepath: string): void {
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch (error) {
      // Silent fail
    }
  }
}

export default ImageProcessor;

