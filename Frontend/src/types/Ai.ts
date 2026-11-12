// POST /ai/recommendation → a structured trip recommendation
export interface TripRecommendation {
  isDestination: boolean;
  destination: string;
  summary: string;
  bestTimeToVisit: string;
  topAttractions: string[];
  localFood: string[];
  tips: string[];
  itinerary: { day: number; plan: string }[];
}

// POST /ai/ask → the answer + the MCP tools that produced it
export interface McpAnswer {
  answer: string;
  toolsUsed: string[];
}

// One question on the MCP page (with its answer, once it arrives)
export interface McpExchange {
  id: number;
  question: string;
  answer?: McpAnswer;
  error?: string;
}
