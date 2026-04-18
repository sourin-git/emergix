import * as SQLite from 'expo-sqlite';

// Establishes synchronous local storage caching first-aid responses
const db = SQLite.openDatabaseSync('emergix_offline.db');

export interface FirstAidGuide {
  id: string;
  category: string;
  title: string;
  steps: string; // JSON parsed representation of instruction array
  voice_audio_url: string;
  cached_local_uri: string;
}

export const initDB = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS first_aid (
      id TEXT PRIMARY KEY,
      category TEXT,
      title TEXT,
      steps TEXT,
      voice_audio_url TEXT,
      cached_local_uri TEXT
    );
  `);
};

export const syncFirstAidFromMongo = async (guides: any[]) => {
  // Safe overwrites dropping out-of-date documentation
  db.execSync('DELETE FROM first_aid;');
  
  const statement = db.prepareSync(
    'INSERT INTO first_aid (id, category, title, steps, voice_audio_url, cached_local_uri) VALUES (?, ?, ?, ?, ?, ?)'
  );
  
  for (const g of guides) {
     statement.executeSync([
       g.id, 
       g.category, 
       g.title, 
       JSON.stringify(g.steps), 
       g.voice_audio_url, 
       g.cached_local_uri || '' // FileSystem local URIs bypassing HTTP audio payloads
     ]);
  }
};

export const getFirstAidGuides = (): FirstAidGuide[] => {
  try {
     const result = db.getAllSync('SELECT * FROM first_aid');
     return result as FirstAidGuide[];
  } catch (e) {
     console.error("Offline Map/Guide DB error: ", e);
     return [];
  }
};
