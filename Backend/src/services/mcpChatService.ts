import { Content, Part } from '@google/genai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createVacationsMcpServer } from '../mcp/vacationsMcpServer';
import { generate } from './llmService';

// ============================================
// mcpChatService — answers a question about the data THROUGH the MCP server.
//
//   1. An MCP client connects to our MCP server and asks which tools it has.
//   2. Gemini gets the question + the tool descriptions, and asks to call a tool.
//   3. The MCP client calls that tool on the MCP server and gets real data.
//   4. The data goes back to Gemini, which writes the answer.
//      (steps 2-4 can repeat when the model needs more than one tool)
//
// The client and the server talk the real MCP protocol, through an in-memory channel
// (same process, no network). The same server is also open over HTTP at POST /mcp.
// ============================================

const MAX_ROUNDS = 5;

const SYSTEM_INSTRUCTION = `
You are the data assistant of a vacations website.
Answer questions about the vacations ONLY with data from the provided tools.
Never guess numbers, dates or prices: get them from a tool.
"Active" means started and not ended. "Upcoming" / "future" means not started yet.
You may use general knowledge to interpret the data (for example, which countries are in Europe).
Prices are in US dollars.
If the question is not about the vacations data, say that you only answer questions about the vacations.
Answer in the language of the user, short and clear.
Write plain text without Markdown (no **, no #). For a list, put each item on its own line starting with "• ".
`;

export interface McpAnswer {
    answer: string;
    toolsUsed: string[];
}

export async function askWithMcp(question: string): Promise<McpAnswer> {
    // 1. connect an MCP client to the MCP server
    const server = createVacationsMcpServer();
    const client = new Client({ name: 'vacations-ai-assistant', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    try {
        // the tools the MCP server offers → the format Gemini understands
        const { tools } = await client.listTools();
        const functionDeclarations = tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            parametersJsonSchema: tool.inputSchema
        }));

        const contents: Content[] = [{ role: 'user', parts: [{ text: question }] }];
        const toolsUsed: string[] = [];

        for (let round = 0; round < MAX_ROUNDS; round++) {
            // 2. Gemini answers, or asks to call tools
            const response = await generate({
                contents,
                config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ functionDeclarations }] }
            });

            const calls = response.functionCalls ?? [];
            if (calls.length === 0) {
                return { answer: response.text?.trim() || 'I could not find an answer.', toolsUsed };
            }

            // keep the model's turn exactly as it came — newer Gemini models need it back unchanged
            contents.push(response.candidates?.[0]?.content ?? { role: 'model', parts: calls.map((call) => ({ functionCall: call })) });

            // 3. run every requested tool through the MCP client
            const results: Part[] = [];
            for (const call of calls) {
                const name = call.name ?? '';
                toolsUsed.push(name);
                results.push({ functionResponse: { id: call.id, name, response: await callMcpTool(client, name, call.args ?? {}) } });
            }

            // 4. the results go back to Gemini in the next round
            contents.push({ role: 'user', parts: results });
        }

        return { answer: 'The question needed too many steps. Please ask something more specific.', toolsUsed };

    } finally {
        await client.close();
        await server.close();
    }
}

// One tool call on the MCP server. An error (unknown tool, bad input) goes back to the model as an error,
// so it can explain or try again — it does not crash the request.
async function callMcpTool(client: Client, name: string, args: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
        const result = await client.callTool({ name, arguments: args });
        const content = (result.content ?? []) as { type: string; text?: string }[];
        const text = content.map((block) => block.text ?? '').join('\n');
        return result.isError ? { error: text } : { output: text };
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'Tool failed' };
    }
}
