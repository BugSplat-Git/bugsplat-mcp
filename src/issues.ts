import {
  CrashesApiClient,
  CrashesApiRow,
  QueryFilterGroup,
} from "@bugsplat/js-api-client";
import { createBugSplatClient } from "./bugsplat.js";

export async function listIssues(
  database: string,
  options: {
    application?: string;
    version?: string;
    stackGroup?: string;
    startDate?: string;
    endDate?: string;
    pageSize?: number;
  }
): Promise<CrashesApiRow[]> {
  const bugsplat = await createBugSplatClient();
  const crashesClient = new CrashesApiClient(bugsplat);
  let filterGroups: QueryFilterGroup[] = [];

  if (options.application) {
    filterGroups.push(
      QueryFilterGroup.fromColumnValues([options.application], "appName")
    );
  }

  if (options.version) {
    filterGroups.push(
      QueryFilterGroup.fromColumnValues([options.version], "appVersion")
    );
  }

  if (options.stackGroup) {
    filterGroups.push(
      QueryFilterGroup.fromColumnValues([options.stackGroup], "stackKey")
    );
  }

  if (options.startDate || options.endDate) {
    filterGroups.push(
      QueryFilterGroup.fromTimeFrame(
        "date",
        options.startDate ? new Date(options.startDate) : undefined,
        options.endDate ? new Date(options.endDate) : undefined
      )
    );
  }

  const response = await crashesClient.getCrashes({
    database,
    filterGroups,
    pageSize: options.pageSize,
  });
  return response.rows;
}

export function formatIssuesOutput(
  rows: CrashesApiRow[],
  database: string
): string {
  return rows
    .map((row, i) => {
      let text = `Crash #${row.id} in database ${database} on ${row.crashTime}\n`;
      if (row.appName) {
        text += `Application: ${row.appName}\n`;
      }
      if (row.appVersion) {
        text += `Version: ${row.appVersion}\n`;
      }
      if (row.userDescription) {
        text += `Description: ${row.userDescription}\n`;
      }
      if (row.appDescription) {
        text += `Key: ${row.appDescription}\n`;
      }
      if (row.user) {
        text += `User: ${row.user}\n`;
      }
      if (row.email) {
        text += `Email: ${row.email}\n`;
      }
      if (row.stackKey) {
        text += `\n${row.stackKey}`;
      }
      if (i < rows.length - 1) {
        text += "\n\n--------------------------------\n\n";
      }
      return text;
    })
    .join("");
}
