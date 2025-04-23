import {
  CrashApiClient,
  OAuthClientCredentialsClient,
} from "@bugsplat/js-api-client";
import { BugSplat, BugSplatOptions, BugSplatResponseType } from "bugsplat";
import { config } from "dotenv";

config();

const clientId = process.env.BUGSPLAT_CLIENT_ID!;
const clientSecret = process.env.BUGSPLAT_CLIENT_SECRET!;

export async function postAndWaitForCrashToProcess(
  database: string,
  application: string,
  version: string,
  options?: BugSplatOptions
) {
  const crashId = await postCrash(database, application, version, options);
  const client = await OAuthClientCredentialsClient.createAuthenticatedClient(
    clientId,
    clientSecret
  );
  const crashClient = new CrashApiClient(client);
  const crash = await crashClient.getCrashById(database, crashId);

  let stackKeyId = crash.stackKeyId;

  if (stackKeyId > 0) {
    return crashId;
  }

  for (let i = 0; i < 60; i++) {
    const crash = await crashClient.getCrashById(database, crashId);
    stackKeyId = crash.stackKeyId as number;
    if (stackKeyId > 0) {
      break;
    }
    await delay(3000);
  }

  return crashId;
}

export async function postCrash(
  database: string,
  application: string,
  version: string,
  options?: BugSplatOptions
) {
  // Store original console methods
  const originalLog = console.log;
  const originalError = console.error;

  // Silence console output
  console.log = () => {};
  console.error = () => {};

  try {
    const bugsplat = new BugSplat(database, application, version);
    let crashId = 0;

    try {
      functionOne();
    } catch (error: any) {
      const { response } = (await bugsplat.post(
        error,
        options
      )) as BugSplatResponseType<null>;
      crashId = response.crash_id;
    }

    return crashId;
  } finally {
    // Restore console methods
    console.log = originalLog;
    console.error = originalError;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function functionOne() {
  functionTwo();
}

function functionTwo() {
  functionThree();
}

function functionThree() {
  throw new Error("Test crash from function three");
}
