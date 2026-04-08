export type ProxyItem = {
  id: string;
  ip: string;
  port: number;
  username: string | null;
  status: string;
};

export type CreateProxyPayload = {
  ip: string;
  port: number;
  username: string | null;
  password: string | null;
};
