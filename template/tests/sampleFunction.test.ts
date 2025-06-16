// Vitest types are provided via tsconfig "types"
import { describe, it, expect, vi } from 'vitest'
import { mockVoiceEntries } from '../src/lib/mockData.ts'
import processEntries from '../src/lib/sampleFunction.js'
import { VoiceEntry } from '../src/lib/types.js'

describe('processEntries', () => {
  it('counts entries correctly', () => {
    // Create custom mock entries with known tags
    const customMockEntries: VoiceEntry[] = [
      {
        ...mockVoiceEntries[0],
        tags_user: ['work', 'important']
      },
      {
        ...mockVoiceEntries[1],
        tags_user: ['personal', 'work']
      }
    ];
    
    const result = processEntries(customMockEntries)
    
    // Verify tag counts match expected values
    expect(result.tagFrequencies.work).toBe(2)
    expect(result.tagFrequencies.important).toBe(1)
    expect(result.tagFrequencies.personal).toBe(1)
    
    // Verify total number of entries processed
    expect(customMockEntries.length).toBe(2)
  })

  it('identifies ideas correctly', () => {
    const result = processEntries(mockVoiceEntries)
    expect(result.ideas).toBeDefined()
    expect(Array.isArray(result.ideas)).toBe(true)
  })

  it('correctly formats idea objects', () => {
    const result = processEntries(mockVoiceEntries)
    if (result.ideas && result.ideas.length > 0) {
      const idea = result.ideas[0]
      expect(idea).toHaveProperty('task_text')
      expect(idea).toHaveProperty('status')
      expect(idea).toHaveProperty('category')
      expect(idea).toHaveProperty('due_date')
      expect(idea).toHaveProperty('origin_type')
      expect(idea).toHaveProperty('tone')
      expect(idea).toHaveProperty('refinement_level')
      expect(idea).toHaveProperty('belief_level')
    }
  })

  it('includes idea count in summary', () => {
    const result = processEntries(mockVoiceEntries)
    expect(result.summary).toContain('found')
    expect(result.summary).toContain('potential ideas')
  })

  it('handles empty entries array', () => {
    const result = processEntries([])
    expect(result.tagFrequencies).toEqual({})
    expect(result.ideas).toEqual([])
    expect(result.summary).toContain('0 potential ideas')
  })

  it('correctly counts multiple tags', () => {
    const mockEntries: VoiceEntry[] = [
      {
        ...mockVoiceEntries[0],
        tags_user: ['work', 'important', 'reflection']
      },
      {
        ...mockVoiceEntries[1],
        tags_user: ['personal', 'reflection']
      }
    ]
    
    const result = processEntries(mockEntries)
    expect(result.tagFrequencies.work).toBe(1)
    expect(result.tagFrequencies.important).toBe(1)
    expect(result.tagFrequencies.reflection).toBe(2)
    expect(result.tagFrequencies.personal).toBe(1)
  })

  it('extracts ideas with correct properties', () => {
    const result = processEntries(mockVoiceEntries)
    
    if (result.ideas && result.ideas.length > 0) {
      result.ideas.forEach(idea => {
        expect(typeof idea.task_text).toBe('string')
        expect(['new', 'completed', 'in_progress']).toContain(idea.status)
        expect(typeof idea.category).toBe('string')
        expect(idea.due_date === null || typeof idea.due_date === 'string').toBe(true)
        expect(typeof idea.origin_type).toBe('string')
        expect(typeof idea.tone).toBe('string')
        expect(typeof idea.refinement_level).toBe('string')
        expect(typeof idea.belief_level).toBe('string')
      })
    }
  })

  it('generates a meaningful summary', () => {
    const result = processEntries(mockVoiceEntries)
    
    expect(result.summary).toMatch(/Analysis of \d+ entries found \d+ potential ideas/)
    expect(result.summary.length).toBeGreaterThan(20)
  })

  it('handles entries with no tags', () => {
    const result = processEntries(mockVoiceEntries)
    // Since the mock data has empty tags_user arrays, reflection tag count should be 0
    expect(result.tagFrequencies.reflection).toBe(undefined)
    // Or alternatively check that the object exists but is empty or has expected structure
    expect(result.tagFrequencies).toBeDefined()
  })

  it('handles different status values', () => {
    const inProgressEntry: VoiceEntry = {
      ...mockVoiceEntries[0],
      transcript_user: 'I am already started working on this project to build something'
    }
    const completedEntry: VoiceEntry = {
      ...mockVoiceEntries[0],
      transcript_user: 'I finished this task yesterday to create something'
    }
    
    const inProgressResult = processEntries([inProgressEntry])
    const completedResult = processEntries([completedEntry])
    
    // Check if ideas array exists and has elements before testing
    expect(inProgressResult.ideas).toBeDefined()
    expect(inProgressResult.ideas?.length).toBeGreaterThan(0)
    expect(completedResult.ideas).toBeDefined()
    expect(completedResult.ideas?.length).toBeGreaterThan(0)
    
    // Now test the status values
    expect(inProgressResult.ideas?.[0].status).toBe('in progress')
    expect(completedResult.ideas?.[0].status).toBe('completed')
  })

  it('sets different tone values based on emotion score', () => {
    const positiveEntry: VoiceEntry = {
      ...mockVoiceEntries[0],
      transcript_user: 'I want to build something new',
      emotion_score_score: 0.4
    }
    const negativeEntry: VoiceEntry = {
      ...mockVoiceEntries[0],
      transcript_user: 'I want to create something different',
      emotion_score_score: -0.2
    }
    
    const positiveResult = processEntries([positiveEntry])
    const negativeResult = processEntries([negativeEntry])
    
    // Check if ideas array exists and has elements before testing
    expect(positiveResult.ideas).toBeDefined()
    expect(positiveResult.ideas?.length).toBeGreaterThan(0)
    expect(negativeResult.ideas).toBeDefined()
    expect(negativeResult.ideas?.length).toBeGreaterThan(0)
    
    expect(positiveResult.ideas?.[0].tone).toBe('positive')
    expect(negativeResult.ideas?.[0].tone).toBe('negative')
  })

  it('sets different refinement levels based on text content', () => {
    const detailedEntry: VoiceEntry = {
      ...mockVoiceEntries[0],
      transcript_user: 'I have a detailed plan for this project to build something'
    }
    const conceptualEntry: VoiceEntry = {
      ...mockVoiceEntries[0],
      transcript_user: 'I am thinking about creating something new'
    }
    
    const detailedResult = processEntries([detailedEntry])
    const conceptualResult = processEntries([conceptualEntry])
    
    // Check if ideas array exists and has elements before testing
    expect(detailedResult.ideas).toBeDefined()
    expect(detailedResult.ideas?.length).toBeGreaterThan(0)
    expect(conceptualResult.ideas).toBeDefined()
    expect(conceptualResult.ideas?.length).toBeGreaterThan(0)
    
    expect(detailedResult.ideas?.[0].refinement_level).toBe('detailed')
    expect(conceptualResult.ideas?.[0].refinement_level).toBe('conceptual')
  })

  it('sets different belief levels based on text content', () => {
    const highBeliefEntry: VoiceEntry = {
      ...mockVoiceEntries[0],
      transcript_user: 'I will definitely build this app'
    }
    const lowBeliefEntry: VoiceEntry = {
      ...mockVoiceEntries[0],
      transcript_user: 'I might create this if I have time'
    }
    
    const highBeliefResult = processEntries([highBeliefEntry])
    const lowBeliefResult = processEntries([lowBeliefEntry])
    
    // Check if ideas array exists and has elements before testing
    expect(highBeliefResult.ideas).toBeDefined()
    expect(highBeliefResult.ideas?.length).toBeGreaterThan(0)
    expect(lowBeliefResult.ideas).toBeDefined()
    expect(lowBeliefResult.ideas?.length).toBeGreaterThan(0)
    
    expect(highBeliefResult.ideas?.[0].belief_level).toBe('high')
    expect(lowBeliefResult.ideas?.[0].belief_level).toBe('low')
  })

  it('identifies different idea indicators', () => {
    const verbEntry: VoiceEntry = {
      ...mockVoiceEntries[0],
      transcript_user: 'I want to build a new app'
    }
    const phraseEntry: VoiceEntry = {
      ...mockVoiceEntries[0],
      transcript_user: 'I just thought of a great solution'
    }
    
    const verbResult = processEntries([verbEntry])
    const phraseResult = processEntries([phraseEntry])
    
    expect(verbResult.ideas).toBeDefined()
    expect(verbResult.ideas?.length).toBe(1)
    expect(phraseResult.ideas).toBeDefined()
    expect(phraseResult.ideas?.length).toBe(1)
    
    expect(verbResult.ideas?.[0].origin_type).toBe('planned')
    expect(phraseResult.ideas?.[0].origin_type).toBe('spontaneous')
  })

  it('detects different categories based on text content', () => {
    // Test each category separately to avoid order issues
    const workEntry: VoiceEntry = {
      ...mockVoiceEntries[0],
      transcript_user: 'I need to build this for work'
    }
    const result1 = processEntries([workEntry])
    expect(result1.ideas).toBeDefined()
    expect(result1.ideas?.length).toBeGreaterThan(0)
    expect(result1.ideas?.[0].category).toBe('work')
    
    const learningEntry: VoiceEntry = {
      ...mockVoiceEntries[0],
      transcript_user: 'I want to learn how to code and build an app'
    }
    const result2 = processEntries([learningEntry])
    expect(result2.ideas).toBeDefined()
    expect(result2.ideas?.length).toBeGreaterThan(0)
    expect(result2.ideas?.[0].category).toBe('learning')
    
    const healthEntry: VoiceEntry = {
      ...mockVoiceEntries[0],
      transcript_user: 'I need to start a new workout plan for my health'
    }
    const result3 = processEntries([healthEntry])
    expect(result3.ideas).toBeDefined()
    expect(result3.ideas?.length).toBeGreaterThan(0)
    expect(result3.ideas?.[0].category).toBe('health')
    
    const personalEntry: VoiceEntry = {
      ...mockVoiceEntries[0],
      transcript_user: 'I want to improve my personal relationships and build better connections'
    }
    const result4 = processEntries([personalEntry])
    expect(result4.ideas).toBeDefined()
    expect(result4.ideas?.length).toBeGreaterThan(0)
    expect(result4.ideas?.[0].category).toBe('personal')
  })

  it('extracts due dates from text', () => {
    // Test each due date separately to avoid order issues
    const tomorrowEntry: VoiceEntry = {
      ...mockVoiceEntries[0],
      transcript_user: 'I need to finish this tomorrow and build something'
    }
    const result1 = processEntries([tomorrowEntry])
    expect(result1.ideas).toBeDefined()
    expect(result1.ideas?.length).toBeGreaterThan(0)
    expect(result1.ideas?.[0].due_date).toBe('tomorrow')
    
    const weekendEntry: VoiceEntry = {
      ...mockVoiceEntries[0],
      transcript_user: 'I want to start this this weekend and create something'
    }
    const result2 = processEntries([weekendEntry])
    expect(result2.ideas).toBeDefined()
    expect(result2.ideas?.length).toBeGreaterThan(0)
    expect(result2.ideas?.[0].due_date).toBe('this weekend')
    
    const nextWeekEntry: VoiceEntry = {
      ...mockVoiceEntries[0],
      transcript_user: 'I plan to begin next week and develop something'
    }
    const result3 = processEntries([nextWeekEntry])
    expect(result3.ideas).toBeDefined()
    expect(result3.ideas?.length).toBeGreaterThan(0)
    expect(result3.ideas?.[0].due_date).toBe('next week')
  })

  it('processes real mockVoiceEntries data from CSV file with detailed output', () => {
    // Process the actual mock data from the CSV file
    const result = processEntries(mockVoiceEntries);
    
    // Basic validation of the result structure
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.tagFrequencies).toBeDefined();
    expect(result.ideas).toBeDefined();
    
    // Print detailed information about the processing results
    console.log('\n----- Processing Results -----');
    console.log(`Summary: ${result.summary}`);
    console.log(`Total entries processed: ${mockVoiceEntries.length}`);
    console.log(`Total ideas found: ${result.ideas?.length || 0}`);
    
    // Print tag frequencies
    console.log('\n----- Tag Frequencies -----');
    const tagEntries = Object.entries(result.tagFrequencies);
    if (tagEntries.length > 0) {
      tagEntries.forEach(([tag, count]) => {
        console.log(`${tag}: ${count}`);
      });
    } else {
      console.log('No tags found in the entries');
    }
    
    // Print details about the first few ideas (if any)
    if (result.ideas.length > 0) {
      console.log('\n----- Sample Ideas (first 3) -----');
      const samplesToShow = Math.min(3, result.ideas.length);
      
      for (let i = 0; i < samplesToShow; i++) {
        const idea = result.ideas[i];
        console.log(`\nIdea #${i + 1}:`);
        console.log(`- Task text: "${idea.task_text.substring(0, 50)}${idea.task_text.length > 50 ? '...' : ''}"`);
        console.log(`- Status: ${idea.status}`);
        console.log(`- Category: ${idea.category}`);
        console.log(`- Due date: ${idea.due_date || 'none'}`);
        console.log(`- Origin type: ${idea.origin_type}`);
        console.log(`- Tone: ${idea.tone}`);
        console.log(`- Refinement level: ${idea.refinement_level}`);
        console.log(`- Belief level: ${idea.belief_level}`);
      }
    } else {
      console.log('\nNo ideas found in the entries');
    }
    
    // Verify the summary contains the correct counts
    expect(result.summary).toContain(`Analysis of ${mockVoiceEntries.length} entries`);
    expect(result.summary).toContain(`found ${result.ideas.length} potential ideas`);
  });
}) 
