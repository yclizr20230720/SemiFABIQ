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
  domainLinks?: {
    fdc?: string;
    cp?: string;
    wat?: string;
    spc?: string;
    defect?: string;
  };
}

export interface EngineerVerdict {
  id: string;
  sessionId: string;
  verdict: "CONFIRMED_BY_ENGINEER" | "DISPUTED" | "REQUIRES_METROLOGY";
  engineerName: string;
  shiftId: string;
  notes: string;
  agreedHypothesisId?: string;
  timestamp: string;
}

export interface DomainEvidenceTrace {
  lotId: string;
  equipmentId: string;
  fdc: {
    dtwDistance: number;
    zScore: number;
    actualMaxPressure: number;
    baselinePressure: number;
    actualRfPhase: number;
    baselineRfPhase: number;
    points: {
      stepName: string;
      second: number;
      pressureBaseline: number;
      pressureActual: number;
      rfPhaseBaseline: number;
      rfPhaseActual: number;
    }[];
  };
  cp: {
    grossYield: number;
    baselineYield: number;
    bin106Count: number;
    bin106Pct: number;
    radialPoints: {
      radiusMm: number;
      yieldPct: number;
      defectDieCount: number;
    }[];
    pareto: {
      bin: number;
      name: string;
      count: number;
      pct: number;
    }[];
  };
  wat: {
    toxMean: number;
    toxTarget: number;
    toxUsl: number;
    toxLsl: number;
    cpk: number;
    ruleViolation: string;
    histogram: {
      binRange: string;
      count: number;
      normalCurve: number;
    }[];
    correlation: {
      tox: number;
      ioff: number;
      isOutlier: boolean;
    }[];
  };
  spc: {
    ruleViolation: string;
    ucl: number;
    cl: number;
    lcl: number;
    sigma2U: number;
    sigma2L: number;
    runPoints: {
      waferIndex: number;
      lotId: string;
      value: number;
      violation?: string;
    }[];
  };
  defect: {
    totalAdders: number;
    zones: {
      zone: string;
      density: number;
      count: number;
    }[];
    classifications: {
      type: string;
      count: number;
      pct: number;
    }[];
  };
  engineerVerdict?: EngineerVerdict;
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
