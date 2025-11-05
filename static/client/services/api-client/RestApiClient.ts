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

  private getCsrfToken(): string | null {
    // Read CSRF token from meta tag
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute("content") : null;
  }

  callApi<T>(endpoint: string, method: (typeof REST_TYPES)[keyof typeof REST_TYPES], params?: any): Promise<T> {
    const csrfToken = this.getCsrfToken();
    const headers = { ...this.headers };

    // Add CSRF token to headers for state-changing methods
    if (csrfToken && ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
      headers["X-CSRFToken"] = csrfToken;
    }

    const instance = axios.create({
      baseURL: this.basePath,
      headers: headers,
      timeout: this.timeout,
    });

    return instance({
      method,
      url: endpoint,
      withCredentials: true, // Changed to true to send cookies with requests
      ...(params ? { data: params } : {}),
    });
  }
}
