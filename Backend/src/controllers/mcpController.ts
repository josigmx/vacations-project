import { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createVacationsMcpServer } from '../mcp/vacationsMcpServer';

// POST /mcp — the MCP server over HTTP (MCP "Streamable HTTP" transport), for any MCP client:
// MCP Inspector, Postman, AI desktop apps... Stateless: a new server + transport for every request.
export async function handleMcpRequest(req: Request, res: Response): Promise<void> {
    const server = createVacationsMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    res.on('close', () => {
        transport.close();
        server.close();
    });

    try {
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
    } catch (error) {
        console.error('MCP request failed:', error);
        if (!res.headersSent) {
            res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
        }
    }
}

// GET / DELETE /mcp — a stateless server has no session to stream or close
export function mcpMethodNotAllowed(_req: Request, res: Response): void {
    res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed' }, id: null });
}
