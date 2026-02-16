import { AUTH_PROVIDER_URL } from "./consts";
import { openPopup } from "./popup";
import { AuthCallbackParams } from "./types";

const CHANNEL_NAME = "passkey_sign";

export function openPasskeyPopupAndWait(
  hashToSign: `0x${string}`
): Promise<AuthCallbackParams> {
  const channel = new BroadcastChannel(CHANNEL_NAME);
  // const requestId = crypto.randomUUID();
  // popupUrl.searchParams.set("rid", requestId);

  const popupUrl = new URL(AUTH_PROVIDER_URL);
  popupUrl.searchParams.set("id", hashToSign);
  popupUrl.searchParams.set("callback_url", 'http://localhost:5173/one-of-us/auth/callback');

  const popup = openPopup(popupUrl.toString(), "passkey_popup");

  if (!popup) {
    channel.close();
    return Promise.reject(new Error("Popup was blocked"));
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Passkey popup timeout"));
    }, 2 * 60 * 1000);

    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        clearTimeout(timeout);
        cleanup();
        reject(new Error("Popup was closed"));
      }
    }, 300);

    function cleanup() {
      channel.onmessage = null;
      channel.close();
    }

    channel.onmessage = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || msg.id !== hashToSign) return;

      clearInterval(timer);
      clearTimeout(timeout);
      cleanup();

      if (msg.type === "passkey_result") {
        resolve(msg.payload as AuthCallbackParams);
      } else if (msg.type === "passkey_error") {
        reject(new Error(msg.error || "Passkey error"));
      }
    };
  });
}
