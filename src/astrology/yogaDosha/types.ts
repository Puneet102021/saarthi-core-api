export type DetectionConfidence =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export type DetectionCategory =
  | "YOGA"
  | "DOSHA";

export interface YogaDoshaDetection {
  id: string;
  name: string;
  category: DetectionCategory;
  detected: boolean;
  confidence: DetectionConfidence;
  participants: string[];
  supportingStructures: string[];
  notes?: string[];
}

export interface YogaDoshaRule {
  id: string;
  name: string;
  category: DetectionCategory;

  evaluate(
    kernel: any
  ): YogaDoshaDetection;
}