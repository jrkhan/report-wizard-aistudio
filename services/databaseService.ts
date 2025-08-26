
import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_NAME } from "../constants";
import { ReportQuery } from "../types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates mock data for a given SQL query by calling the Gemini API.
 * Can accept parameters to influence the generated data.
 */
const generateMockData = async (sql: string, params?: Record<string, any>): Promise<any[]> => {
    console.log(`Generating mock data for SQL: ${sql}`, "with params:", params);
    
    let paramInstructions = '';
    if (params && Object.keys(params).length > 0) {
        paramInstructions = `
The user has provided the following named parameters for the placeholders (e.g., ':paramName'). Generate data that is consistent with these values:
${JSON.stringify(params, null, 2)}
`;
    }

    const prompt = `
You are a mock JSON data generator. A user has provided a SQL query. Your task is to generate a realistic JSON array of objects that represents the result of this query.
- The array should contain between 3 and 10 items.
- The data should be varied and sensible for the query's context.
- The property names in the JSON objects must match the column names or aliases in the SQL SELECT statement.
- Do NOT include any explanations, markdown, or any text other than the raw JSON array itself.
${paramInstructions}
SQL Query:
\`\`\`sql
${sql}
\`\`\`

JSON Output:
`;

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.8,
            }
        });
        
        let jsonText = response.text;
        const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match) jsonText = match[1];

        const parsed = JSON.parse(jsonText.trim());
        if (Array.isArray(parsed)) return parsed;
        
        console.warn("Mock data generator did not return an array, returning empty array.", parsed);
        return [];
    } catch (e) {
        console.error(`Failed to generate or parse mock data for SQL: ${sql}`, e);
        return [];
    }
};

/**
 * Executes multiple raw (non-parameterized) SQL queries.
 */
export const executeRawQueries = async (queries: { name: string; query: string }[]): Promise<Record<string, any[]>> => {
  console.log(`Executing ${queries.length} raw queries...`);
  const results: Record<string, any[]> = {};
  const promises = queries.map(async ({ name, query }) => {
    results[name] = await generateMockData(query);
  });
  await Promise.all(promises);
  console.log("Mock raw query execution complete.", results);
  return results;
};

/**
 * Executes multiple parameterized SQL queries with user-provided values.
 */
export const executeParameterizedQueries = async (queries: ReportQuery[], paramValues: Record<string, any>): Promise<Record<string, any[]>> => {
    console.log(`Executing ${queries.length} parameterized queries...`, paramValues);
    const results: Record<string, any[]> = {};

    const promises = queries.map(async (reportQuery) => {
        // Create a parameter object specific to this query
        const paramsForQuery: Record<string, any> = {};
        reportQuery.params.forEach(p => {
            paramsForQuery[p.name] = paramValues[p.name];
        });
        results[reportQuery.name] = await generateMockData(reportQuery.sql, paramsForQuery);
    });

    await Promise.all(promises);
    console.log("Mock parameterized query execution complete.", results);
    return results;
};
