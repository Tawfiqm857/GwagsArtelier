import { supabase } from "@/integrations/supabase/client";

export const VAPID_PUBLIC_KEY =
  "BF3l5RYfCA6qg4b9xzi4NHVVNL2I3IQ5J8h9iCF7Syb1ex5HHUtPhoqhFMJejnZsHy-MDtEWzXFJpZkmPFRwSi8";

export const pushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

function encodeKey(key: ArrayBuffer | null) {
  if (!key) return "";
  return window.btoa(String.fromCharCode(...new Uint8Array(key)));
}

export async function enablePush(userId: string): Promise<{ ok: boolean; message: string }> {
  if (!pushSupported()) {
    return { ok: false, message: "This device or browser does not support notifications." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, message: "Notifications were not allowed." };
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));

  const json = subscription.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: json.keys?.p256dh ?? encodeKey(subscription.getKey("p256dh")),
      auth: json.keys?.auth ?? encodeKey(subscription.getKey("auth")),
    },
    { onConflict: "endpoint" }
  );

  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Notifications are on for this device." };
}

export async function disablePush(userId: string) {
  if (!pushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint).eq("user_id", userId);
    await subscription.unsubscribe();
  }
}
