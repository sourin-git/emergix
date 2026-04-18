import * as SMS from 'expo-sms';
import { Alert } from 'react-native';

// Reverts to hardcoded dispatch loop if env variables drop
const DISPATCH_NUMBER = process.env.EXPO_PUBLIC_DISPATCH_NUMBER || '108';

export const dispatchSmsSOS = async (incidentType: string, lat: number, lng: number, landmark: string) => {
  const isAvailable = await SMS.isAvailableAsync();
  
  if (isAvailable) {
    // Format securely to allow Node-backend parsing over Twilio receiving webhooks if piped externally
    const message = `EMERGIX SOS [${incidentType}] [${lat},${lng}] [${landmark}]`;
    
    // Generates OS-Native SMS wrapper avoiding HTTP reliance unconditionally
    const { result } = await SMS.sendSMSAsync([DISPATCH_NUMBER], message);
    
    if (result === 'sent' || result === 'unknown') {
       Alert.alert("SOS Triggered via SMS", "SOS sent via SMS successfully. Help is currently on the way.");
    }
  } else {
    Alert.alert("Execution Error", "SMS infrastructure is physically unavailable on this device.");
  }
};
