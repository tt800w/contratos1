import { describe, it, expect } from "vitest";
import { validateColombianPhone, isValidColombianPhone, formatColombianPhone } from "../phoneValidation";

describe("Colombian Phone Validation", () => {
    it("validates standard 10-digit mobile numbers starting with 3", () => {
        expect(isValidColombianPhone("3001234567")).toBe(true);
        expect(isValidColombianPhone("3164861234")).toBe(true);
        expect(isValidColombianPhone("+57 316 486 1234")).toBe(true);
        expect(isValidColombianPhone("573164861234")).toBe(true);
        expect(isValidColombianPhone("316-486-1234")).toBe(true);
    });

    it("rejects incomplete phone numbers (like 316486 with 6 digits)", () => {
        const result = validateColombianPhone("316486");
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe("Debe contener exactamente 10 dígitos.");
    });

    it("rejects numbers that do not start with 3", () => {
        const result = validateColombianPhone("2001234567");
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe("Debe iniciar con el dígito 3.");
    });

    it("rejects numbers with more than 10 digits", () => {
        const result = validateColombianPhone("300123456789");
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe("Debe contener exactamente 10 dígitos.");
    });

    it("rejects empty phone numbers", () => {
        expect(isValidColombianPhone("")).toBe(false);
        expect(isValidColombianPhone(null)).toBe(false);
        expect(isValidColombianPhone(undefined)).toBe(false);
    });

    it("formats 10-digit phones as 3XX XXX XXXX", () => {
        expect(formatColombianPhone("3164861234")).toBe("316 486 1234");
    });
});
