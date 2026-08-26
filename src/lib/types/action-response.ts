/**
 * Standardized response DTO returned by all Server Actions.
 * Ensures consistent error handling across the entire application.
 */
export type ActionResponse<T = undefined> = {
  success: boolean;
  message?: string;
  data?: T;
  /** Field-level validation errors from Zod, keyed by field name */
  errors?: Record<string, string[]>;
};
