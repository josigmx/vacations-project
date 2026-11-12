import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { useUser } from "../contexts/UserContext";
import { API_URL, authHeaders, getErrorMessage } from "../utils/api";
import type { McpAnswer, McpExchange } from "../types/Ai";

const MAX_QUESTION = 300;

// The example questions from the project brief
const EXAMPLES = [
  "How many vacations are active now?",
  "What is the average vacation price?",
  "Which future vacations are in European countries?"
];

export default function McpAssistant() {
  const { token, logout } = useUser();

  const [question, setQuestion] = useState<string>("");
  const [exchanges, setExchanges] = useState<McpExchange[]>([]);   // newest first
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const nextId = useRef<number>(1);                                 // a unique id for every question

  async function ask(value: string) {
    const text = value.trim();

    if (!text) {
      setError("Please enter a question");
      return;
    }
    if (text.length > MAX_QUESTION) {
      setError(`The question can be up to ${MAX_QUESTION} characters`);
      return;
    }

    const id = nextId.current++;
    setExchanges((list) => [{ id, question: text }, ...list]);   // shown at once, "Thinking..." until the answer
    setQuestion("");
    setError("");
    setLoading(true);

    // puts the answer (or the error) on the question it belongs to
    function update(result: Partial<McpExchange>) {
      setExchanges((list) => list.map((item) => (item.id === id ? { ...item, ...result } : item)));
    }

    try {
      const response = await fetch(`${API_URL}/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ question: text })
      });

      if (response.status === 401) {
        logout();
        return;
      }
      if (!response.ok) {
        update({ error: await getErrorMessage(response, "Failed to get an answer") });
        return;
      }

      const answer: McpAnswer = await response.json();
      update({ answer });
    } catch {
      update({ error: "Cannot reach the server. Please try again later." });
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    ask(question);
  }

  return (
    <div className="page">
      <h1>MCP Assistant</h1>
      <p className="summary">
        Ask anything about the vacations in the database. The AI answers through the system's MCP server —
        it calls the server's tools to read the real data.
      </p>

      <form className="ai-form" onSubmit={handleSubmit} noValidate>
        <input
          className="ai-input"
          placeholder="e.g. Which vacation has the most likes?"
          value={question}
          maxLength={MAX_QUESTION}
          onChange={(e) => setQuestion(e.target.value)}
          aria-label="Question"
          dir="auto"
        />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Thinking..." : "Ask"}
        </button>
      </form>

      <div className="examples">
        <span>Try:</span>
        {EXAMPLES.map((example) => (
          <button key={example} className="example-btn" onClick={() => ask(example)} disabled={loading}>
            {example}
          </button>
        ))}
      </div>

      {error && <p className="status error">{error}</p>}

      <div className="mcp-list">
        {exchanges.map((item) => (
          <div key={item.id} className="mcp-item">
            <p className="mcp-question" dir="auto">❓ {item.question}</p>

            {!item.answer && !item.error && <p className="mcp-thinking">Thinking... (reading the data through MCP)</p>}
            {item.error && <p className="status error">{item.error}</p>}

            {item.answer && (
              <>
                <p className="mcp-answer" dir="auto">{item.answer.answer}</p>
                <p className="mcp-tools">
                  {item.answer.toolsUsed.length > 0
                    ? `🔧 MCP tools used: ${item.answer.toolsUsed.join(", ")}`
                    : "No MCP tool was needed for this answer"}
                </p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
