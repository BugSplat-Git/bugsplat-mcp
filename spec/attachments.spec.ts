import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { config } from "dotenv";
import { rm } from "fs/promises";
import { getAttachmentDirPath } from "../src/attachment";
import { listAttachments } from "../src/attachments";
import { postCrash } from "./crash";

config();

describe("attachments integration", () => {
  let crashId: number;
  let fileName: string;

  beforeAll(async () => {
    fileName = "mario.png";
    const pngData = Uint8Array.from(atob(
      "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAADAFBMVEUAAACSbQD/AAD/tgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABC44PiAAABAHRSTlP///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AU/cHJQAAAIBJREFUeJydk9EOgCAIRQ3+/5utG0OFdEDnwaac6fRS6wMa9IWWFuhDVbhe+AHj5ohAwKKU5/ePsFPygi6KCNwRgQDYsMkiELAp0bp5TZCCCFbLCXoxDXq9aE6Q5yFiRhmjPFtNkKLiwkoJvmVrApitbn+erGBDOmZxFGyT2Xko3B8VxpwwVaA4AAAAAElFTkSuQmCC"
    ), c => c.charCodeAt(0));

    crashId = await postCrash(process.env.BUGSPLAT_DATABASE!, "test-attachments", "1.0.0", {
      attachments: [
        { filename: fileName, data: pngData },
      ],
    });
  });

  describe("listAttachments", () => {
    it("should download and list attachments from BugSplat", async () => {
      const id = crashId;
      const result = await listAttachments(id);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain(fileName);
    });
  });

  afterAll(async () => {
    await rm(getAttachmentDirPath(crashId), { recursive: true, force: true });
  });
});
