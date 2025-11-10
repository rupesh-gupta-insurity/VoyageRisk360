import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface RiskScores {
  overall: number;
  weather: number;
  piracy: number;
  traffic: number;
  claims: number;
}

interface RouteInfo {
  name?: string;
  waypoints: Array<{ latitude: number; longitude: number }>;
}

export async function generateRiskInsights(
  riskScores: RiskScores,
  routeInfo: RouteInfo
): Promise<string> {
  try {
    if (!routeInfo.waypoints || routeInfo.waypoints.length === 0) {
      return "Unable to generate insights: route has no waypoints.";
    }

    const fromLat = routeInfo.waypoints[0]?.latitude;
    const fromLon = routeInfo.waypoints[0]?.longitude;
    const toLat = routeInfo.waypoints[routeInfo.waypoints.length - 1]?.latitude;
    const toLon = routeInfo.waypoints[routeInfo.waypoints.length - 1]?.longitude;

    if (fromLat === undefined || fromLon === undefined || toLat === undefined || toLon === undefined) {
      return "Unable to generate insights: invalid waypoint coordinates.";
    }

    const prompt = `You are a maritime insurance risk analyst. Analyze the following voyage risk assessment and provide a concise, professional explanation for underwriters.

Route: ${routeInfo.name || 'Custom Route'}
From: ${fromLat.toFixed(2)}°, ${fromLon.toFixed(2)}°
To: ${toLat.toFixed(2)}°, ${toLon.toFixed(2)}°

Risk Scores (0-100):
- Overall Risk: ${riskScores.overall}%
- Weather Risk: ${riskScores.weather}%
- Piracy Risk: ${riskScores.piracy}%
- Traffic Density: ${riskScores.traffic}%
- Historical Claims: ${riskScores.claims}%

Provide a 2-3 sentence professional analysis highlighting the key risk factors and any recommendations. Be direct and actionable.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content:
            "You are a maritime insurance underwriting expert. Provide concise, professional risk assessments in 2-3 sentences. Focus on actionable insights.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_completion_tokens: 256,
    });

    return response.choices[0].message.content || "Unable to generate insights.";
  } catch (error) {
    console.error("Error generating AI insights:", error);
    return "AI insights temporarily unavailable. Risk scores are based on real-time maritime data.";
  }
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatContext {
  totalPolicies?: number;
  totalShipments?: number;
  totalClaims?: number;
  recentActivity?: string;
}

export async function generateChatResponse(
  messages: ChatMessage[],
  context?: ChatContext
): Promise<string> {
  try {
    const systemPrompt = `You are an AI assistant for VoyageRisk360, a maritime insurance risk assessment platform. You help underwriters analyze voyage risks, policies, shipments, and claims.

Platform Context:
${context?.totalPolicies ? `- ${context.totalPolicies} active insurance policies` : ''}
${context?.totalShipments ? `- ${context.totalShipments} tracked shipments` : ''}
${context?.totalClaims ? `- ${context.totalClaims} total claims` : ''}

Your role:
- Answer questions about maritime risk assessment, policies, shipments, and claims
- Provide underwriting guidance and insights
- Explain risk factors (weather, piracy, traffic, historical claims)
- Help users understand data and make informed decisions
- Be professional, concise, and actionable

Keep responses focused and practical. When users ask about specific data, acknowledge what information is available in the platform.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_completion_tokens: 512,
    });

    return response.choices[0].message.content || "I'm here to help with your maritime risk assessment questions.";
  } catch (error) {
    console.error("Error generating chat response:", error);
    return "I'm temporarily unable to respond. Please try again.";
  }
}

export async function generateChatResponseStream(
  messages: ChatMessage[],
  context?: ChatContext
): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
  const systemPrompt = `You are an AI assistant for VoyageRisk360, a maritime insurance risk assessment platform. You help underwriters analyze voyage risks, policies, shipments, and claims.

Platform Context:
${context?.totalPolicies ? `- ${context.totalPolicies} active insurance policies` : ''}
${context?.totalShipments ? `- ${context.totalShipments} tracked shipments` : ''}
${context?.totalClaims ? `- ${context.totalClaims} total claims` : ''}

Your role:
- Answer questions about maritime risk assessment, policies, shipments, and claims
- Provide underwriting guidance and insights
- Explain risk factors (weather, piracy, traffic, historical claims)
- Help users understand data and make informed decisions
- Be professional, concise, and actionable

Keep responses focused and practical. When users ask about specific data, acknowledge what information is available in the platform.`;

  const stream = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    max_completion_tokens: 512,
    stream: true,
  });

  return stream;
}
