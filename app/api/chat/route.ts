export async function POST(request: Request) {
  const body = await request.json();

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: body.max_tokens || 1500,
      system: body.system,
      messages: body.messages,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
        },
      ],
    }),
  });

  const data = await response.json();

  // Extract text from response — web search returns multiple content blocks
  // Collapse them into a single text response for the frontend
  if (data.content && Array.isArray(data.content)) {
    const textParts = data.content
      .filter((block: any) => block.type === "text")
      .map((block: any) => block.text);
    if (textParts.length > 0) {
      data.content = [{ type: "text", text: textParts.join("\n") }];
    }
  }

  return Response.json(data);
}
