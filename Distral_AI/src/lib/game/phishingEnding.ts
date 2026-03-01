export type PhishingEndingAction = "trigger" | "confirm" | "advance";

export function advancePhishingEndingPhase(
  currentPhase: number,
  action: PhishingEndingAction
): number {
  switch (action) {
    case "trigger":
      return currentPhase === 0 ? 1 : currentPhase;
    case "confirm":
      return currentPhase === 2 ? 3 : currentPhase;
    case "advance":
      switch (currentPhase) {
        case 1:
          return 2;
        case 3:
          return 4;
        case 4:
          return 5;
        case 5:
          return 6;
        default:
          return currentPhase;
      }
  }
}

export function getPhishingEndingAutoAdvanceDelay(phase: number): number | null {
  switch (phase) {
    case 1:
      return 200;
    case 3:
      return 2000;
    case 4:
      return 1500;
    case 5:
      return 3000;
    default:
      return null;
  }
}
