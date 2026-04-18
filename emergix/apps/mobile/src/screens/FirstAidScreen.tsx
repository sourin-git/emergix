import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { getFirstAidGuides, FirstAidGuide } from '../services/Database';

// Matching base Stitch UI context provided natively
const StitchTokens = { 
    color: { background: '#121212', surface: '#1E1E1E', text: '#FFF', primaryBlue: '#007AFF', textSecondary: '#A0A0A5' }, 
    spacing: { md: 16 }, 
    radius: { md: 12 } 
};

export default function FirstAidScreen() {
   const [guides, setGuides] = useState<FirstAidGuide[]>([]);
   const [sound, setSound] = useState<Audio.Sound | null>(null);

   useEffect(() => {
     try {
       // Pull strictly from local SQLite caching mechanisms
       const data = getFirstAidGuides();
       setGuides(data);
     } catch (e) {
       console.log('Local Database query violation:', e);
     }
     
     // Garbage Collection cleanup drops OS hooks
     return sound ? () => { sound.unloadAsync() } : undefined;
   }, []);

   const playAudio = async (uri: string) => {
     try {
       // Reverts heavily to cached filesystem URIs over HTTP to enforce Offline-First integrity
       const { sound: newSound } = await Audio.Sound.createAsync({ uri });
       setSound(newSound);
       await newSound.playAsync();
     } catch (err) {
       console.error("Audio playback driver failure", err);
     }
   };

   return (
     <View style={styles.container}>
       <Text style={styles.header}>Offline First-Aid Directory</Text>
       <ScrollView showsVerticalScrollIndicator={false}>
         
         {guides.length === 0 ? (
            <Text style={styles.emptyText}>No emergency instructions are cached locally.</Text>
         ) : guides.map((guide) => (
             
           <View key={guide.id} style={styles.card}>
             <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.categoryText}>{guide.category}</Text>
                    <Text style={styles.title}>{guide.title}</Text>
                </View>
                
                {/* Voice integration TTS block */}
                <TouchableOpacity onPress={() => playAudio(guide.cached_local_uri || guide.voice_audio_url)} style={styles.playBtn} accessibilityLabel="Play Audio Guide">
                   <Text style={{ fontSize: 18 }}>🔊</Text>
                </TouchableOpacity>
             </View>
             
             {/* Iterate natively assuming standard JSON structure [step1, step2] isolated cleanly */}
             {(JSON.parse(guide.steps || '[]')).map((step: string, i: number) => (
                <View key={i} style={styles.stepRow}>
                    <Text style={styles.bulletPoint}>{i+1}.</Text>
                    <Text style={styles.stepText}>{step}</Text>
                </View>
             ))}
           </View>

         ))}
       </ScrollView>
     </View>
   );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: StitchTokens.color.background, padding: 16, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 24 },
  emptyText: { color: StitchTokens.color.textSecondary, fontSize: 16, marginTop: 20 },
  card: { 
     backgroundColor: StitchTokens.color.surface, 
     padding: 20, 
     borderRadius: StitchTokens.radius.md, 
     marginBottom: 16,
     borderLeftWidth: 4,
     borderLeftColor: StitchTokens.color.primaryBlue
  },
  categoryText: { color: StitchTokens.color.primaryBlue, fontSize: 13, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  title: { fontSize: 20, color: '#FFF', fontWeight: 'bold' },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, paddingRight: 10 },
  bulletPoint: { color: StitchTokens.color.primaryBlue, fontWeight: 'bold', width: 20, fontSize: 16 },
  stepText: { color: '#EBEBF5', lineHeight: 22, fontSize: 15, flex: 1 },
  playBtn: { width: 44, height: 44, backgroundColor: 'rgba(0, 122, 255, 0.2)', borderRadius: 22, justifyContent: 'center', alignItems: 'center' }
});
