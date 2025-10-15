export interface IReportBugBody {
  due_date: string;
  reporter_struct: object;
  description: string;
  summary: string;
  website: string;
}

export interface IReportBugResponse {
  data: {
    issue: {
      key: string;
      self: string;
      id: string;
    };
  };
}

export interface IRequestFeatureBody {
  due_date: string;
  reporter_struct: object;
  description: string;
  summary: string;
  objective: string;
}

export interface IRequestFeatureResponse {
  data: {
    issue: {
      key: string;
      self: string;
      id: string;
    };
  };
}
