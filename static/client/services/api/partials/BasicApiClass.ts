import type { ApiClient } from "@/services/abstractions/ApiClient";
import type { REST_TYPES } from "@/services/api/constants";
import { ApiClientFactory } from "@/services/api-client/ApiClientFactory";

export class BasicApiClass {
  protected apiClient: ApiClient;

  constructor() {
    this.apiClient = ApiClientFactory.getClient();
  }

  setApiClient(client: ApiClient) {
    this.apiClient = client;
  }

  protected async callApi<T extends any>(
    endpoint: string,
    method: (typeof REST_TYPES)[keyof typeof REST_TYPES],
    params?: any,
  ): Promise<T> {
    return this.apiClient.callApi<T>(endpoint, method, params);
  }
}
