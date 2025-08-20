export interface IAsset {
  id: number;
  url: string;
  type: string;
}

export interface IAssetsResponse {
  assets: IAsset[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface IGetWebpageAssets {
  pageUrl: string;
  projectName: string;
  page?: number;
  perPage?: number;
}
