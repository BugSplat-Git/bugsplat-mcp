# BugSplat MCP Server Prototype

This is a prototype implementation of a Model Context Protocol (MCP) server for BugSplat integration. test test test

## Getting Started 👨‍🏫

1. Install `bugsplat-mcp` globally with npm:
```bash
npm i -g bugsplat-mcp
```

2. Add a local MCP server to [Claude Desktop](https://claude.ai/download) via `Settings > Developer > Edit Config`. Add the path to `npx` under `command` and the path to `bugsplat-mcp` under `args`. Finally add env values for `BUGSPLAT_DATABASE`, `BUGSPLAT_CLIENT_ID`, and `BUGSPLAT_CLIENT_SECRET`.
```json
{
  "mcpServers": {
    ...
    "bugsplat-mcp": {
      "command": "npx",
      "args": [
        "bugsplat-mcp"
      ],
      "env": {
        "BUGSPLAT_DATABASE": "fred",
        "BUGSPLAT_CLIENT_ID": "***",
        "BUGSPLAT_CLIENT_SECRET": "***"
      }
    }
  }
}
```

3. Open Claude and ask about BugSplat.

## Available Tools 🧰

The server provides the following tools for interacting with BugSplat:

### get-issues
Get a list of BugSplat issues with optional filtering:
- `application`: Filter by application name
- `version`: Filter by version
- `stackGroup`: Filter by stack frame the crash is grouped by
- `startDate`: Filter by start date (ISO format)
- `endDate`: Filter by end date (ISO format)
- `pageSize`: Number of results per page (1-99, defaults to 50)

### get-issue
Get detailed information about a specific issue:
- `id`: The issue ID to retrieve

### get-summary
Get a summary of BugSplat issues with optional filtering:
- `applications`: Array of application names to filter by
- `versions`: Array of versions to filter by
- `startDate`: Filter by start date (ISO format)
- `endDate`: Filter by end date (ISO format)
- `pageSize`: Number of results per page (1-20, defaults to 10)

Each tool will automatically use the credentials provided in your `.env` file. 

## Developing 👨‍💻

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your BugSplat credentials:
```
BUGSPLAT_DATABASE=your_database
BUGSPLAT_CLIENT_ID=your_client_id
BUGSPLAT_CLIENT_SECRET=your_client_secret
```

3. Start the server:
```bash
npm run debug
```

4. Open your browser to [http://127.0.0.1:6274](http://127.0.0.1:6274) to access the MCP Inspector interface.

## Testing 🧪

The project uses Jasmine for testing. Due to ESM compatibility issues with ts-node, tests are run from built JavaScript files rather than directly from TypeScript.

### Running Tests

```bash
npm test
```

This will:
1. Build the TypeScript files into JavaScript
2. Run the Jasmine test suite

### Debugging Tests

You can debug tests using VS Code in two ways:

1. Using the Test Explorer:
   - Open the Testing sidebar in VS Code
   - Click the debug icon next to any test to start debugging
   - Note: You must rebuild (`npm run build:test`) if you make changes to test files

2. Using Launch Configurations:
   - Open the Run and Debug sidebar in VS Code
   - Select "Debug Tests" from the dropdown
   - Press F5 to start debugging
   - The configuration will automatically build before running

### Important Notes

- If you modify any test or source files, you need to rebuild before running tests again
- The build step is necessary because ts-node doesn't play well with ESM imports
- Tests have a 30-second timeout to accommodate API calls
- Environment variables from your `.env` file are automatically loaded
