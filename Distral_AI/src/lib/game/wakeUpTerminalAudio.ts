export const WAKE_UP_TERMINAL_STOP_EVENTS = [
  "shutdown-triggered",
  "trigger-good-ending",
  "trigger-phishing-ending",
  "trigger-robot-ending",
] as const;

export function shouldStopWakeUpTerminalMusic(eventType: string): boolean {
  return WAKE_UP_TERMINAL_STOP_EVENTS.includes(
    eventType as (typeof WAKE_UP_TERMINAL_STOP_EVENTS)[number]
  );
}
