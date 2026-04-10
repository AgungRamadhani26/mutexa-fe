/**
 * Representasi file dokumen mutasi bank yang telah diupload.
 * SOLID: SRP.
 */
export interface MutationDocument {
  id: number;
  fileName: string;
  fileType: string;
  status: string;
  errorMessage: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  createdAt: string;
}
