import Groq from "groq-sdk"

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export const openai = groq

export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 2000
): Promise<string> {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature: 0.7,
  })
  return response.choices[0]?.message?.content ?? ""
}

export async function generateJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 2000
): Promise<T> {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature: 0.3,
    response_format: { type: "json_object" },
  })
  const content = response.choices[0]?.message?.content ?? "{}"
  return JSON.parse(content) as T
}

export async function generateEmbedding(text: string): Promise<number[]> {
  return []
}