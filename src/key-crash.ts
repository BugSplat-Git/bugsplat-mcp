import {
  KeyCrashApiClient,
  CrashesApiRow,
} from "@bugsplat/js-api-client";
import { createBugSplatClient } from "./bugsplat.js";

export async function getKeyCrashes(
  database: string,
  stackKeyId: number,
  options: {
    pageSize?: number;
  } = {}
): Promise<CrashesApiRow[]> {
  const bugsplat = await createBugSplatClient();
  const keyCrashClient = new KeyCrashApiClient(bugsplat);

  const response = await keyCrashClient.getCrashes({
    database,
    stackKeyId,
    pageSize: options.pageSize || 10,
  });

  return response.rows;
}

export function formatKeyCrashesOutput(
  rows: CrashesApiRow[],
  database: string,
  stackKeyId: number
): string {
  if (rows.length === 0) {
    return `No crashes found for Stack Key (Group) ID ${stackKeyId} in database ${database}`;
  }

  let text = `Found ${rows.length} crashes for Stack Key (Group) ID ${stackKeyId} in database ${database}:\n\n`;

  return text + rows
    .map((row, i) => {
      let crashText = `Crash #${row.id} on ${row.crashTime}\n`;
      if (row.appName) {
        crashText += `Application: ${row.appName}\n`;
      }
      if (row.appVersion) {
        crashText += `Version: ${row.appVersion}\n`;
      }
      if (row.userDescription) {
        crashText += `Description: ${row.userDescription}\n`;
      }
      if (row.appDescription) {
        crashText += `Key: ${row.appDescription}\n`;
      }
      if (row.user) {
        crashText += `User: ${row.user}\n`;
      }
      if (row.email) {
        crashText += `Email: ${row.email}\n`;
      }
      if (row.stackKey) {
        crashText += `Stack Key: ${row.stackKey}\n`;
      }

      crashText += `Linked Defects: ${row.skDefectLabel || "None"}\n`;

      if (i < rows.length - 1) {
        crashText += "\n--------------------------------\n\n";
      }
      return crashText;
    })
    .join("");
}