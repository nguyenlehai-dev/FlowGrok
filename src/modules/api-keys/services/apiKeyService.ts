import { authApi } from '../../../api/client';
import type { ApiKeyItem } from '../models/apiKey';

export async function fetchApiKeys(): Promise<ApiKeyItem[]> {
  const res = await authApi.listApiKeys();
  return res.data;
}

export async function createApiKey() {
  return authApi.createApiKey();
}

export async function revokeApiKey(id: string) {
  return authApi.revokeApiKey(id);
}
