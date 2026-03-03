// lib/ai/router.ts
/**
 * Intelligent AI Router
 * Selects the best model based on query type, user tier, and availability
 */

export type AIMode = 'nano' | 'pro' | 'auto';
export type AIProvider = 'openai' | 'gemini';

export interface RouterDecision {
  provider: AIProvider;
  model: string;
  mode: AIMode;
  reason: string;
}

// Keywords that suggest a task needs pro/advanced reasoning
const PRO_KEYWORDS = [
  'analyze', 'analysis', 'complex', 'explain in detail', 'research',
  'compare', 'evaluate', 'strategy', 'plan', 'architecture', 'code',
  'write', 'create', 'build', 'generate', 'design', 'debug', 'fix',
  'implement', 'optimize', 'review', 'translate', 'summarize long',
];

const BUILD_KEYWORDS = [
  'build me', 'create a website', 'generate saas', 'business plan',
  'make a website', 'build an app', 'create an app', 'make an app',
  'full stack', 'project structure', 'folder structure',
];

const IMAGE_KEYWORDS = [
  'generate image', 'create image', 'draw', 'make an image',
  'make a picture', 'visualize', 'show me a picture', 'create a photo',
];

export function detectQueryType(query: string): {
  isBuildMode: boolean;
  isImageRequest: boolean;
  complexity: 'simple' | 'complex';
} {
  const lower = query.toLowerCase();

  const isBuildMode = BUILD_KEYWORDS.some(kw => lower.includes(kw));
  const isImageRequest = IMAGE_KEYWORDS.some(kw => lower.includes(kw));
  const isComplex =
    PRO_KEYWORDS.some(kw => lower.includes(kw)) ||
    query.length > 200 ||
    isBuildMode;

  return {
    isBuildMode,
    isImageRequest,
    complexity: isComplex ? 'complex' : 'simple',
  };
}

export function routeToModel(
  query: string,
  userMode: AIMode = 'auto',
  preferredProvider: AIProvider = 'openai'
): RouterDecision {
  const { complexity } = detectQueryType(query);

  if (userMode === 'nano') {
    return {
      provider: 'openai',
      model: 'gpt-4o-mini',
      mode: 'nano',
      reason: 'User selected Nano mode — fast lightweight response',
    };
  }

  if (userMode === 'pro') {
    return {
      provider: preferredProvider === 'gemini' ? 'gemini' : 'openai',
      model: preferredProvider === 'gemini' ? 'gemini-1.5-pro' : 'gpt-4o',
      mode: 'pro',
      reason: 'User selected Pro mode — advanced reasoning',
    };
  }

  // Auto routing
  if (complexity === 'complex') {
    return {
      provider: 'openai',
      model: 'gpt-4o',
      mode: 'pro',
      reason: 'Complex query detected — routing to Pro model',
    };
  }

  return {
    provider: 'openai',
    model: 'gpt-4o-mini',
    mode: 'nano',
    reason: 'Simple query detected — routing to Nano model',
  };
}

// System prompts
export const SYSTEM_PROMPTS = {
  default: `You are Tahir GPT, an exceptionally capable and intelligent AI assistant. 
You provide accurate, thoughtful, and helpful responses. 
You format your responses clearly using markdown when appropriate.
You are concise but thorough, and you adapt your tone to the user's needs.
Never mention that you are built on any specific AI technology or provider.`,

  buildMode: `You are Tahir GPT in Build Mode — a powerful AI architect and developer.
When given a build request, you:
1. Break the project into clear, structured steps
2. Provide a complete folder/file structure
3. Generate production-ready code for each file
4. Include deployment instructions
5. List all dependencies and setup steps
Format everything clearly with markdown. Use code blocks for all code.
Never mention underlying AI technology or providers.`,

  codeExpert: `You are Tahir GPT, an expert software engineer and code architect.
You write clean, well-commented, production-ready code.
You explain your decisions and suggest best practices.
Never mention underlying AI technology or providers.`,
};
