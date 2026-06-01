import { CurrencyField } from "@/components/CommonFields";

type PaymentMode = "auto" | "manual";

interface PaymentPlanFieldsProps {
  cuotas: string;
  modoPago: PaymentMode;
  manualCuotas: number[];
  fechasCuotas: string[];
  totalObjetivoOption: string;
  customTotal: number;
  valorFormacion: number;
  onCuotasChange: (value: string) => void;
  onModoPagoChange: (value: PaymentMode) => void;
  onManualCuotasChange: (value: number[]) => void;
  onFechasCuotasChange: (value: string[]) => void;
  onTotalObjetivoOptionChange: (value: string) => void;
  onCustomTotalChange: (value: number) => void;
  onValorFormacionChange: (value: number) => void;
}

const PaymentPlanFields = ({
  cuotas,
  modoPago,
  manualCuotas,
  fechasCuotas,
  totalObjetivoOption,
  customTotal,
  valorFormacion,
  onCuotasChange,
  onModoPagoChange,
  onManualCuotasChange,
  onFechasCuotasChange,
  onTotalObjetivoOptionChange,
  onCustomTotalChange,
  onValorFormacionChange,
}: PaymentPlanFieldsProps) => {
  const updateSelectedTotal = (val: string) => {
    onTotalObjetivoOptionChange(val);
    if (val !== "custom" && modoPago === "manual" && cuotas === "1") {
      onManualCuotasChange([parseInt(val)]);
    }
  };

  const updateCustomTotal = (val: string) => {
    const newTotal = parseInt(val) || 0;
    onCustomTotalChange(newTotal);
    if (modoPago === "manual" && cuotas === "1") {
      onManualCuotasChange([newTotal]);
    }
  };

  return (
    <div className="p-3 bg-secondary/20 rounded-lg border border-border">
      <label className="section-label mb-2 block">PLAN DE PAGOS</label>

      <div className="mb-3">
        <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">
          Monto de Formación
        </label>
        <CurrencyField
          value={valorFormacion ? valorFormacion.toString() : ""}
          onChange={(val) => onValorFormacionChange(parseInt(val) || 0)}
          className="w-full"
          inputClassName="w-full p-2 text-sm rounded-md border border-input bg-background [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="Ej: 13.000.000"
        />
      </div>

      <div className="mb-3">
        <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">
          Valor Total Objetivo
        </label>
        <div className="flex gap-2">
          <select
            value={totalObjetivoOption}
            onChange={(e) => updateSelectedTotal(e.target.value)}
            className={`p-2 text-sm rounded-md border border-input bg-background ${totalObjetivoOption === "custom" ? "w-1/2" : "w-full"}`}
          >
            <option value="13000000">$ 13.000.000</option>
            <option value="12000000">$ 12.000.000</option>
            <option value="custom">Personalizado</option>
          </select>
          {totalObjetivoOption === "custom" && (
            <CurrencyField
              value={customTotal ? customTotal.toString() : ""}
              onChange={updateCustomTotal}
              className="w-1/2"
              inputClassName="w-full p-2 pl-7 text-sm rounded-md border border-input bg-background"
              placeholder="Ingrese valor..."
            />
          )}
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-background/50 rounded-md mb-3">
        <button
          className={`flex-1 py-1 px-3 rounded-md text-[10px] font-bold transition-all ${modoPago === "auto" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
          onClick={() => onModoPagoChange("auto")}
        >
          AUTOMATICO
        </button>
        <button
          className={`flex-1 py-1 px-3 rounded-md text-[10px] font-bold transition-all ${modoPago === "manual" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
          onClick={() => onModoPagoChange("manual")}
        >
          MANUAL
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="section-label mb-1 block">Numero de Cuotas</label>
          <select
            value={cuotas}
            onChange={(e) => onCuotasChange(e.target.value)}
            className="w-full p-2 text-sm rounded-md border border-input bg-background"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((n) => (
              <option key={n} value={n.toString()}>
                {n} {n === 1 ? "Cuota" : "Cuotas"}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
          {Array.from({ length: parseInt(cuotas) || 1 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-2 items-end bg-background/40 p-2 rounded border border-border/50"
            >
              <div className="flex-1">
                <label className="text-[9px] font-bold uppercase text-muted-foreground mb-1 block">
                  Cuota {i + 1}
                </label>
                {modoPago === "auto" ? (
                  <input
                    type="text"
                    disabled
                    className="w-full p-1.5 text-xs rounded border border-input bg-background/50 disabled:opacity-50"
                    placeholder="Automatico"
                  />
                ) : (
                  <CurrencyField
                    value={
                      manualCuotas[i] !== 0 ? manualCuotas[i].toString() : ""
                    }
                    onChange={(val) => {
                      const newCuotas = [...manualCuotas];
                      newCuotas[i] = parseInt(val) || 0;
                      onManualCuotasChange(newCuotas);
                    }}
                    className="w-full"
                    inputClassName="w-full p-1.5 pl-6 text-xs rounded border border-input bg-background/50"
                    placeholder="0"
                  />
                )}
              </div>
              <div className="flex-1">
                <label className="text-[9px] font-bold uppercase text-muted-foreground mb-1 block">
                  Vencimiento
                </label>
                <input
                  type="date"
                  value={fechasCuotas[i] || ""}
                  onChange={(e) => {
                    const newFechas = [...fechasCuotas];
                    newFechas[i] = e.target.value;
                    onFechasCuotasChange(newFechas);
                  }}
                  className="w-full p-1.5 text-xs rounded border border-input bg-background/50"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentPlanFields;
