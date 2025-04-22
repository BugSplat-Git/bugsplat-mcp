import sharp from "sharp";
import { Buffer } from "node:buffer";

export async function resizeImageData(
  imageBuffer: Buffer,
  fileName: string,
  maxSize: number
): Promise<Buffer> {
  // Check size and resize if necessary
  if (imageBuffer.length > maxSize) {
    console.error(
      `Image ${fileName} (${imageBuffer.length} bytes) exceeds size limit ${maxSize}. Resizing...`
    );
    try {
      let sharpInstance = sharp(imageBuffer);
      let metadata = await sharpInstance.metadata();
      let width = metadata.width;
      let height = metadata.height;

      // Iteratively resize until under the limit (or dimensions are too small)
      while (
        imageBuffer.length > maxSize &&
        width &&
        height &&
        width > 1 &&
        height > 1
      ) {
        // Reduce dimensions (e.g., by half)
        width = Math.max(1, Math.floor(width / 2));
        height = Math.max(1, Math.floor(height / 2));

        console.error(`Resizing ${fileName} to ${width}x${height}...`);
        sharpInstance = sharpInstance.resize(width, height);
        imageBuffer = await sharpInstance.toBuffer(); // Re-check size after resize
        metadata = await sharp(imageBuffer).metadata(); // Update metadata for next loop
        width = metadata.width;
        height = metadata.height;
      }

      if (imageBuffer.length > maxSize) {
        // If still too large after max resizing, throw error
        throw new Error(
          `Image ${fileName} could not be resized sufficiently to meet the size limit.`
        );
      }

      console.error(`Resized ${fileName} to ${imageBuffer.length} bytes.`);
      return imageBuffer;
    } catch (resizeError) {
      console.error(`Error resizing image ${fileName}:`, resizeError);
      // Re-throw the error to be handled by the caller
      throw (
        resizeError instanceof Error
          ? resizeError
          : new Error("Failed to resize image")
      );
    }
  } else {
    // Return original buffer if already within size limit
    return imageBuffer;
  }
} 