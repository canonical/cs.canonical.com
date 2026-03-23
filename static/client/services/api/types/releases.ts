export interface ITaggedField {
  value: unknown;
  type: string;
  has_custom_type: true;
}

export interface IImageValue {
  url: string;
  width: number;
  height: number;
}

export type ReleaseFieldValue = string | number | ITaggedField | Record<string, unknown>;

export type IReleasesData = Record<string, unknown>;

export interface IReleaseStatus {
  pr: Record<string, unknown> | null;
  pr_exists: boolean;
  branch: string;
}

export interface IReleasesResponse {
  releases: IReleasesData;
  status: IReleaseStatus;
}

export function isTaggedField(value: unknown): value is ITaggedField {
  return (
    typeof value === "object" && value !== null && "has_custom_type" in value && "type" in value && "value" in value
  );
}

export function isImageValue(value: unknown): value is IImageValue {
  return typeof value === "object" && value !== null && "url" in value && "width" in value && "height" in value;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !isTaggedField(value);
}
