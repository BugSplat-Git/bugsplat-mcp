import { config } from "dotenv";
import { getIssue, formatIssueOutput } from "../src/issue.js";
import { postAndWaitForCrashToProcess } from "./crash.js";

config();

const database = process.env.BUGSPLAT_DATABASE!;
const application = "test";
const version = "1.0.0";
const description = "Test crash";

describe("issue integration", () => {
  let crashId: number;
  beforeAll(async () => {
    ({ crashId } = await postAndWaitForCrashToProcess(
      database,
      application,
      version,
      {
        description,
      }
    ));
  });

  describe("getIssue", () => {
    it("should fetch a real issue from BugSplat", async () => {
      const id = crashId;
      const result = await getIssue(database, id);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.crashTime).toBeDefined();
      expect(result.thread.stackFrames[0].functionName).toContain(
        "functionThree"
      );
    });

    it("should throw an error for non-existent issue", async () => {
      const nonExistentId = 999999999;
      await expectAsync(
        getIssue(database, nonExistentId)
      ).toBeRejectedWithError(`Invalid Crash Id`);
    });
  });

  describe("formatIssueOutput", () => {
    it("should format a real issue from BugSplat", async () => {
      const id = crashId;
      const crash = await getIssue(database, id);
      const output = formatIssueOutput(crash, database);

      expect(output).toContain(`Crash #${id} in database ${database}`);
      expect(output).toContain(crash.crashTime);
      expect(output).toContain(`Application: ${crash.appName}`);
      expect(output).toContain(`Version: ${crash.appVersion}`);
      expect(output).toContain(`Description: ${crash.description}`);
    });
  });
});
