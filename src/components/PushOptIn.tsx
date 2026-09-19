import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { disablePush, enablePush, pushSupported } from "@/lib/push";

const PushOptIn = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(pushSupported());
    if (!pushSupported()) return;
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription();
      setEnabled(Boolean(sub) && Notification.permission === "granted");
    });
  }, [user]);

  if (!user || !supported) return null;

  const toggle = async () => {
    setBusy(true);
    if (enabled) {
      await disablePush(user.id);
      setEnabled(false);
      toast({ title: "Notifications turned off for this device" });
    } else {
      const result = await enablePush(user.id);
      setEnabled(result.ok);
      toast({
        title: result.message,
        variant: result.ok ? "default" : "destructive",
      });
    }
    setBusy(false);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      disabled={busy}
      aria-label={enabled ? "Turn off notifications" : "Turn on notifications"}
    >
      {enabled ? <Bell className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4" />}
    </Button>
  );
};

export default PushOptIn;
