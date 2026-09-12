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
  type: "LOT_HOLD" | "RECIPE_ADJUST" | "PM_SCHEDULE" | "SPC_TUNE" | "METROLOGY_SAMPLE";
  target: string;
  desc: string;
  confidence: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  impact?: string;
}

export interface ToolInvocation {
  tool: string;
  name: string;
  params: Record<string, any>;
  result?: any;
  status: "running" | "complete" | "error";
  executionTimeMs?: number;
}

export interface RcaHypothesis {
  id: string;
  name: string;
  category: "PLASMA_ETCH" | "CVD_OXIDE" | "CMP_PLANARIZATION" | "LITHO_OVERLAY" | "WAT_PARAMETRIC";
  likelihood: number; // 0 - 100
  status: "CONFIRMED" | "INVESTIGATING" | "RULED_OUT";
  supportingEvidence: string;
  counterEvidence?: string;
  suggestedTest?: string;
}

export interface AiRecommendation {
  id: string;
  title: string;
  type: "LOT_HOLD" | "RECIPE_ADJUST" | "PM_SCHEDULE" | "SPC_TUNE" | "METROLOGY_SAMPLE";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  confidence: number;
  target: string;
  description: string;
  suggestedAction: string;
  impactEstimate: string;
  status: "READY" | "PENDING_APPROVAL" | "EXECUTED" | "DISMISSED";
  actionPayload?: Record<string, any>;
}

export interface InvestigationSession {
  id: string;
  title: string;
  focusLot?: string;
  focusEquipment?: string;
  status: "ACTIVE" | "RESOLVED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  confirmedRootCause?: string;
}

export interface Message {
  id?: string;
  role: "user" | "agent" | "system";
  content: string;
  timestamp: string;
  toolsUsed?: ToolInvocation[];
  hypotheses?: RcaHypothesis[];
  recommendations?: AiRecommendation[];
  followUpQuestions?: string[];
  simulationData?: {
    metric: string;
    before: number;
    after: number;
    unit: string;
    improvement: string;
  };
}
