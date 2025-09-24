#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFile } from "fs/promises";
import mime from "mime";
import { join } from "path";
import { z } from "zod";
import { getAttachmentDirPath } from "./attachment.js";
import { formatListAttachmentsOutput, listAttachments } from "./attachments.js";
import { checkCredentials } from "./bugsplat.js";
import { addDefectLink, createDefect, removeDefectLink } from "./defect.js";
import { resizeImageData } from "./image.js";
import { formatIssueOutput, getIssue } from "./issue.js";
import { formatIssuesOutput, listIssues } from "./issues.js";
import { formatKeyCrashesOutput, getKeyCrashes } from "./key-crash.js";
import { formatSummaryOutput, getSummary } from "./summary.js";
import { truncateTextData } from "./text.js";
import { getDocsUrls } from "./docs.js";

const claudeDesktopMaxAttachmentSize = 1048576 * 0.8; // Max response size minus some buffer

const server = new McpServer({
  name: "bugsplat-mcp",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

server.tool(
  "list-issues",
  "List BugSplat issues with optional filtering. The issues tool lists all crashes in the BugSplat database and is useful for determining the most recent crashes.",
  {
    application: z
      .string()
      .optional()
      .describe("Application name to filter by"),
    version: z.string().optional().describe("Version to filter by"),
    stackGroup: z.string().optional().describe("Stack group to filter by"),
    startDate: z
      .string()
      .optional()
      .describe("Start date for filtering (ISO format)"),
    endDate: z
      .string()
      .optional()
      .describe("End date for filtering (ISO format)"),
    pageSize: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .default(10)
      .describe("Number of results per page (1-100, defaults to 10)"),
  },
  async ({
    application,
    version,
    stackGroup,
    startDate,
    endDate,
    pageSize,
  }) => {
    try {
      checkCredentials();
      const rows = await listIssues(process.env.BUGSPLAT_DATABASE!, {
        application,
        version,
        stackGroup,
        startDate,
        endDate,
        pageSize,
      });

      const output = formatIssuesOutput(rows, process.env.BUGSPLAT_DATABASE!);
      return createSuccessResponse(output);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
);

server.tool(
  "get-issue",
  "Get details of a specific BugSplat issue. The issue tool lists the details of a specific crash and is useful for determining the cause of and fixing a specific crash.",
  {
    id: z.number().describe("Issue ID to retrieve"),
  },
  async ({ id }) => {
    try {
      checkCredentials();
      const crash = await getIssue(process.env.BUGSPLAT_DATABASE!, id);
      const output = formatIssueOutput(crash, process.env.BUGSPLAT_DATABASE!);
      return createSuccessResponse(output);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
);

server.tool(
  "get-key-crashes",
  "Get all crashes for a specific Stack Key ID (crash group). This tool lists all individual crashes that belong to the same crash group, which is useful for analyzing patterns within a specific type of crash.",
  {
    stackKeyId: z.number().describe("The Stack Key ID to get crashes for"),
    pageSize: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .default(10)
      .describe("Number of results per page (1-100, defaults to 10)"),
  },
  async ({ stackKeyId, pageSize }) => {
    try {
      checkCredentials();
      const rows = await getKeyCrashes(process.env.BUGSPLAT_DATABASE!, stackKeyId, {
        pageSize,
      });

      const output = formatKeyCrashesOutput(rows, process.env.BUGSPLAT_DATABASE!, stackKeyId);
      return createSuccessResponse(output);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
);

server.tool(
  "get-summary",
  "Get summary of BugSplat issues with optional filtering. The summary tool lists information about groups of crashes and is useful for determining what issues are most prevalent.",
  {
    applications: z
      .array(z.string())
      .optional()
      .describe("Application names to filter by"),
    versions: z.array(z.string()).optional().describe("Versions to filter by"),
    startDate: z
      .string()
      .optional()
      .describe("Start date for filtering (ISO format)"),
    endDate: z
      .string()
      .optional()
      .describe("End date for filtering (ISO format)"),
    pageSize: z
      .number()
      .min(1)
      .max(20)
      .optional()
      .default(10)
      .describe("Number of results per page (1-20, defaults to 10)"),
  },
  async ({ applications, versions, startDate, endDate, pageSize }) => {
    try {
      checkCredentials();
      const rows = await getSummary(process.env.BUGSPLAT_DATABASE!, {
        applications,
        versions,
        startDate,
        endDate,
        pageSize,
      });

      const output = formatSummaryOutput(rows);
      return createSuccessResponse(output);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
);

server.tool(
  "list-attachments",
  "Get list of attachments for a specific BugSplat issue. The attachments tool lists the attachments (log files, screenshots, etc.) for a specific crash and is useful for determining the cause of and fixing a specific crash.",
  {
    id: z.number().describe("Issue ID to retrieve"),
  },
  async ({ id }) => {
    try {
      checkCredentials();
      const files = await listAttachments(id);
      const output = formatListAttachmentsOutput(
        process.env.BUGSPLAT_DATABASE!,
        id,
        files
      );
      return createSuccessResponse(output);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
);

server.tool(
  "get-attachment",
  "Get a specific attachment for a BugSplat issue. Returns the file content as a base64 blob.",
  {
    crashId: z.number().describe("The ID of the crash report"),
    file: z.string().describe("The name of the attachment file to retrieve"),
  },
  async ({ crashId, file }) => {
    try {
      checkCredentials();

      const files = await listAttachments(crashId);

      if (!files.includes(file)) {
        throw new Error(
          `Attachment file not found: ${file} for crash ID ${crashId}.`
        );
      }

      const contents = await readFile(
        join(getAttachmentDirPath(crashId), file)
      );
      const blob = contents.toString("base64");
      const mimeType = mime.getType(file) || "application/octet-stream";

      return await createAttachmentResponse(blob, mimeType, file);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
);

server.tool(
  "create-defect",
  "Create a new defect in a connected defect tracking system.",
  {
    stackKeyId: z
      .number()
      .describe("The Stack Key ID you'd like to log as a defect"),
    notes: z.string().describe("Notes about the defect you'd like to log"),
  },
  async ({ stackKeyId, notes }) => {
    try {
      checkCredentials();

      const result = await createDefect(
        process.env.BUGSPLAT_DATABASE!,
        stackKeyId,
        notes
      );

      const { defectId } = await result.json();

      return await createSuccessResponse(`Defect created with ID ${defectId}.`);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
);

server.tool(
  "add-defect-link",
  "Add a link between a BugSplat issue and an existing defect in a connected defect tracking system.",
  {
    stackKeyId: z
      .number()
      .describe("The Stack Key ID you'd like to log as a defect"),
    notes: z.string().describe("Notes about the defect you'd like to log"),
    linkDefectId: z
      .string()
      .describe("The ID of the defect you'd like to link to"),
  },
  async ({ stackKeyId, notes, linkDefectId }) => {
    try {
      checkCredentials();

      await addDefectLink(
        process.env.BUGSPLAT_DATABASE!,
        stackKeyId,
        notes,
        linkDefectId
      );

      return await createSuccessResponse(
        `Defect ${linkDefectId} linked to issue ${stackKeyId}.`
      );
    } catch (error) {
      return createErrorResponse(error);
    }
  }
);

server.tool(
  "remove-defect-link",
  "Remove the link between a BugSplat issue and a connected defect tracking system. The defect in the defect tracking system will not be deleted, but the link will be removed.",
  {
    stackKeyId: z
      .number()
      .describe("The Stack Key ID you'd like to remove the defect from"),
  },
  async ({ stackKeyId }) => {
    try {
      checkCredentials();

      await removeDefectLink(process.env.BUGSPLAT_DATABASE!, stackKeyId);

      return await createSuccessResponse(
        `Defect link removed from issue ${stackKeyId}.`
      );
    } catch (error) {
      return createErrorResponse(error);
    }
  }
);

server.tool(
  "get-docs-urls",
  "Get all documentation URLs from BugSplat docs sitemap with .md extensions. Returns an array of URLs that can be used to fetch documentation content.",
  {},
  async () => {
    try {
      const urls = await getDocsUrls();
      return createSuccessResponse(`Found ${urls.length} documentation URLs:\n${urls.join('\n')}`);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
);

type McpContent =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType: string; fileName: string };

interface McpResponse {
  [key: string]: unknown;
  content: McpContent[];
  isError?: boolean;
}

function createSuccessResponse(text: string): McpResponse {
  return {
    content: [
      {
        type: "text" as const,
        text,
      },
    ],
  };
}

async function createAttachmentResponse(
  blob: string,
  mimeType: string,
  fileName: string
): Promise<McpResponse> {
  if (mimeType.startsWith("image/")) {
    let imageBuffer = Buffer.from(blob, "base64");
    let resizedBlob = blob;

    try {
      const processedBuffer = await resizeImageData(
        imageBuffer,
        fileName,
        claudeDesktopMaxAttachmentSize
      );
      resizedBlob = processedBuffer.toString("base64");
    } catch (resizeError) {
      return createErrorResponse(
        resizeError instanceof Error
          ? resizeError
          : new Error("Failed to process image")
      );
    }

    return {
      content: [
        {
          type: "image" as const,
          data: resizedBlob,
          mimeType,
          fileName,
        },
      ],
    };
  } else if (mimeType.startsWith("text/")) {
    const buffer = Buffer.from(blob, "base64");

    const textContent = truncateTextData(
      buffer,
      claudeDesktopMaxAttachmentSize
    );

    return {
      content: [
        {
          type: "text" as const,
          text: textContent,
        },
      ],
    };
  } else {
    throw new Error(`Unsupported attachment type: ${mimeType}`);
  }
}

function createErrorResponse(error: unknown): McpResponse {
  const message =
    error instanceof Error ? error.message : "An unknown error occurred";
  return {
    content: [
      {
        type: "text" as const,
        text: `Error: ${message}`,
      },
    ],
    isError: true,
  };
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("BugSplat MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
