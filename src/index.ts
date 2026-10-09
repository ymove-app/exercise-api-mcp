#!/usr/bin/env node

/**
 * YMove Exercise API - MCP Server (local, stdio)
 *
 * Lets Claude browse exercises, generate workouts, and build training programs
 * using the YMove Exercise Video API.
 *
 * Setup in Claude Desktop / Claude Code:
 * {
 *   "mcpServers": {
 *     "ymove": {
 *       "command": "npx",
 *       "args": ["ymove-exercise-mcp"],
 *       "env": { "YMOVE_API_KEY": "your_api_key" }
 *     }
 *   }
 * }
 *
 * No install needed in clients that support remote servers: use the hosted
 * endpoint https://exercise-api.ymove.app/mcp with an X-API-Key header.
 *
 * Get your API key at https://ymove.app/exercise-api/signup (free trial).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools, DEFAULT_BASE_URL } from './tools';

const API_KEY = process.env.YMOVE_API_KEY;
const BASE = process.env.YMOVE_BASE_URL || DEFAULT_BASE_URL;

if (!API_KEY) {
  console.error('Error: YMOVE_API_KEY environment variable is required.');
  console.error('Get your API key at https://ymove.app/exercise-api/signup');
  process.exit(1);
}

const server = new McpServer({
  name: 'ymove-exercise-api',
  version: '1.1.0',
});

registerTools(server, { apiKey: API_KEY, baseUrl: BASE });

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('MCP server error:', err);
  process.exit(1);
});
