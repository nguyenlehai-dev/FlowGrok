const API_BASE_URL_KEY = 'flowgrok.apiBaseUrl';
const CLIENT_API_KEY_KEY = 'flowgrok.clientApiKey';
const GATEWAY_JOB_ENDPOINT_KEY = 'flowgrok.gatewayJobEndpoint';

export function getRuntimeApiBaseUrl() {
  return window.localStorage.getItem(API_BASE_URL_KEY) ?? '/api/v1';
}

export function setRuntimeApiBaseUrl(value: string) {
  window.localStorage.setItem(API_BASE_URL_KEY, value);
}

export function clearRuntimeApiBaseUrl() {
  window.localStorage.removeItem(API_BASE_URL_KEY);
}

export function getRuntimeClientApiKey() {
  return window.localStorage.getItem(CLIENT_API_KEY_KEY) ?? '';
}

export function setRuntimeClientApiKey(value: string) {
  window.localStorage.setItem(CLIENT_API_KEY_KEY, value);
}

export function clearRuntimeClientApiKey() {
  window.localStorage.removeItem(CLIENT_API_KEY_KEY);
}

export function getRuntimeGatewayJobEndpoint() {
  return window.localStorage.getItem(GATEWAY_JOB_ENDPOINT_KEY) ?? '';
}

export function setRuntimeGatewayJobEndpoint(value: string) {
  window.localStorage.setItem(GATEWAY_JOB_ENDPOINT_KEY, value);
}
