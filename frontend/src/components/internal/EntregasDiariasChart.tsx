import { useMemo, useState } from "react";
import type { EntregaPorDia } from "../../lib/internal-api";

interface Props {
  data?: EntregaPorDia[];
}

const CHART = {
  width: 720,
  height: 280,
  pad: { top: 16, right: 48, bottom: 40, left: 44 },
};

function formatDayLabel(fecha: string): string {
  const [, month, day] = fecha.split("-");
  return `${Number(day)}/${month}`;
}

function formatDayLong(fecha: string): string {
  const date = new Date(`${fecha}T12:00:00`);
  return date.toLocaleDateString("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function niceMax(value: number): number {
  if (value <= 0) return 5;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function buildTicks(max: number, count = 4): number[] {
  const ceiling = niceMax(max);
  const step = ceiling / count;
  return Array.from({ length: count + 1 }, (_, index) => Math.round(step * index));
}

export default function EntregasDiariasChart({ data = [] }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    if (!data.length) return null;

    const maxDaily = Math.max(...data.map((point) => point.cantidad), 1);
    const maxCumulative = Math.max(...data.map((point) => point.acumulado), 1);
    const dailyTicks = buildTicks(maxDaily);
    const cumulativeTicks = buildTicks(maxCumulative);
    const dailyMax = dailyTicks[dailyTicks.length - 1] || 1;
    const cumulativeMax = cumulativeTicks[cumulativeTicks.length - 1] || 1;

    const plotWidth = CHART.width - CHART.pad.left - CHART.pad.right;
    const plotHeight = CHART.height - CHART.pad.top - CHART.pad.bottom;
    const barGap = plotWidth / data.length;
    const barWidth = Math.max(4, Math.min(28, barGap * 0.62));

    const bars = data.map((point, index) => {
      const x = CHART.pad.left + barGap * index + barGap / 2;
      const height = (point.cantidad / dailyMax) * plotHeight;
      const y = CHART.pad.top + plotHeight - height;
      return { ...point, index, x, y, height, barWidth };
    });

    const linePoints = data.map((point, index) => {
      const x = CHART.pad.left + barGap * index + barGap / 2;
      const y = CHART.pad.top + plotHeight - (point.acumulado / cumulativeMax) * plotHeight;
      return { x, y };
    });

    const labelStep = Math.max(1, Math.ceil(data.length / 8));

    return {
      bars,
      linePoints,
      dailyTicks,
      cumulativeTicks,
      dailyMax,
      cumulativeMax,
      plotHeight,
      labelStep,
      barGap,
    };
  }, [data]);

  if (!chartData) {
    return (
      <div className="internal-chart-card">
        <p className="internal-muted">Aún no hay entregas registradas.</p>
      </div>
    );
  }

  const {
    bars,
    linePoints,
    dailyTicks,
    cumulativeTicks,
    dailyMax,
    cumulativeMax,
    plotHeight,
    labelStep,
    barGap,
  } = chartData;

  const linePath = linePoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const hovered = hoveredIndex !== null ? bars[hoveredIndex] : null;

  return (
    <div className="internal-chart-card">
      <div className="internal-chart-card__header">
        <div>
          <h2 className="internal-chart-card__title">Avance del concurso</h2>
          <p className="internal-chart-card__subtitle">
            Entregas recibidas día a día y total acumulado.
          </p>
        </div>
        <div className="internal-chart-legend" aria-hidden="true">
          <span className="internal-chart-legend__item">
            <span className="internal-chart-legend__swatch internal-chart-legend__swatch--bar" />
            Entregas del día
          </span>
          <span className="internal-chart-legend__item">
            <span className="internal-chart-legend__swatch internal-chart-legend__swatch--line" />
            Total acumulado
          </span>
        </div>
      </div>

      <div className="internal-chart-wrap">
        {hovered && (
          <div
            className="internal-chart-tooltip"
            style={{
              left: `${(hovered.x / CHART.width) * 100}%`,
            }}
          >
            <p className="internal-chart-tooltip__date">{formatDayLong(hovered.fecha)}</p>
            <p>
              <strong>{hovered.cantidad}</strong> entrega{hovered.cantidad === 1 ? "" : "s"}
            </p>
            <p className="internal-chart-tooltip__muted">
              Acumulado: <strong>{hovered.acumulado}</strong>
            </p>
          </div>
        )}

        <svg
          viewBox={`0 0 ${CHART.width} ${CHART.height}`}
          className="internal-chart"
          role="img"
          aria-label="Gráfico de entregas diarias y total acumulado del concurso"
        >
          {dailyTicks.map((tick) => {
            const y = CHART.pad.top + plotHeight - (tick / dailyMax) * plotHeight;
            return (
              <g key={`daily-${tick}`}>
                <line
                  x1={CHART.pad.left}
                  x2={CHART.width - CHART.pad.right}
                  y1={y}
                  y2={y}
                  className="internal-chart__grid"
                />
                <text x={CHART.pad.left - 8} y={y + 4} className="internal-chart__axis-label">
                  {tick}
                </text>
              </g>
            );
          })}

          {cumulativeTicks.map((tick) => {
            const y = CHART.pad.top + plotHeight - (tick / cumulativeMax) * plotHeight;
            return (
              <text
                key={`cum-${tick}`}
                x={CHART.width - CHART.pad.right + 8}
                y={y + 4}
                className="internal-chart__axis-label internal-chart__axis-label--right"
              >
                {tick}
              </text>
            );
          })}

          {bars.map((bar) => (
            <rect
              key={bar.fecha}
              x={bar.x - bar.barWidth / 2}
              y={bar.y}
              width={bar.barWidth}
              height={bar.height}
              rx={4}
              className={`internal-chart__bar${hoveredIndex === bar.index ? " internal-chart__bar--active" : ""}`}
              onMouseEnter={() => setHoveredIndex(bar.index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(bar.index)}
              onBlur={() => setHoveredIndex(null)}
              tabIndex={0}
              aria-label={`${formatDayLong(bar.fecha)}: ${bar.cantidad} entregas, ${bar.acumulado} acumuladas`}
            />
          ))}

          <path d={linePath} className="internal-chart__line" fill="none" />

          {linePoints.map((point, index) => (
            <circle
              key={data[index].fecha}
              cx={point.x}
              cy={point.y}
              r={hoveredIndex === index ? 5 : 3.5}
              className={`internal-chart__dot${hoveredIndex === index ? " internal-chart__dot--active" : ""}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}

          {data.map((point, index) => {
            if (index % labelStep !== 0 && index !== data.length - 1) return null;
            const x = CHART.pad.left + barGap * index + barGap / 2;
            return (
              <text
                key={`label-${point.fecha}`}
                x={x}
                y={CHART.height - 12}
                className="internal-chart__axis-label internal-chart__axis-label--x"
              >
                {formatDayLabel(point.fecha)}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
