import { AUTH_PROVIDER_URL, CALLBACK_URL } from "./consts";
import { openPopup } from "./popup";
import { AuthCallbackParams } from "./types";

const CHANNEL_NAME = "passkey_sign";

export function openPasskeyAuthPopupAndWait(): Promise<`0x${string}`> {
  const channel = new BroadcastChannel(CHANNEL_NAME);
  console.log("🚀 ~ openPasskeyAuthPopupAndWait ~ channel:", channel)

  const popupUrl = new URL(AUTH_PROVIDER_URL);
  popupUrl.searchParams.set(
    "register_callback_url",
    `${CALLBACK_URL}/auth/callback`
  );

  const popup = openPopup(popupUrl.toString(), "passkey_popup");

  if (!popup) {
    channel.close();
    return Promise.reject(new Error("Popup was blocked"));
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Passkey popup timeout"));
    }, 5 * 60 * 1000);

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
      console.log("🚀 ~ openPasskeyAuthPopupAndWait ~ msg:", msg)
      if (!msg) return;

      clearInterval(timer);
      clearTimeout(timeout);
      cleanup();

      if (msg.type === "passkey_auth_result") {
        resolve(msg.payload as `0x${string}`);
      } else if (msg.type === "passkey_error") {
        reject(new Error(msg.error || "Passkey error"));
      }
    };
  });
}

export function openPasskeySignPopupAndWait(
  hashToSign: `0x${string}`
): Promise<AuthCallbackParams> {
  const channel = new BroadcastChannel(CHANNEL_NAME);

  const popupUrl = new URL(AUTH_PROVIDER_URL);
  popupUrl.searchParams.set("id", hashToSign);
  popupUrl.searchParams.set(
    "callback_url",
    `${CALLBACK_URL}/sign/callback`
  );

  const popup = openPopup(popupUrl.toString(), "passkey_popup");

  if (!popup) {
    channel.close();
    return Promise.reject(new Error("Popup was blocked"));
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Passkey popup timeout"));
    }, 5 * 60 * 1000);

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

      if (msg.type === "passkey_sign_result") {
        resolve(msg.payload as AuthCallbackParams);
      } else if (msg.type === "passkey_error") {
        reject(new Error(msg.error || "Passkey error"));
      }
    };
  });
}
