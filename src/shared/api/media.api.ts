import { httpUpload } from "./http";
import { MediaUploadResponse, UploadedMediaItem } from "./media.types";

export const mediaApi = {
  /**
   * Multiple ya single files upload karne ke liye (returns full array)
   */
  uploadFiles: async (
    files: File[],
    options?: {
      fieldName?: string; // default: "files" (ya agar backend "file" leta hai to pass kar dein)
      purpose?: string;
      visibility?: "PUBLIC" | "PRIVATE";
      onProgress?: (percent: number) => void;
    }
  ): Promise<UploadedMediaItem[]> => {
    const formData = new FormData();
    const fieldName = options?.fieldName ?? "files";

    files.forEach((file) => {
      formData.append(fieldName, file);
    });

    if (options?.purpose) formData.append("purpose", options.purpose);
    // if (options?.visibility) formData.append("visibility", options.visibility);

    const res = await httpUpload.post<MediaUploadResponse>(
      "/media/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (options?.onProgress && progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            options.onProgress(percent);
          }
        },
      }
    );

    if (!res.data?.status || !Array.isArray(res.data?.data)) {
      throw new Error(res.data?.message || "Media upload failed");
    }

    console.log(res.data);

    return res.data.data;
  },

  /**
   * Single file upload ke liye convenient wrapper (direct 1st item return karega)
   */
  uploadFile: async (
    file: File,
    options?: {
      fieldName?: string;
      purpose?: string;
      visibility?: "PUBLIC" | "PRIVATE";
      onProgress?: (percent: number) => void;
    }
  ): Promise<UploadedMediaItem> => {
    const uploaded = await mediaApi.uploadFiles([file], options);
    if (!uploaded[0]) {
      throw new Error("No file returned from server");
    }

    console.log("[Media Api] Single file uploaded")
    return uploaded[0];
  },
};