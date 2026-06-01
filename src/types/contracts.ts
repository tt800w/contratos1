export type ContractAgeCategory = "menor" | "mayor";
export type ContractFilter = "all" | ContractAgeCategory;

export interface StoredContract {
  id: string;
  title: string;
  ageCategory: ContractAgeCategory;
  /** Indica si el contrato incluye plan de pagos */
  paymentPlan?: boolean;
  fileName: string;
  fileType: string;
  dataUrl: string;
  uploadedAt: string;
}
