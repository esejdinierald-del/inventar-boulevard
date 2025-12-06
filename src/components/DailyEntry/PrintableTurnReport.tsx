import { TurnData, ProductData } from "@/types/turn.types";
import { CalculationService } from "@/services/calculations";

interface PrintableTurnReportProps {
  turnName: string;
  turnData: TurnData;
  products: string[];
  coffeeTypes: string[];
  selectedDate: string;
  verifiedStaff: string | null;
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
    return date.toLocaleDateString('sq-AL', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const totalCoffee = CalculationService.calculateTotalCoffee(turnData);
  const mulliriDif = CalculationService.calculateMulliriDif(
    turnData.mulliriFillim,
    turnData.mulliriPerfund,
    totalCoffee
  );

  return (
    <div className="hidden print:block print-report">
      {/* Print Header */}
      <div className="print-header">
        <h1>Bulevard Cafe</h1>
        <div className="print-date">{formatDate(selectedDate)}</div>
        <div className="print-turn">
          Turni {turnName} - Mbyllja
          {verifiedStaff && ` | Stafi: ${verifiedStaff}`}
        </div>
      </div>

      {/* Mulliri Perfund */}
      <div className="print-section mulliri-section">
        <h3>Mulliri</h3>
        <table>
          <tbody>
            <tr>
              <td className="label-cell">Mulliri Fillim</td>
              <td className="value-cell">{turnData.mulliriFillim} kg</td>
            </tr>
            <tr>
              <td className="label-cell">Mulliri Perfund</td>
              <td className="value-cell font-bold">{turnData.mulliriPerfund} kg</td>
            </tr>
            <tr>
              <td className="label-cell">Total Kafe</td>
              <td className="value-cell">{totalCoffee}</td>
            </tr>
            <tr>
              <td className="label-cell">Diferenca Mulliri</td>
              <td className={`value-cell font-bold ${mulliriDif < 0 ? 'dif-negative' : mulliriDif > 0 ? 'dif-positive' : ''}`}>
                {mulliriDif}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Produktet */}
      <div className="print-section products-section">
        <h3>Produktet - Turni {turnName}</h3>
        <table>
          <thead>
            <tr>
              <th>Produkti</th>
              <th>Stok Fillim</th>
              <th>Gjendje</th>
              <th>Shiriti</th>
              <th>Furnizime</th>
              <th>Dif</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const data = turnData.products[product] || { stokFillim: 0, gjendje: 0, shiriti: 0, furnizime: 0 };
              const dif = CalculationService.calculateDif(data.stokFillim, data.furnizime, data.gjendje, data.shiriti);
              return (
                <tr key={product}>
                  <td>{product}</td>
                  <td className="text-center">{data.stokFillim}</td>
                  <td className="text-center">{data.gjendje}</td>
                  <td className="text-center">{data.shiriti}</td>
                  <td className="text-center">{data.furnizime}</td>
                  <td className={`text-center font-bold ${dif < 0 ? 'dif-negative' : dif > 0 ? 'dif-positive' : ''}`}>
                    {dif}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Kafe */}
      <div className="print-section coffee-section">
        <h3>Kafe - Turni {turnName}</h3>
        <table>
          <thead>
            <tr>
              <th>Lloji</th>
              <th>Sasia</th>
            </tr>
          </thead>
          <tbody>
            {coffeeTypes.map((coffee) => {
              const quantity = turnData.coffee[coffee] || 0;
              return (
                <tr key={coffee}>
                  <td>{coffee}</td>
                  <td className="text-center">{quantity}</td>
                </tr>
              );
            })}
            <tr className="total-row">
              <td className="font-bold">Total Kafe</td>
              <td className="text-center font-bold">{totalCoffee}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Xhiro */}
      <div className="print-section xhiro-section">
        <h3>Xhiro Turni {turnName}</h3>
        <div className="xhiro-value">
          {turnData.xhiro.toLocaleString()} ALL
        </div>
      </div>

      {/* Print Footer */}
      <div className="print-footer">
        <p>Printuar më: {new Date().toLocaleDateString('sq-AL')} në {new Date().toLocaleTimeString('sq-AL')}</p>
      </div>
    </div>
  );
};
