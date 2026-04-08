import { proxyApi } from '../../../api/client';
import type { CreateProxyPayload, ProxyItem } from '../models/proxy';

export async function fetchProxies(): Promise<ProxyItem[]> {
  const res = await proxyApi.list();
  return res.data;
}

export async function createProxy(payload: CreateProxyPayload) {
  return proxyApi.create(payload);
}

export async function deleteProxy(id: string) {
  return proxyApi.remove(id);
}
