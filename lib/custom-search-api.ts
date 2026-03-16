// Custom Search API configuration for enterprise use
// Allows organizations to configure their own search endpoints
// for grounding (HR policies, legal precedents, etc.)

export interface CustomSearchConfig {
  apiEndpoint: string;
  apiKey: string;
  searchDomain: string; // e.g., "hr-policies", "legal-precedents"
}

export function buildSearchTools(customSearch?: CustomSearchConfig): any[] {
  const tools: any[] = [{ googleSearch: {} }];

  // When custom search is configured, add retrieval tool
  // This uses Vertex AI's "Grounding with Your Search API" feature
  if (customSearch) {
    tools.push({
      retrieval: {
        externalApi: {
          apiSpec: customSearch.apiEndpoint,
          apiKey: customSearch.apiKey,
        },
      },
    });
  }

  return tools;
}
