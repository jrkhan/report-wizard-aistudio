
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { ChatMessage, ChatRole, ToolCall, Report } from '../types';
import { executeRawQueries } from './databaseService';
import { GEMINI_MODEL_NAME, SYSTEM_INSTRUCTION, RESPONSE_SCHEMA, EDIT_REPORT_PROMPT, EDIT_RESPONSE_SCHEMA } from '../constants';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const availableTools = {
  execute_queries: executeRawQueries,
};

export type StatusUpdateCallback = (update: { toolCalls: ToolCall[] }) => void;

export const getBotResponse = async (
  chatHistory: ChatMessage[],
  onStatusUpdate: StatusUpdateCallback
): Promise<{ text?: string; report?: Report; toolCalls?: ToolCall[] }> => {
  const contents = chatHistory.map(msg => ({
    role: msg.role === ChatRole.USER ? 'user' : 'model',
    parts: [{ text: msg.text || '' }],
  }));

  const executedToolCalls: ToolCall[] = [];
  let wasToolCalled = false;

  try {
    let response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{
          functionDeclarations: [
            {
              name: "execute_queries",
              description: "Executes one or more named SQL queries against the database.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  queries: {
                    type: Type.ARRAY,
                    description: "An array of named queries to execute.",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: "A descriptive, unique name for the query." },
                        query: { type: Type.STRING, description: "The SQL query to execute." }
                      },
                      required: ["name", "query"]
                    }
                  }
                },
                required: ["queries"]
              }
            }
          ]
        }]
      }
    });

    const functionCall = response.candidates?.[0]?.content?.parts?.[0]?.functionCall;

    if (functionCall && functionCall.name === 'execute_queries') {
        wasToolCalled = true;
        const { name, args } = functionCall;
        const currentToolCall: ToolCall = { name, args, status: 'running' };
        executedToolCalls.push(currentToolCall);
        onStatusUpdate({ toolCalls: [...executedToolCalls] });
        
        let result;
        try {
            const queries = (args as any).queries;
            if (!Array.isArray(queries)) throw new Error("Invalid arguments: 'queries' must be an array.");
            
            result = await availableTools.execute_queries(queries);
            currentToolCall.result = result;
            currentToolCall.status = 'success';
        } catch (e) {
            currentToolCall.result = { error: e instanceof Error ? e.message : String(e) };
            currentToolCall.status = 'error';
            onStatusUpdate({ toolCalls: [...executedToolCalls] });
            return { text: "I encountered an error while trying to retrieve the data.", toolCalls: executedToolCalls };
        }

        onStatusUpdate({ toolCalls: [...executedToolCalls] });

        const newContents = [
          ...contents,
          { role: 'model' as const, parts: [{ functionCall }] },
          { role: 'user' as const, parts: [{ functionResponse: { name, response: { content: result } } }] },
        ];

        response = await ai.models.generateContent({
            model: GEMINI_MODEL_NAME,
            contents: newContents,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: RESPONSE_SCHEMA,
            },
        });
    }

    const textResponse = response.text;
    if (textResponse) {
      try {
        let jsonText = textResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/)?.[1] || textResponse;
        const parsedResponse = JSON.parse(jsonText.trim());
        
        return {
          report: parsedResponse,
          toolCalls: executedToolCalls,
        };
      } catch (e) {
         if (wasToolCalled) {
            console.error("Failed to parse final report response as JSON:", e, "Response text:", textResponse);
            return { text: "I received the data, but couldn't format the final report correctly.", toolCalls: executedToolCalls };
         } else {
            return { text: textResponse, toolCalls: executedToolCalls };
         }
      }
    } else {
      return { text: "I was unable to process that request.", toolCalls: executedToolCalls };
    }

  } catch (e) {
    console.error("Error calling Gemini API:", e);
    return { text: "An error occurred while communicating with the AI. Please check the console." };
  }
};


export const getAiAssistedEdit = async (currentReport: Report, userPrompt: string): Promise<Report> => {
    const prompt = `${EDIT_REPORT_PROMPT}

Current Report JSON:
\`\`\`json
${JSON.stringify(currentReport, null, 2)}
\`\`\`

User Request: "${userPrompt}"
`;

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: EDIT_RESPONSE_SCHEMA,
            },
        });

        const jsonText = response.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)?.[1] || response.text;
        const parsedResponse = JSON.parse(jsonText.trim());
        return parsedResponse as Report;

    } catch (e) {
        console.error("Failed to get AI-assisted edit from Gemini API", e);
        throw new Error("The AI failed to edit this report.");
    }
};
