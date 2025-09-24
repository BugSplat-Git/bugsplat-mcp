import { CrashApiClient, CrashDetails } from "@bugsplat/js-api-client";
import { createBugSplatClient } from "./bugsplat.js";

export async function getIssue(
  database: string,
  id: number
): Promise<CrashDetails> {
  const bugsplat = await createBugSplatClient();
  const crashesClient = new CrashApiClient(bugsplat);
  const response = await crashesClient.getCrashById(database, id);

  if (!response) {
    throw new Error(`Issue ${id} not found in database ${database}`);
  }

  return response;
}

export function formatIssueOutput(
  crash: CrashDetails,
  database: string
): string {
  let text = `Crash #${crash.id} in database ${database} on ${crash.crashTime}\n`;
  if (crash.appName) {
    text += `Application: ${crash.appName}\n`;
  }
  if (crash.appVersion) {
    text += `Version: ${crash.appVersion}\n`;
  }
  if (crash.description) {
    text += `Description: ${crash.description}\n`;
  }
  if (crash.user) {
    text += `User: ${crash.user}\n`;
  }
  if (crash.email) {
    text += `Email: ${crash.email}\n`;
  }
  if (crash.exceptionCode) {
    text += `Exception Code: ${crash.exceptionCode}\n`;
  }
  if (crash.exceptionMessage) {
    text += `Exception Message: ${crash.exceptionMessage}\n`;
  }
  if (crash.ipAddress) {
    text += `IP Address: ${crash.ipAddress}\n`;
  }
  if (crash.stackKeyId) {
    text += `Stack Key (Group) ID: ${crash.stackKeyId}\n`;
  }
  if (crash.stackKey) {
    text += `Stack Key (Group): ${crash.stackKey}\n`;
  }

  text += `Linked Defects: ${crash.stackKeyDefectLabel || "None"}\n`;

  if (
    crash.thread &&
    crash.thread.stackFrames &&
    Array.isArray(crash.thread.stackFrames)
  ) {
    text += `Stack Trace:\n${crash.thread.stackFrames
      .map((frame) => {
        let stackFrame = frame.functionName;
        if (frame.lineNumber) {
          stackFrame += `:${frame.lineNumber}`;
        }
        if (frame.fileName) {
          stackFrame += ` (${frame.fileName})`;
        }
        return `${stackFrame}`;
      })
      .join("\n")}`;
  }
  return text;
}
