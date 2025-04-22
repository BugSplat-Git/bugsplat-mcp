import AdmZip from "adm-zip";
import { lstat, mkdir, readdir, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { getIssue } from "./issue.js";
import { existsSync } from "fs";

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

export async function getAttachmentsList(id: number) {
  const attachmentDir = getAttachmentDirPath(id);

  if (!existsSync(attachmentDir)) {
    const crash = await getIssue(process.env.BUGSPLAT_DATABASE!, id);

    if (crash.dumpfileSize > 1024 * 1024 * 50) {
      throw new Error("Attachments zip file is too large to download");
    }

    await mkdir(attachmentDir, { recursive: true });

    const response = await fetch(crash.dumpfile);
    const buffer = await response.arrayBuffer();
    const zipFileName = `${id}-${Date.now()}.zip`;
    const zipFilePath = join(attachmentDir, zipFileName);
    await writeFile(zipFilePath, Buffer.from(buffer));

    new AdmZip(zipFilePath).extractAllTo(attachmentDir, true);
    await rm(zipFilePath);
  }

  return readdir(attachmentDir);
}

export function formatAttachmentsListOutput(
  database: string,
  id: number,
  files: string[]
): string {
  return (
    `Attachments for crash #${id} in database ${database}\n` +
    files.map((file) => `- ${file}`).join("\n")
  );
}

export async function listDownloadedAttachmentDirectories() {
  if (!existsSync(attachmentBaseDir)) {
    return [];
  }
  
  return readdir(attachmentBaseDir);
}