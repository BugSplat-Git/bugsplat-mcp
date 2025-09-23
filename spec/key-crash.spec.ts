import { config } from "dotenv";
import { getKeyCrashes, formatKeyCrashesOutput } from "../src/key-crash.js";
import { postAndWaitForCrashToProcess } from "./crash.js";

// Load environment variables from .env file
config();

const database = process.env.BUGSPLAT_DATABASE!;
const application = "test";
const version = "1.0.0";
const description = "Test crash for key crash functionality";

describe("key-crash integration", () => {
  let crashId: number;
  let stackKeyId: number;

  beforeAll(async () => {
    // Create test crash and get its stack key ID
    const result = await postAndWaitForCrashToProcess(
      database,
      application,
      version,
      {
        description,
      }
    );
    crashId = result.crashId;
    stackKeyId = result.stackKeyId;

    // Create additional crash with same stack key for testing
    await postAndWaitForCrashToProcess(database, application, version, {
      description,
    });
  });

  describe("getKeyCrashes", () => {
    it("should fetch crashes for a specific stack key ID", async () => {
      const crashes = await getKeyCrashes(database, stackKeyId, { pageSize: 10 });

      expect(crashes).toBeDefined();
      expect(Array.isArray(crashes)).toBe(true);
      expect(crashes.length).toBeGreaterThan(0);

      // Check that all returned crashes have the same stackKeyId
      crashes.forEach(crash => {
        expect(crash.stackKeyId).toBe(stackKeyId);
      });
    });

    it("should handle invalid stack key ID", async () => {
      const nonExistentStackKeyId = 999999;
      const crashes = await getKeyCrashes(database, nonExistentStackKeyId, { pageSize: 10 });

      expect(crashes).toBeDefined();
      expect(Array.isArray(crashes)).toBe(true);
      expect(crashes.length).toBe(0);
    });

    it("should respect pageSize parameter", async () => {
      const crashes = await getKeyCrashes(database, stackKeyId, { pageSize: 1 });

      expect(crashes).toBeDefined();
      expect(crashes.length).toBeLessThanOrEqual(1);
    });
  });

  describe("formatKeyCrashesOutput", () => {
    it("should format crash data correctly", async () => {
      const crashes = await getKeyCrashes(database, stackKeyId, { pageSize: 2 });
      const output = formatKeyCrashesOutput(crashes, database, stackKeyId);

      expect(typeof output).toBe("string");
      expect(output).toContain(`Stack Key ID ${stackKeyId}`);
      expect(output).toContain(database);

      if (crashes.length > 0) {
        expect(output).toContain("Found");
        expect(output).toContain("crashes for Stack Key ID");
      }
    });

    it("should handle empty results", () => {
      const output = formatKeyCrashesOutput([], database, 999999);

      expect(typeof output).toBe("string");
      expect(output).toContain("No crashes found");
      expect(output).toContain("Stack Key ID 999999");
      expect(output).toContain(database);
    });

    it("should format multiple crashes with separators", async () => {
      const crashes = await getKeyCrashes(database, stackKeyId, { pageSize: 10 });
      const output = formatKeyCrashesOutput(crashes, database, stackKeyId);

      if (crashes.length > 1) {
        expect(output).toContain("--------------------------------");
      }
    });
  });
});