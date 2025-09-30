import { MockApiClient } from "./MockApiClient";
import { RestApiClient } from "./RestApiClient";

import config from "@/config";
import type { ApiClient } from "@/services/abstractions/ApiClient";

export type ApiClientType = "rest" | "mock";

export class ApiClientFactory {
  private static instance: ApiClient | null = null;
  private static currentType: ApiClientType = ["rest", "mock"].includes(config.api.mode)
    ? (config.api.mode as ApiClientType)
    : "rest";

  static getClient(): ApiClient {
    if (!this.instance) {
      this.instance = this.createClient(this.currentType);
    }
    return this.instance as ApiClient;
  }

  private static createClient(type: ApiClientType) {
    switch (type) {
      case "mock":
        return new MockApiClient();
      case "rest":
      default:
        return new RestApiClient();
    }
  }
}
