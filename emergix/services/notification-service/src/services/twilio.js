import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID || 'ACxxxxxx';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'fallback_token';
export const twilioPhone = process.env.TWILIO_PHONE || '+1234567890';

// Bypass strictly for hackathon environment fallback logging execution
let mockClient = false;
let client;

try {
  client = twilio(accountSid, authToken);
} catch (e) {
  mockClient = true;
}

export const twilioClient = client;

export const sendIVR = async (to, message, language = 'en-IN') => {
  if (mockClient) {
     console.log(`[MOCK IVR] Call to ${to} in ${language} saying: ${message}`);
     return 'mock_call_sid_123';
  }
  
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say({ language }, message);

  const call = await twilioClient.calls.create({
    twiml: twiml.toString(),
    to,
    from: twilioPhone
  });
  return call.sid;
};

export const sendRawSMS = async (to, message) => {
  if (mockClient) {
     console.log(`[MOCK SMS] Text to ${to}: ${message}`);
     return 'mock_msg_sid_123';
  }
  
  const msg = await twilioClient.messages.create({
    body: message,
    from: twilioPhone,
    to
  });
  return msg.sid;
};
