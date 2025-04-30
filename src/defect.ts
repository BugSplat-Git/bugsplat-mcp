import { IssueApiClient } from "@bugsplat/js-api-client";
import { createBugSplatClient } from "./bugsplat.js";

export async function createDefect(
  database: string,
  stackKeyId: number,
  notes: string
) {
  const bugsplat = await createBugSplatClient();
  const issueClient = new IssueApiClient(bugsplat);

  return issueClient.postStackKeyIssue(database, stackKeyId, notes);
}

export async function addDefectLink(
  database: string,
  stackKeyId: number,
  notes: string,
  linkDefectId: string
) {
  const bugsplat = await createBugSplatClient();
  const issueClient = new IssueApiClient(bugsplat);

  return issueClient.postStackKeyIssue(
    database,
    stackKeyId,
    notes,
    linkDefectId
  );
}

export async function removeDefectLink(database: string, stackKeyId: number) {
  const bugsplat = await createBugSplatClient();
  const issueClient = new IssueApiClient(bugsplat);

  await issueClient.deleteStackKeyIssue(database, stackKeyId);
}
