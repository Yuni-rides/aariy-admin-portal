export type UploadedMediaItem = {
  fileId: string;
  key: string;
  url: string;
  visibility: "PRIVATE" | "PUBLIC" | string;
  purpose: string;
  market: string;
  contentType: string;
  sizeBytes: number;
};

export type MediaUploadResponse = {
  status: boolean;
  code: string;
  message: string;
  data: UploadedMediaItem[];
};