import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { getMostLikedVacations, getVacationsSummary, listVacations } from '../services/vacationDataService';

// ============================================
// The MCP server of the vacations system.
//
// MCP (Model Context Protocol) = a standard way to offer TOOLS to an AI model.
// The server describes each tool (name + description + input schema);
// an MCP client (our AI assistant, or any MCP app) lists the tools and calls them.
//
// The model decides WHICH tool — this code decides WHAT runs:
//   - only the tools registered here exist
//   - every input is checked by its zod schema before the handler runs
//   - all the tools only READ vacation data — nothing changes, no user details
// ============================================

// An MCP tool answers with "content" — here one text block holding JSON
function jsonResult(data: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export function createVacationsMcpServer(): McpServer {
    const server = new McpServer({ name: 'vacations-mcp-server', version: '1.0.0' });

    server.registerTool(
        'get_vacations_summary',
        {
            title: 'Vacations summary',
            description:
                'Numbers about ALL the vacations: how many there are in total, how many are active now ' +
                '(started and not ended), upcoming (not started yet) and ended, the average / lowest / highest ' +
                'price in US dollars, and the total number of likes. Use it for "how many" and price-statistics questions.',
            inputSchema: {}
        },
        async () => jsonResult(await getVacationsSummary())
    );

    server.registerTool(
        'list_vacations',
        {
            title: 'List vacations',
            description:
                'The vacations themselves: destination ("City, Country"), description, start and end date ' +
                '(YYYY-MM-DD), price in US dollars, status and number of likes, sorted by start date. ' +
                'Use it to find specific vacations, e.g. by country, continent, dates or price.',
            inputSchema: {
                status: z.enum(['all', 'active', 'upcoming', 'ended']).default('all')
                    .describe('active = started and not ended · upcoming = not started yet · ended = already over · all = every vacation')
            }
        },
        async ({ status }) => jsonResult(await listVacations(status))
    );

    server.registerTool(
        'get_most_liked_vacations',
        {
            title: 'Most liked vacations',
            description: 'The vacations with the most likes, most liked first. Use it for popularity questions.',
            inputSchema: {
                limit: z.number().int().min(1).max(20).default(5).describe('How many vacations to return (1-20)')
            }
        },
        async ({ limit }) => jsonResult(await getMostLikedVacations(limit))
    );

    return server;
}
