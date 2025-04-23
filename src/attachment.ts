import { existsSync } from "fs";
import { lstat, readdir, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

if (!process.env.BUGSPLAT_DATABASE) {
  throw new Error("BUGSPLAT_DATABASE environment variable is not defined");
}

export const bugsplatMcpTempDir = join(tmpdir(), "bugsplat-mcp");

const attachmentBaseDir = join(
  bugsplatMcpTempDir,
  process.env.BUGSPLAT_DATABASE!
);

export async function deleteOldAttachments() {
  const folders = await listDownloadedAttachmentDirectories();
  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

  for (const folder of folders) {
    const folderPath = join(attachmentBaseDir, folder);
    const stats = await lstat(folderPath);
    if (stats.isDirectory() && stats.birthtimeMs < fourteenDaysAgo) {
      await rm(folderPath, { recursive: true, force: true });
    }
  }
}

export async function getAttachment(id: number, file: string) {
  const attachmentDir = getAttachmentDirPath(id);
  const filePath = join(attachmentDir, file);

  if (!existsSync(filePath)) {
    throw new Error("File not found");
  }

  return readFile(filePath);
}

export function getAttachmentDirPath(id: number) {
  return join(bugsplatMcpTempDir, process.env.BUGSPLAT_DATABASE!, `${id}`);
}

export async function listDownloadedAttachmentDirectories() {
  if (!existsSync(attachmentBaseDir)) {
    return [];
  }

  return readdir(attachmentBaseDir);
}
