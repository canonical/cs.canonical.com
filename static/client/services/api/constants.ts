export const ENDPOINTS = {
  getPagesTree: (domain: string, noCache?: boolean, branch: string = "main") =>
    `/api/get-tree/${domain}/${branch}${noCache ? "/True" : ""}`,
  getUsers: (inputStr: string) => `/api/get-users/${inputStr}`,
  setOwner: "/api/set-owner",
  setReviewers: "/api/set-reviewers",
  createNewPage: "/api/create-page",
  requestChanges: "/api/request-changes",
  requestRemoval: "/api/request-removal",
  currentUser: "/api/current-user",
  getProducts: "/api/get-products",
  setProducts: "/api/set-product",
};

export const REST_TYPES = {
  GET: "get",
  POST: "post",
  PUT: "put",
  DELETE: "delete",
  PATCH: "patch",
};
