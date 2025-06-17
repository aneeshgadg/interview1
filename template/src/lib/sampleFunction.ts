// eslint-disable-next-line import/no-unresolved
import { VoiceEntry, ProcessedResult } from './types.js'

/**
 * processEntries
 * --------------
 * PURE function — no IO, no mutation, deterministic.
 * Analyzes voice entries to identify tag frequencies and spontaneous ideas.
 */
export function processEntries(entries: VoiceEntry[]): ProcessedResult {
  const tagFrequencies: Record<string, number> = {}
  const ideas: Array<{
    task_text: string;
    status: string;
    category: string;
    due_date: string | null;
    origin_type: string;
    tone: string;
    refinement_level: string;
    belief_level: string;
  }> = [];

  // Process each entry
  for (const e of entries) {
    // Count tag frequencies
    for (const tag of e.tags_user) {
      tagFrequencies[tag] = (tagFrequencies[tag] || 0) + 1
    }
    
    // Identify spontaneous ideas
    const text = e.transcript_user.toLowerCase();
    
    // Check for idea indicators
    const hasIdeaVerbs = /(build|create|start|try|make|develop|design|launch)/i.test(text);
    const hasIdeaPhrases = /(just thought of|what if|idea for|thinking about|occurred to me|imagine if|how about)/i.test(text);
    const hasFutureIntent = /(going to|plan to|want to|would like to|intend to)/i.test(text);
    
    if (hasIdeaVerbs || hasIdeaPhrases || hasFutureIntent) {
      // Extract idea details
      const task_text = e.transcript_user;
      
      // Determine status (default to "new")
      let status = "new";
      if (/already started|in progress|working on/i.test(text)) {
        status = "in progress";
      } else if (/finished|completed|done/i.test(text)) {
        status = "completed";
      }
      
      // Determine category
      let category = "general";
      if (/health|exercise|workout|diet/i.test(text)) {
        category = "health";
      } 
      else if (/learn|study|course|read/i.test(text)) {
        category = "learning";
      } else if (/work|job|career|business/i.test(text)) {
        category = "work";
      } else if (/personal|life|relationship/i.test(text)) {
        category = "personal";
      }
      
      // Extract due date if present
      let due_date: string | null = null;
      if (/tomorrow/i.test(text)) {
        due_date = "tomorrow";
      } else if (/next week/i.test(text)) {
        due_date = "next week";
      } else if (/this weekend/i.test(text)) {
        due_date = "this weekend";
      }
      
      // Determine origin type
      const origin_type = hasIdeaPhrases ? "spontaneous" : "planned";
      
      // Analyze tone
      let tone = "neutral";
      if (e.emotion_score_score !== null) {
        if (e.emotion_score_score > 0.3) {
          tone = "positive";
        } else if (e.emotion_score_score < -0.1) {
          tone = "negative";
        }
      }
      
      // Determine refinement level
      let refinement_level = "initial";
      if (/detailed plan|steps to|process for/i.test(text)) {
        refinement_level = "detailed";
      } else if (/thinking about|considering/i.test(text)) {
        refinement_level = "conceptual";
      }
      
      // Determine belief level
      let belief_level = "medium";
      if (/definitely|absolutely|must|will/i.test(text)) {
        belief_level = "high";
      } else if (/maybe|perhaps|might|could/i.test(text)) {
        belief_level = "low";
      }
      
      ideas.push({
        task_text,
        status,
        category,
        due_date,
        origin_type,
        tone,
        refinement_level,
        belief_level
      });
    }
  }

  return {
    summary: `Analysis of ${entries.length} entries found ${ideas.length} potential ideas`,
    tagFrequencies,
    ideas
  }
}

export default processEntries 
