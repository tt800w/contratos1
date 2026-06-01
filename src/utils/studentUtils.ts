import { CamperData } from "@/utils/excelParser";
import { ContractAgeCategory } from "@/types/contracts";

const parseBirthDate = (value?: string): Date | null => {
  if (!value) return null;
  const normalized = value.trim();
  const date = new Date(normalized);
  if (!Number.isNaN(date.getTime())) {
    return date;
  }

  const slashParts = normalized.split(/[\/\-\.]/).map((part) => part.trim());
  if (slashParts.length === 3) {
    const [a, b, c] = slashParts;
    const numericParts = slashParts.map((part) => parseInt(part, 10));
    if (numericParts.every((value) => !Number.isNaN(value))) {
      if (numericParts[0] > 31) {
        return new Date(numericParts[0], numericParts[1] - 1, numericParts[2]);
      }
      return new Date(numericParts[2], numericParts[1] - 1, numericParts[0]);
    }
  }

  return null;
};

const getAgeFromBirthDate = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  return age;
};

export const getStudentAgeCategory = (
  raw?: CamperData | null,
): ContractAgeCategory | "unknown" => {
  if (!raw) return "unknown";

  // Primero verificar tipo de identificación (CC = mayor, TI = menor)
  const tipoId = raw.tipoIdentificacion?.trim().toUpperCase();
  if (tipoId === "CC" || tipoId === "CEDULA" || tipoId === "CÉDULA") {
    return "mayor";
  }
  if (
    tipoId === "TI" ||
    tipoId === "TARJETA IDENTIDAD" ||
    tipoId === "TARJETA DE IDENTIDAD"
  ) {
    return "menor";
  }

  // Fallback: edad numérica
  const ageField = raw.edad?.trim();
  if (ageField) {
    const numberAge = Number(ageField.replace(/[^0-9]/g, ""));
    if (!Number.isNaN(numberAge)) {
      return numberAge < 18 ? "menor" : "mayor";
    }
  }

  // Fallback: fecha de nacimiento
  const birthDate = parseBirthDate(raw.fechaNacimiento);
  if (birthDate) {
    const parsedAge = getAgeFromBirthDate(birthDate);
    return parsedAge < 18 ? "menor" : "mayor";
  }

  return "unknown";
};
