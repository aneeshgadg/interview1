import fs from 'fs';
import path from 'path';
import { VoiceEntry } from './types.js';

// Parse CSV file
function parseCSV(csvContent: string): VoiceEntry[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  
  // Only process the first 20 entries
  return lines.slice(1, 21).map(line => {
    const values = line.split(',');
    const entry: Record<string, any> = {};
    
    headers.forEach((header, index) => {
      let value = values[index]?.trim() || null;
      
      // Handle arrays
      if (header === 'tags_model' || header === 'tags_user') {
        entry[header] = value && value !== '' ? value.split(';') : [];
        return; // Skip the rest of this iteration
      }
      
      // Handle numbers
      if (header === 'emotion_score_score') {
        value = value ? String(parseFloat(value)) : null;
      }
      
      // Handle embedding
      if (header === 'embedding') {
        if (value && value !== '') {
          try {
            value = JSON.parse(value);
          } catch (error) {
            console.warn(`Failed to parse embedding JSON for entry. Using null instead. Error: ${error instanceof Error ? error.message : String(error)}`);
            value = null;
          }
        } else {
          value = null;
        }
      }
      
      entry[header] = value;
    });
    
    // Ensure required fields
    if (!entry.id) entry.id = Math.random().toString(36).substring(2);
    if (!entry.user_id) entry.user_id = 'default-user';
    
    return entry as VoiceEntry;
  });
}

// Define the path for the CSV file using a relative path
const csvPath = path.join(process.cwd(), 'src', 'lib', 'Expanded_Diary_Entries.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');


// Export the parsed entries
export const mockVoiceEntries = parseCSV(csvContent);
