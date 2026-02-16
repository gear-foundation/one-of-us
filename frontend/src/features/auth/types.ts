/** Success callback params with passkey signature */
export interface AuthCallbackParams {
  /** Account address (id) in hex */
  id: `0x${string}`;
  /** Signature in hex */
  signature: `0x${string}`;
  /** authenticator_data in hex */
  authenticator_data: `0x${string}`;
  /** credential_id in hex */
  credential_id: `0x${string}`;
}

/** All callback page query params (including internal) */
export interface AuthCallbackSearchParams extends AuthCallbackParams {
  /** Request id for popup flow */
  rid?: string;
  /** Error message */
  error?: string;
}
