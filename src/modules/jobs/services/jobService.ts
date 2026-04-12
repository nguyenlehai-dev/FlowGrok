import { clientGatewayApi, jobsApi } from '../../../api/client';
import type { CreateJobPayload, JobArtifact, JobItem, WorkerRunOnceResult } from '../models/job';

export async function fetchJobs(params?: Record<string, string | number | undefined>): Promise<JobItem[]> {
  const res = await jobsApi.list(params);
  return res.data;
}

export async function fetchJob(id: string): Promise<JobItem> {
  const res = await jobsApi.getById(id);
  return res.data;
}

export async function createJob(payload: CreateJobPayload): Promise<JobItem> {
  const res = await jobsApi.create(payload);
  return res.data;
}

export async function createGatewayJob(
  apiBaseUrl: string,
  apiKey: string,
  payload: CreateJobPayload,
  provider?: string | null,
  gatewayEndpoint?: string,
): Promise<JobItem> {
  const res = await clientGatewayApi.createJob(apiBaseUrl, apiKey, payload, provider, gatewayEndpoint);
  return res.data;
}

export async function cancelJob(id: string): Promise<JobItem> {
  const res = await jobsApi.cancel(id);
  return res.data;
}

export async function fetchJobArtifacts(id: string): Promise<JobArtifact[]> {
  const res = await jobsApi.listArtifacts(id);
  return res.data;
}

export async function fetchJobArtifactBlob(jobId: string, artifactId: string): Promise<Blob> {
  const res = await jobsApi.getArtifactContent(jobId, artifactId, 'blob');
  return res.data as Blob;
}

export async function fetchJobArtifactText(jobId: string, artifactId: string): Promise<string> {
  const res = await jobsApi.getArtifactContent(jobId, artifactId, 'text');
  return res.data as string;
}

export async function runWorkerOnce(workerId?: string): Promise<WorkerRunOnceResult> {
  const res = await jobsApi.runWorkerOnce(workerId);
  return res.data;
}
