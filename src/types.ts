export interface Lot {
  lot_id: string;
  tester: string;
  yield: number;
  uph: number;
  rework: number;
  status: "COMPLETE" | "HOLD" | "SCRAP" | "IN_PROCESS";
  count: number;
  date: string;
  priority: "HOT" | "NORMAL" | "LOW";
}

export interface Equipment {
  equipment_id: string;
  name: string;
  type: "ETCH" | "CVD" | "CMP" | "LITHO" | "WAT" | "INSPECT";
  status: "PRODUCTION" | "MAINTENANCE" | "QUALIFICATION" | "HOLD" | "DOWN";
  utilization: number;
  health: number;
  wph: number;
  alarms: number;
}

export interface Alarm {
  id: number;
  type: "critical" | "warning" | "info";
  title: string;
  meta: string;
  time: string;
}

export interface MRBDecision {
  lot_id: string;
  wafer_id: string;
  partial: boolean;
  cluster: boolean;
  pattern: boolean;
  syl: boolean;
  sbl: boolean;
  pcm: boolean;
  result: "GoodWafer" | "BadWafer" | "Review";
}

export interface AgentAction {
  id: string;
  type: "LOT_HOLD" | "RECIPE_ADJUST" | "PM_SCHEDULE";
  target: string;
  desc: string;
  confidence: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface Message {
  role: "user" | "agent";
  content: string;
  timestamp: string;
}
