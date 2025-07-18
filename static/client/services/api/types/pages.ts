import type { IProduct } from "./products";
import type { IUser } from "./users";

export const PageStatus = {
  NEW: "NEW",
  AVAILABLE: "AVAILABLE",
  TO_DELETE: "TO_DELETE",
};

export interface IJiraTask {
  created_at: string;
  jira_id: string;
  id: number;
  name: string;
  status: string;
  summary: string;
}

export interface IPage {
  id?: number;
  name: string;
  title?: string;
  description?: string;
  copy_doc_link: string;
  owner: IUser;
  reviewers: IUser[];
  status: (typeof PageStatus)[keyof typeof PageStatus];
  jira_tasks: IJiraTask[];
  children: IPage[];
  products: IProduct[];
  parent_id?: number;
  url?: string;
  project?: {
    created_at: string;
    id: number;
    name: string;
    updated_at: string;
  };
  ext?: string;
  content_jira_id?: string;
}

export interface IPagesResponse {
  data: {
    name: string;
    templates: IPage;
  };
}

export interface INewPage {
  name: string;
  copy_doc_link: string | undefined;
  owner: IUser;
  reviewers: IUser[];
  project: string;
  parent: string;
}

export interface INewPageResponse {
  data: {
    webpage: IPage;
  };
}

export const ChangeRequestType = {
  COPY_UPDATE: 0,
  PAGE_REFRESH: 1,
  NEW_WEBPAGE: 2,
  PAGE_REMOVAL: 3,
};

export interface IRequestChanges {
  due_date: string;
  reporter_struct: IUser;
  webpage_id: number;
  type: (typeof ChangeRequestType)[keyof typeof ChangeRequestType];
  summary?: string;
  description: string;
  request_type: string;
}

export interface IRequestRemoval {
  due_date?: string;
  reporter_struct: IUser;
  webpage_id: number;
  description: string;
  redirect_url: string;
  request_type: string;
}

export interface ISetProducts {
  webpage_id: number;
  product_ids: number[];
}
