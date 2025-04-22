import { Buffer } from "node:buffer";

export function truncateTextData(
  buffer: Buffer,
  maxSize: number
): string {
  let textContent: string;

  if (buffer.length > maxSize) {
    // If buffer is too large, take the last part
    const truncatedBuffer = buffer.subarray(buffer.length - maxSize);
    textContent = truncatedBuffer.toString("utf-8");
    // Add a notice about truncation
    textContent = `... (file truncated to last ${maxSize} bytes)\n\n${textContent}`;
  } else {
    // If buffer size is acceptable, use the full content
    textContent = buffer.toString("utf-8");
  }

  return textContent;
} 