import {
  QueryFilter,
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

  if (options.startDate) {
    filterGroups.push(
      new QueryFilterGroup([
        new QueryFilter(options.startDate, "GREATER_THAN", "firstReport"),
      ])
    );
  }

  if (options.endDate) {
    filterGroups.push(
      QueryFilterGroup.fromColumnValues(
        [new Date(options.endDate).toISOString()],
        "firstReport"
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
      return `Summary for ${row.stackKey} (Group ID:${row.stackKeyId}) from ${row.firstReport} to ${row.lastReport} ${row.crashSum} crashes`;
    })
    .join("\n");
}
