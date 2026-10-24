export function trackEvent(event: string) {
  if (
    typeof window === "undefined" ||
    window.location.pathname.startsWith("/admin") ||
    navigator.doNotTrack === "1"
  )
    return;
  if (document.documentElement.dataset.analytics !== "enabled") return;
  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
    keepalive: true,
  }).catch(() => {});
}
