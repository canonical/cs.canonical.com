import type { IJiraTask } from "./pages";

export interface IGetTicketsParams {
  page: number;
  per_page: number;
  type: string;
}

export interface IGetTicketsResponse {
  data: {
    tickets: IJiraTask[];
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}
