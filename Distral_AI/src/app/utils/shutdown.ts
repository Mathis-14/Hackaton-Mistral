export function triggerSystemShutdown(reason: string) {
    if (typeof window !== "undefined") {
        window.dispatchEvent(
            new CustomEvent("trigger-shutdown", { detail: { reason } })
        );
    }
}
