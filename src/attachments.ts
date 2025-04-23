import AdmZip from "adm-zip";
import { existsSync } from "fs";
import { mkdir, readdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { getAttachmentDirPath } from "./attachment.js";
import { getIssue } from "./issue.js";

export async function listAttachments(id: number) {
  const attachmentDir = getAttachmentDirPath(id);

  if (!existsSync(attachmentDir)) {
    await downloadAttachments(id, attachmentDir);
  }

  return readdir(attachmentDir);
}

export function formatListAttachmentsOutput(
  database: string,
  id: number,
  files: string[]
): string {
  return (
    `Attachments for crash #${id} in database ${database}\n` +
    files.map((file) => `- ${file}`).join("\n")
  );
}

async function downloadAttachments(id: number, attachmentDir: string) {
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
