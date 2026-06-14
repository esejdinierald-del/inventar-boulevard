import { TurnData } from "@/types/turn.types";
import { CalculationService } from "@/services/calculations";

interface PrintableTurnReportProps {
  turnName: string;
  turnData: TurnData;
  products: string[];
  coffeeTypes: string[];
  selectedDate: string;
  verifiedStaff: string | null;
  isAdminUnlocked?: boolean;
}

export const PrintableTurnReport = ({
  turnName,
  turnData,
  products,
  coffeeTypes,
  selectedDate,
  verifiedStaff,
}: PrintableTurnReportProps) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("sq-AL", { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
  };

  const totalCoffee = CalculationService.calculateTotalCoffee(turnData);
  const mulliriDif = CalculationService.calculateMulliriDif(
    turnData.mulliriFillim,
    turnData.mulliriPerfund,
    totalCoffee
  );
  
  const shpenzime = turnData.shpenzime || [];
  const totalShpenzime = shpenzime.reduce((sum, s) => sum + (s.vlera || 0), 0);
  const xhiroNeto = turnData.xhiro - totalShpenzime;

  return (
    <div className="hidden print:block print-report">
      {/* Print Header */}
      <div className="print-header">
        <div className="text-center font-bold text-lg">Bulevard Cafe</div>
        <div className="text-center text-sm">{formatDate(selectedDate)}</div>
        <div className="print-divider">================================</div>
        <div className="text-center">
          <strong>Turni {turnName}</strong>
          {verifiedStaff && <span> | {verifiedStaff}</span>}
        </div>
        <div className="print-divider">--------------------------------</div>
      </div>

      {/* Mulliri Info */}
      <div className="print-section">
        <div className="section-title">MULLIRI</div>
        <div className="print-row">
          <span>Fillim:</span>
          <span>{turnData.mulliriFillim} copa</span>
        </div>
        <div className="print-row print-row-highlight">
          <span>Perfundim:</span>
          <span className="font-bold">{turnData.mulliriPerfund} copa</span>
        </div>
        <div className="print-row">
          <span>Total Kafe:</span>
          <span>{totalCoffee}</span>
        </div>
        <div className={`print-row ${mulliriDif < 0 ? "text-negative" : mulliriDif > 0 ? "text-positive" : ""}`}>
          <span>Diferenca:</span>
          <span className="font-bold">{mulliriDif}</span>
        </div>
        <div className="print-divider">--------------------------------</div>
      </div>

      {/* Produktet */}
      <div className="print-section">
        <div className="section-title">PRODUKTET</div>
        <table className="thermal-table">
          <thead>
            <tr>
              <th className="text-left">Prod</th>
              <th>SF</th>
              <th>Gj</th>
              <th>Sh</th>
              <th>Fu</th>
              <th>Dif</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const data = turnData.products[product] || { stokFillim: 0, gjendje: 0, shiriti: 0, furnizime: 0 };
              const dif = CalculationService.calculateDif(data.stokFillim, data.furnizime, data.gjendje, data.shiriti);
              const shortName = product.length > 12 ? product.substring(0, 11) + "." : product;
              return (
                <tr key={product}>
                  <td className="text-left">{shortName}</td>
                  <td>{data.stokFillim}</td>
                  <td>{data.gjendje}</td>
                  <td>{data.shiriti}</td>
                  <td>{data.furnizime}</td>
                  <td className={`font-bold ${dif < 0 ? "text-negative" : dif > 0 ? "text-positive" : ""}`}>
                    {dif}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="print-divider">--------------------------------</div>
      </div>

      {/* Kafe */}
      <div className="print-section">
        <div className="section-title">KAFE</div>
        {coffeeTypes.map((coffee) => {
          const quantity = turnData.coffee[coffee] || 0;
          const shortName = coffee.length > 16 ? coffee.substring(0, 15) + "." : coffee;
          return (
            <div className="print-row" key={coffee}>
              <span>{shortName}</span>
              <span>{quantity}</span>
            </div>
          );
        })}
        <div className="print-row print-row-total">
          <span className="font-bold">TOTAL:</span>
          <span className="font-bold">{totalCoffee}</span>
        </div>
        <div className="print-divider">--------------------------------</div>
      </div>

      {/* Shpenzime */}
      {shpenzime.length > 0 && (
        <div className="print-section">
          <div className="section-title">SHPENZIME / ANULLIME</div>
          {shpenzime.map((s, index) => (
            <div className="print-row" key={index}>
              <span>{s.emertimi.length > 18 ? s.emertimi.substring(0, 17) + "." : s.emertimi}</span>
              <span>-{s.vlera.toLocaleString()}</span>
            </div>
          ))}
          <div className="print-row print-row-total">
            <span className="font-bold">TOTAL:</span>
            <span className="font-bold">-{totalShpenzime.toLocaleString()} ALL</span>
          </div>
          <div className="print-divider">--------------------------------</div>
        </div>
      )}

      {/* Xhiro */}
      <div className="print-section">
        <div className="section-title">XHIRO</div>
        <div className="print-row">
          <span>Xhiro Bruto:</span>
          <span>{turnData.xhiro.toLocaleString()} ALL</span>
        </div>
        {totalShpenzime > 0 && (
          <>
            <div className="print-row text-negative">
              <span>Shpenzime:</span>
              <span>-{totalShpenzime.toLocaleString()} ALL</span>
            </div>
            <div className="print-row print-row-highlight">
              <span className="font-bold">XHIRO NETO:</span>
              <span className="font-bold">{xhiroNeto.toLocaleString()} ALL</span>
            </div>
          </>
        )}
        {totalShpenzime === 0 && (
          <div className="xhiro-thermal">
            {turnData.xhiro.toLocaleString()} ALL
          </div>
        )}
        <div className="print-divider">================================</div>
      </div>

      {/* Footer */}
      <div className="print-footer">
        <div className="text-center text-xs">
          Printuar: {new Date().toLocaleDateString("sq-AL")} {new Date().toLocaleTimeString("sq-AL", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
};
