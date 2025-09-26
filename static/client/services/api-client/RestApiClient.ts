import axios from "axios";

import config from "@/config";
import { ApiClient } from "@/services/abstractions/ApiClient";
import type { REST_TYPES } from "@/services/api/constants";

export class RestApiClient extends ApiClient {
  protected basePath: string = "";
  protected headers: Record<string, string> = {};
  protected timeout: number = 0;

  constructor() {
    super();
    this.initialize();
  }

  initialize(): void {
    this.basePath = config.api.path;
    this.headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    this.timeout = 5 * 60 * 1000;
  }

  callApi<T>(endpoint: string, method: (typeof REST_TYPES)[keyof typeof REST_TYPES], params?: any): Promise<T> {
    const instance = axios.create({
      baseURL: this.basePath,
      headers: this.headers,
      timeout: this.timeout,
    });

    return instance({
      method,
      url: endpoint,
      withCredentials: false,
      ...(params ? { data: params } : {}),
    });
  }
}
