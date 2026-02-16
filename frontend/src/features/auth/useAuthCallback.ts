import { useEffect } from "react";
import type { AuthCallbackSearchParams } from "./types";

const CHANNEL_NAME = "passkey_sign";

export function parseCallbackParams(
  searchParams: URLSearchParams
): AuthCallbackSearchParams | null {
  const id = searchParams.get("id");
  const signature = searchParams.get("signature");
  const authenticator_data = searchParams.get("authenticator_data");
  const credential_id = searchParams.get("credential_id");

  if (!id || !signature || !authenticator_data || !credential_id) {
    return null;
  }

  return {
    id: id as `0x${string}`,
    signature: signature as `0x${string}`,
    authenticator_data: authenticator_data as `0x${string}`,
    credential_id: credential_id as `0x${string}`,
    rid: searchParams.get("rid") ?? undefined,
    error: searchParams.get("error") ?? undefined,
  };
}

function isAuthCallbackPage(): boolean {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "") || "";
  const path = window.location.pathname;
  const expectedPath = base ? `${base}/auth/callback` : "/auth/callback";
  return path === expectedPath || path.endsWith("/auth/callback");
}

/**
 * Handles auth callback URL: parses params, broadcasts result or error
 * to the opener via BroadcastChannel, then closes the window.
 * Use on the /auth/callback page.
 */
export function useAuthCallback(): void {
  useEffect(() => {
    if (!isAuthCallbackPage()) return;

    const searchParams = new URLSearchParams(window.location.search);
    console.log("🚀 ~ useAuthCallback ~ searchParams:", searchParams)
    const id = searchParams.get("id");
    const error = searchParams.get("error");
    const params = parseCallbackParams(searchParams);
    console.log("🚀 ~ useAuthCallback ~ params:", params)

    if (id) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      if (error) {
        channel.postMessage({
          type: "passkey_error",
          id,
          error,
        });
      } else if (params) {
        channel.postMessage({
          type: "passkey_result",
          id,
          payload: params satisfies AuthCallbackSearchParams,
        });
      }
      channel.close();
      window.close();
    }
  }, []);
}
