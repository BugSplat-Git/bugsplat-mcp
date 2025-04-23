import { config } from "dotenv";
import { rm } from "fs/promises";
import { getAttachmentDirPath } from "../src/attachment.js";
import { listAttachments } from "../src/attachments.js";
import { postCrash } from "./crash.js";

config();

describe("attachments integration", () => {
  let crashId: number;
  let fileName: string;

  beforeAll(async () => {
    fileName = "mario.png";
    const additionalFormDataParams = [
      {
        key: fileName,
        value: createAdditionalFile(fileName),
        filename: fileName,
      },
    ];
    crashId = await postCrash(process.env.BUGSPLAT_DATABASE!, "test", "1.0.0", {
      additionalFormDataParams,
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

function createAdditionalFile(fileName: string): File {
  const base64data =
    "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAADAFBMVEUAAACSbQD/AAD/tgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABC44PiAAABAHRSTlP///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AU/cHJQAAAIBJREFUeJydk9EOgCAIRQ3+/5utG0OFdEDnwaac6fRS6wMa9IWWFuhDVbhe+AHj5ohAwKKU5/ePsFPygi6KCNwRgQDYsMkiELAp0bp5TZCCCFbLCXoxDXq9aE6Q5yFiRhmjPFtNkKLiwkoJvmVrApitbn+erGBDOmZxFGyT2Xko3B8VxpwwVaA4AAAAAElFTkSuQmCC";
  const contentType = "image/png";
  const blob = base64toBlob(base64data, contentType, 512);
  return new File([blob], fileName);
}

function base64toBlob(
  base64Data: string,
  contentType: string,
  sliceSize: number
): Blob {
  const byteCharacters = atob(base64Data);
  const byteArrays: Uint8Array[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    byteArrays.push(new Uint8Array(byteNumbers));
  }

  return new Blob(byteArrays, { type: contentType });
}
