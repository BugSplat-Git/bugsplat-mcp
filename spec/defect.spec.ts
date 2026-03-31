import { describe, it, expect, beforeAll } from "vitest";
import { config } from "dotenv";
import { postAndWaitForCrashToProcess } from "./crash";
import {
  addDefectLink,
  createDefect,
  removeDefectLink,
} from "../src/defect";

config();

const database = process.env.BUGSPLAT_DATABASE!;
const application = "test-defect";
const version = "1.0.0";
const description = "Test crash";
const existingDefectId = process.env.BUGSPLAT_EXISTING_DEFECT_ID!;

describe("defect integration", () => {
  let stackKeyId: number;

  beforeAll(async () => {
    if (!existingDefectId) {
      throw new Error("BUGSPLAT_EXISTING_DEFECT_ID is not set");
    }

    ({ stackKeyId } = await postAndWaitForCrashToProcess(
      database,
      application,
      version,
      {
        description,
      }
    ));
  });

  describe("createDefect", () => {
    it("should create a real defect in BugSplat", async () => {
      const result = await createDefect(database, stackKeyId, "Test defect");
      const { defectId } = await result.json();

      expect(defectId).toBeDefined();
    });
  });

  describe("addDefectLink", () => {
    it("should add a defect link to a real defect in BugSplat", async () => {
      const result = await addDefectLink(
        database,
        stackKeyId,
        "Test defect",
        existingDefectId
      );
      const { defectId } = await result.json();

      expect(defectId).toBeDefined();
    });
  });

  describe("removeDefectLink", () => {
    it("should remove a defect link from a real defect in BugSplat", async () => {
      await removeDefectLink(database, stackKeyId);
    });
  });
});
