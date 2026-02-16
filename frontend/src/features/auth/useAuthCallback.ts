import { useEffect } from "react";
import type { AuthCallbackSearchParams } from "./types";

const CHANNEL_NAME = "passkey_sign";

export function parseSignCallbackParams(
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

export function parseCallbackParams(searchParams: URLSearchParams) {
  const program_id = searchParams.get("program_id");
  return program_id ? (program_id as `0x${string}`) : null;
}

function isAuthCallbackPage(): boolean {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "") || "";
  const path = window.location.pathname;
  const expectedPath = base ? `${base}/auth/callback` : "/auth/callback";
  return path === expectedPath || path.endsWith("/auth/callback");
}

function isSignCallbackPage(): boolean {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "") || "";
  const path = window.location.pathname;
  const expectedPath = base ? `${base}/sign/callback` : "/sign/callback";
  return path === expectedPath || path.endsWith("/sign/callback");
}

/**
 * Handles auth callback URL: parses params, broadcasts result or error
 * to the opener via BroadcastChannel, then closes the window.
 * Use on the /auth/callback page.
 */
export function useAuthCallback(): void {
  useEffect(() => {
    console.log("🚀 ~ useAuthCallback ~ isAuthCallbackPage:", isAuthCallbackPage());
    console.log("🚀 ~ useAuthCallback ~ isSignCallbackPage:", isSignCallbackPage());
    if (!isAuthCallbackPage() && !isSignCallbackPage()) return;

    const searchParams = new URLSearchParams(window.location.search);
    console.log("🚀 ~ useAuthCallback ~ searchParams:", searchParams);
    const isAuthCallback = isAuthCallbackPage();
    const id = searchParams.get("id");
    const program_id = searchParams.get("program_id");
    const error = searchParams.get("error");
    const params = isAuthCallback
      ? parseCallbackParams(searchParams)
      : parseSignCallbackParams(searchParams);
    console.log("🚀 ~ useAuthCallback ~ params:", params);

    if (id || program_id) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      if (error) {
        channel.postMessage({
          type: "passkey_error",
          id: id ?? program_id,
          error,
        });
      } else if (params) {
        console.log("🚀 ~ useAuthCallback ~ channel.postMessage:", params);
        const payload = typeof params === "string" ? params : (params satisfies AuthCallbackSearchParams);
        console.log("🚀 ~ useAuthCallback ~ payload:", payload);
        channel.postMessage({
          type: isAuthCallback ? "passkey_auth_result" : "passkey_sign_result",
          id: id ?? program_id,
          payload,
        });
      }
      channel.close();
      window.close();
    }
  }, []);
}
