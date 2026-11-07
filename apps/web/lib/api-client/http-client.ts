import axios, { type AxiosInstance } from "axios";

export interface HttpClientOptions {
  baseURL: string;
  timeoutMs?: number;
}

/** Creates an Axios client with the configured base URL and defaults. */
export function createHttpClient(options: HttpClientOptions): AxiosInstance {
  const { baseURL, timeoutMs = 10000 } = options;

  return axios.create({
    baseURL,
    timeout: timeoutMs,
    headers: { Accept: "application/json" },
  });
}
