import { config } from "dotenv";
import { formatSummaryOutput, getSummary } from "../src/summary.js";
import { postAndWaitForCrashToProcess } from "./crash.js";

// Load environment variables from .env file
config();

const database = process.env.BUGSPLAT_DATABASE!;
const application = "test";
const version = "1.0.0";
const description = "Test crash";

describe("summary integration", () => {
  let crashId: number;
  beforeAll(async () => {
    crashId = await postAndWaitForCrashToProcess(
      database,
      application,
      version,
      {
        description,
      }
    );
  });

  describe("getSummary", () => {
    it("should fetch summary from BugSplat", async () => {
      const result = await getSummary(database, {
        pageSize: 5,
        application,
        version,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      const testSummary = result[0];
      expect(testSummary.stackKey).toBeDefined();
      expect(testSummary.firstReport).toBeDefined();
      expect(testSummary.lastReport).toBeDefined();
      expect(testSummary.crashSum).toBeGreaterThan(0);
    });

    it("should apply filters correctly", async () => {
      const result = await getSummary(database, {
        application,
        version,
        pageSize: 5,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      const testSummary = result[0];
      expect(testSummary.stackKey).toBeDefined();
      expect(testSummary.crashSum).toBeGreaterThan(0);
    });
  });

  describe("formatSummaryOutput", () => {
    it("should format summary from BugSplat", async () => {
      const summaries = await getSummary(database, {
        application,
        version,
        pageSize: 2,
      });

      const output = formatSummaryOutput(summaries);
      const testSummary = summaries[0];

      expect(output).toContain(`Summary for ${testSummary.stackKey}`);
      expect(output).toContain(`from ${testSummary.firstReport}`);
      expect(output).toContain(`to ${testSummary.lastReport}`);
      expect(output).toContain(`${testSummary.crashSum} crashes`);
    });
  });
});
