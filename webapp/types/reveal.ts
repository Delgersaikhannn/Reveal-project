/**
 * Resolved identity from ENS and address lookup
 */
export interface ResolvedIdentity {
  address: string;
  ens: string | null;
  displayName: string;
  textRecords: Record<string, string | null>;
}

/**
 * Generic API response wrapper
 */
export type ApiResponse<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };
