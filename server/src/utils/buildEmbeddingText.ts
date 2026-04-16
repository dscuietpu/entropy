type MaybeString = string | null | undefined;

const clean = (value: MaybeString): string => (value ?? "").toString().trim();

const list = (values?: MaybeString[] | null): string[] =>
  (values ?? []).map(clean).filter(Boolean);

const joinParts = (parts: Array<string | string[]>): string =>
  parts
    .flatMap((p) => (Array.isArray(p) ? p : [p]))
    .map((p) => p.trim())
    .filter(Boolean)
    .join(" | ");

export interface BuildHospitalEmbeddingTextInput {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  specialties?: string[];
  facilities?: string[];
  departments?: string[];
}

export const buildHospitalEmbeddingText = (input: BuildHospitalEmbeddingTextInput): string =>
  joinParts([
    clean(input.name),
    clean(input.description),
    clean(input.address),
    clean(input.city),
    clean(input.state),
    list(input.specialties),
    list(input.facilities),
    list(input.departments),
  ]);

export interface BuildEquipmentEmbeddingTextInput {
  name: string;
  type?: string;
  hospitalSection?: string;
}

export const buildEquipmentEmbeddingText = (input: BuildEquipmentEmbeddingTextInput): string =>
  joinParts([clean(input.name), clean(input.type), clean(input.hospitalSection)]);

export interface BuildMedicalShopEmbeddingTextInput {
  name: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  availableMedicines?: string[];
}

export const buildMedicalShopEmbeddingText = (
  input: BuildMedicalShopEmbeddingTextInput
): string =>
  joinParts([
    clean(input.name),
    clean(input.area),
    clean(input.city),
    clean(input.state),
    clean(input.pincode),
    list(input.availableMedicines),
  ]);

