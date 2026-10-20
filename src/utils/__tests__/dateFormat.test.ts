import { describe, it, expect } from "vitest";
import { isOfficialDate, tryAutoFixDate } from "../dateFormat";

describe("dateFormat utilities", () => {
  it("strictly validates DD/MM/AAAA and ISO AAAA-MM-DD", () => {
    expect(isOfficialDate("16/10/2026")).toBe(true);
    expect(isOfficialDate("01/01/2026")).toBe(true);
    expect(isOfficialDate("2026-10-16")).toBe(true);

    // Rejects two-digit years and US format
    expect(isOfficialDate("10/16/26")).toBe(false);
    expect(isOfficialDate("16/10/26")).toBe(false);
    expect(isOfficialDate("10/16/2026")).toBe(false); // month 16 is invalid
    expect(isOfficialDate("30/02/2026")).toBe(false); // Feb 30 does not exist
  });

  it("tryAutoFixDate fixes Excel 2-digit years and US dates to standard DD/MM/AAAA", () => {
    // 10/16/26 -> month 10, day 16, year 2026
    expect(tryAutoFixDate("10/16/26")).toBe("16/10/2026");

    // 11/30/26 -> month 11, day 30, year 2026
    expect(tryAutoFixDate("11/30/26")).toBe("30/11/2026");

    // 1/30/27 -> month 1, day 30, year 2027
    expect(tryAutoFixDate("1/30/27")).toBe("30/01/2027");

    // ISO format
    expect(tryAutoFixDate("2026-10-16")).toBe("16/10/2026");

    // Already valid DD/MM/AAAA
    expect(tryAutoFixDate("16/10/2026")).toBe("16/10/2026");
  });
});
