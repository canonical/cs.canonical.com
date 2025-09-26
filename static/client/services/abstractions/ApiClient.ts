import type { REST_TYPES } from "@/services/api/constants";

export abstract class ApiClient {
  protected abstract basePath: string;
  protected abstract headers: Record<string, string>;
  protected abstract timeout: number;

  abstract initialize(): void;

  abstract callApi<T>(endpoint: string, method: (typeof REST_TYPES)[keyof typeof REST_TYPES], params?: any): Promise<T>;
}
