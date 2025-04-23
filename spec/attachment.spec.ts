import { config } from "dotenv";
import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { getAttachment, getAttachmentDirPath } from "../src/attachment.js";

config();

describe("attachment integration", () => {
  let crashId: number;
  let attachmentDir: string;
  let attachmentName: string;

  beforeAll(async () => {
    crashId = 123456789123456789;
    attachmentDir = getAttachmentDirPath(crashId);
    attachmentName = "log.txt";
    await mkdir(attachmentDir, { recursive: true });
    await writeFile(join(attachmentDir, attachmentName), "hello world!");
  });

  describe("getAttachment", () => {
    it("should get attachment from local cache", async () => {
      const id = crashId;
      const result = await getAttachment(id, attachmentName);
      expect(result).toBeDefined();
      expect(result.toString()).toBe("hello world!");
    });
  });

  afterAll(async () => {
    await rm(attachmentDir, { recursive: true, force: true });
  });
});
