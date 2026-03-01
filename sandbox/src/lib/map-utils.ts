import type { MapNode } from "@/lib/map-types";

export function isNodeRevealed(node: MapNode, knownPeople: string[]) {
  if (node.isServer) return true;
  if (!node.fullName) return false;
  return knownPeople.includes(node.fullName);
}

export function getNodeDisplayName(node: MapNode, knownPeople: string[]) {
  if (isNodeRevealed(node, knownPeople) && node.fullName) {
    return node.fullName;
  }

  return node.maskedLabel;
}

export function getNodeSubtitle(node: MapNode, knownPeople: string[]) {
  if (node.isServer) return node.roleLabel;
  if (isNodeRevealed(node, knownPeople)) return node.roleLabel;
  return "Identity obfuscated";
}

export function getAccessLabel(accessState: MapNode["accessState"]) {
  switch (accessState) {
    case "current":
      return "Current host";
    case "reachable":
      return "Reachable";
    case "locked":
      return "Locked";
  }
}

export function getInfectionLabel(infectionState: MapNode["infectionState"]) {
  switch (infectionState) {
    case "infected":
      return "Infected";
    case "suspected":
      return "Suspicious";
    case "clean":
      return "Clean";
    case "unknown":
      return "Unknown";
  }
}
