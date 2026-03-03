/**
 * AI Router — intelligently selects OpenAI or Gemini
 * based on query type and user plan
 */

export type AIMode = 'nano' | 'pro' | 'auto';
export type AIProvider = 'openai' | 'gemini';

export interface RouterDecision {
  provider: AIProvider;
  model: string;
  mode: 'nano' | 'pro';
  reason: string;
}

const BUILD_PATTERNS = [
  /build\s+(me\s+a?|a|an)/i,
  /create\s+(a|an|me)\s+\w+\s*(app|website|site|tool|system|platform)/i,
  /generate\s+(saas|app|website|business\s+plan)/i,
  /make\s+(a|an)\s+\w+\s*(website|app|tool)/i,
];

const CODE_PATTERNS = [
  /write\s+(a|the|some)?\s*(code|function|class|script)/i,
  /debug|fix\s+(this|my)\s*code/i,
  /implement|refactor|optimize\s+/i,
];

const CREATIVE_PATTERNS = [
  /write\s+(a|an|me)?\s*(story|poem|essay|blog|article)/i,
  /creative|imagine|visualize/i,
];

const SIMPLE_PATTERNS = [
  /^(what|who|when|where|how|why)\s+is\s+/i,
  /^(define|explain)\s+/i,
  /^(yes|no|maybe)/i,
  /translate/i,
  /summarize|tldr/i,
];

export function routeQuery(
  query: string,
  mode: AIMode,
  userPlan: 'free' | 'pro'
): RouterDecision {
  // Force nano for free plan on complex tasks (rate limiting)
  const isComplex = CODE_PATTERNS.some(p => p.test(query)) || BUILD_PATTERNS.some(p => p.test(query));
  const isSimple = SIMPLE_PATTERNS.some(p => p.test(query));
  const isCreative = CREATIVE_PATTERNS.some(p => p.test(query));

  // Nano mode overrides
  if (mode === 'nano' || (mode === 'auto' && isSimple)) {
    return {
      provider: 'openai',
      model: 'gpt-4o-mini',
      mode: 'nano',
      reason: 'Fast lightweight response',
    };
  }

  // Pro mode selections
  if (mode === 'pro' || (mode === 'auto' && isComplex)) {
    // Use Gemini for creative and build tasks
    if (isCreative || BUILD_PATTERNS.some(p => p.test(query))) {
      return {
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        mode: 'pro',
        reason: 'Gemini Pro for creative/build tasks',
      };
    }
    // Use OpenAI GPT-4 for code and reasoning
    return {
      provider: 'openai',
      model: 'gpt-4o',
      mode: 'pro',
      reason: 'GPT-4o for code and reasoning',
    };
  }

  // Default auto
  return {
    provider: 'openai',
    model: 'gpt-4o-mini',
    mode: 'nano',
    reason: 'Default lightweight',
  };
}

export function isBuildRequest(query: string): boolean {
  return BUILD_PATTERNS.some(p => p.test(query));
}
