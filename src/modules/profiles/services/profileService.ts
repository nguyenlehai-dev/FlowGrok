import { profileApi } from '../../../api/client';
import type {
  CreateProfilePayload,
  ProfileAntidetectSettings,
  ProfileCookieImport,
  ProfileItem,
  ProfileLoginTestResult,
  ProfileRuntimeSettings,
  UpdateProfilePayload,
} from '../models/profile';

export async function fetchProfiles(): Promise<ProfileItem[]> {
  const res = await profileApi.list();
  return res.data;
}

export async function createProfile(payload: CreateProfilePayload) {
  return profileApi.create(payload);
}

export async function deleteProfile(id: string) {
  return profileApi.remove(id);
}

export async function fetchProfile(id: string): Promise<ProfileItem> {
  const res = await profileApi.getById(id);
  return res.data;
}

export async function updateProfile(id: string, payload: UpdateProfilePayload): Promise<ProfileItem> {
  const res = await profileApi.update(id, payload);
  return res.data;
}

export async function fetchRuntimeSettings(id: string): Promise<ProfileRuntimeSettings> {
  const res = await profileApi.getRuntimeSettings(id);
  return res.data;
}

export async function saveRuntimeSettings(id: string, payload: Partial<ProfileRuntimeSettings>): Promise<ProfileRuntimeSettings> {
  const res = await profileApi.saveRuntimeSettings(id, payload);
  return res.data;
}

export async function fetchAntidetectSettings(id: string): Promise<ProfileAntidetectSettings> {
  const res = await profileApi.getAntidetectSettings(id);
  return res.data;
}

export async function saveAntidetectSettings(id: string, payload: Partial<ProfileAntidetectSettings>): Promise<ProfileAntidetectSettings> {
  const res = await profileApi.saveAntidetectSettings(id, payload);
  return res.data;
}

export async function testProfileLogin(id: string): Promise<ProfileLoginTestResult> {
  const res = await profileApi.testLogin(id);
  return res.data;
}

export async function fetchCookieImports(id: string): Promise<ProfileCookieImport[]> {
  const res = await profileApi.listCookieImports(id);
  return res.data;
}

export async function uploadCookieFile(id: string, file: File, sourceType: 'txt' | 'json' | 'storage_state_json') {
  const res = await profileApi.importCookies(id, file, sourceType);
  return res.data;
}
