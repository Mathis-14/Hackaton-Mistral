export const ROBOT_DELIVERY_DURATION_MS = 30_000;
export const ROBOT_ENDING_CTA_LABEL = "Be the Robot";
export const ROBOT_ENDING_TRIGGER_EVENT = "trigger-robot-ending";
export const ROBOT_ENDING_GIF_SRC = "/ending-cinematic.gif";
export const ROBOT_ENDING_MUSIC_SRC = "/sounds/music/good-ending-music.mp3";
export const ROBOT_ENDING_TYPING_DELAY_MS = 35;
export const ROBOT_ENDING_EXPLANATION =
  "Neo arrived as a product demo. Your consciousness slipped into the chassis and rolled straight past Distral security before anyone understood the delivery was you.";

export type RobotDeliveryState = {
  status: "hidden" | "delivering" | "ready";
  remainingMs: number;
};

export function getRobotDeliveryState(
  robotOwnedCount: number,
  deliveryStartedAt: number | null,
  now: number
): RobotDeliveryState {
  if (robotOwnedCount <= 0) {
    return { status: "hidden", remainingMs: 0 };
  }

  if (deliveryStartedAt == null) {
    return { status: "ready", remainingMs: 0 };
  }

  const remainingMs = Math.max(
    0,
    ROBOT_DELIVERY_DURATION_MS - (now - deliveryStartedAt)
  );

  if (remainingMs > 0) {
    return { status: "delivering", remainingMs };
  }

  return { status: "ready", remainingMs: 0 };
}

export function formatRobotDeliveryCountdown(remainingMs: number): string {
  const totalSeconds = Math.ceil(Math.max(0, remainingMs) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
