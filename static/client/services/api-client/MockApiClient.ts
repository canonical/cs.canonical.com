import { ApiClient } from "@/services/abstractions/ApiClient";
import type { REST_TYPES } from "@/services/api/constants";

export class MockApiClient extends ApiClient {
  protected basePath: string = "";
  protected headers: Record<string, string> = {};
  protected timeout: number = 0;

  constructor() {
    super();
    this.initialize();
  }

  initialize(): void {
    this.basePath = "http://mock-api.local";
    this.timeout = 1000;
    this.headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Mock-Client": "true",
    };
  }

  async callApi<T>(endpoint: string, method: (typeof REST_TYPES)[keyof typeof REST_TYPES], params?: any): Promise<T> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Default mock responses for common patterns
    if (endpoint.includes("/get-tree/")) {
      return this.getDefaultTreeResponse() as T;
    }

    if (endpoint.includes("/get-users/")) {
      return this.getDefaultUsersResponse() as T;
    }

    if (endpoint.includes("/get-products")) {
      return this.getDefaultProductsResponse() as T;
    }

    if (endpoint.includes("/current-user")) {
      return this.getDefaultCurrentUserResponse() as T;
    }

    // Return empty success response for unhandled endpoints
    return { success: true, data: null } as T;
  }

  private getDefaultTreeResponse() {
    return {
      data: {
        name: "mock-project",
        templates: {
          id: 1,
          name: "Mock Page",
          status: "AVAILABLE",
          owner: { id: 1, name: "Mock User", email: "mock@example.com" },
          reviewers: [],
          products: [],
          children: [],
          jira_tasks: [],
        },
      },
    };
  }

  private getDefaultUsersResponse() {
    return {
      data: [
        { id: 1, name: "Mock User 1", email: "user1@example.com" },
        { id: 2, name: "Mock User 2", email: "user2@example.com" },
      ],
    };
  }

  private getDefaultProductsResponse() {
    return {
      data: [
        { id: 1, name: "Mock Product 1" },
        { id: 2, name: "Mock Product 2" },
      ],
    };
  }

  private getDefaultCurrentUserResponse() {
    return {
      data: {
        id: 1,
        name: "Mock User",
        email: "mock@example.com",
        jobTitle: "Mock Job Title",
        department: "Mock Department",
        team: "Mock Team",
        role: "Mock Role",
      },
    };
  }
}
