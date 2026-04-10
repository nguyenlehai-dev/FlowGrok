export type ApiKeyItem = {
  id: string;
  key?: string | null;
  key_preview?: string | null;
  status: string;
  rate_limit_per_minute?: number | null;
  last_used_at?: string | null;
};
