import {
  QueryFilterGroup,
  SummaryApiClient,
  SummaryApiRow,
} from "@bugsplat/js-api-client";
import { createBugSplatClient } from "./bugsplat.js";

export async function getSummary(
  database: string,
  options: {
    applications?: string[];
    versions?: string[];
    startDate?: string;
    endDate?: string;
    pageSize?: number;
  }
): Promise<SummaryApiRow[]> {
  const bugsplat = await createBugSplatClient();
  const summaryClient = new SummaryApiClient(bugsplat);
  let filterGroups: QueryFilterGroup[] = [];

  if (options.startDate || options.endDate) {
    filterGroups.push(
      QueryFilterGroup.fromTimeFrame(
        "firstReport",
        options.startDate ? new Date(options.startDate) : undefined,
        options.endDate ? new Date(options.endDate) : undefined
      )
    );
  }

  const response = await summaryClient.getSummary({
    database,
    applications: options.applications,
    versions: options.versions,
    pageSize: options.pageSize,
    filterGroups,
  });

  return response.rows;
}

export function formatSummaryOutput(rows: SummaryApiRow[]): string {
  return rows
    .map((row) => {
      return `Summary for ${row.stackKey} from ${row.firstReport} to ${row.lastReport} ${row.crashSum} crashes`;
    })
    .join("\n");
}
