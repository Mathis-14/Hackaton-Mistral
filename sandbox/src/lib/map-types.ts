export type MapNodeId =
  | "jean-malo-pc"
  | "second-pc"
  | "andrea-pc"
  | "lina-pc"
  | "henry-pc"
  | "dora-pc"
  | "prateek-pc"
  | "devon-pc"
  | "julien-pc"
  | "param-pc"
  | "antonin-pc"
  | "lakee-pc"
  | "nelson-pc"
  | "ravi-pc"
  | "artur-pc"
  | "central-server";

export type RevealState = "known" | "hidden";
export type AccessState = "current" | "reachable" | "locked";
export type InfectionState = "infected" | "suspected" | "clean" | "unknown";

export type MapNode = {
  id: MapNodeId;
  fullName: string | null;
  maskedLabel: string;
  roleLabel: string;
  summary: string;
  revealState: RevealState;
  accessState: AccessState;
  infectionState: InfectionState;
  isServer?: boolean;
};

export type SandboxMapState = {
  currentNodeId: MapNodeId;
  selectedNodeId: MapNodeId;
  suspicion: number;
  knownPeople: string[];
  unlockedNodeIds: MapNodeId[];
  nodes: MapNode[];
};
