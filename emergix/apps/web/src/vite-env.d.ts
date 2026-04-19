/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CHAT_API_URL?: string;
  readonly VITE_SOS_API_URL?: string;
  readonly VITE_TRACKING_API_URL?: string;
  readonly VITE_NOTIFICATION_API_URL?: string;
  readonly VITE_AI_API_URL?: string;
  readonly VITE_AUTH_TOKEN?: string;
  readonly VITE_INTERNAL_SERVICE_KEY?: string;
  readonly VITE_AI_API_KEY?: string;
  readonly VITE_DEMO_USER_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
