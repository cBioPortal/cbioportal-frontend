import * as React from "react";
import { Group } from "@visx/group";
import { scaleLinear, scaleOrdinal } from "@visx/scale";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { useTooltip, TooltipWithBounds, defaultStyles } from "@visx/tooltip";
import { METHOD_COLORS, DEFAULT_METHOD_COLOR, formatBytes } from "../constants";
import type { ProfileEntry } from "../types";

const tooltipStyles = {
  ...defaultStyles,
  fontSize: 12,
  padding: "6px 10px",
};

interface Props {
  entries: ProfileEntry[];
  width?: number;
  height?: number;
}

export default function BytesVsDurationChart({ entries, width = 360, height = 240 }: Props) {
  const { showTooltip, hideTooltip, tooltipOpen, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip<ProfileEntry>();

  if (!entries || entries.length === 0) return null;

  // Filter to entries that have fetch data
  const data = entries.filter((e) => e.fetches && e.fetches.bytes > 0);
  if (data.length === 0) return null;

  const MARGIN = { top: 10, right: 20, bottom: 40, left: 60 };
  const xMax = width - MARGIN.left - MARGIN.right;
  const yMax = height - MARGIN.top - MARGIN.bottom;

  const xScale = scaleLinear({
    domain: [0, Math.max(...data.map((d) => d.fetches!.bytes))],
    range: [0, xMax],
    nice: true,
  });

  const yScale = scaleLinear({
    domain: [0, Math.max(...data.map((d) => d.duration))],
    range: [yMax, 0],
    nice: true,
  });

  const methods = [...new Set(data.map((d) => d.method))];
  const colorScale = scaleOrdinal({
    domain: methods,
    range: methods.map((m) => METHOD_COLORS[m] || DEFAULT_METHOD_COLOR),
  });

  return (
    <div style={{ position: "relative" }}>
      <svg width={width} height={height}>
        <Group left={MARGIN.left} top={MARGIN.top}>
          {data.map((d, i) => {
            const cx = xScale(d.fetches!.bytes);
            const cy = yScale(d.duration);
            const color = d.aborted ? "#999" : colorScale(d.method);
            return (
              <circle
                key={d.id ?? i}
                cx={cx}
                cy={cy}
                r={5}
                fill={d.cacheHit ? "transparent" : color}
                stroke={color}
                strokeWidth={d.cacheHit || d.aborted ? 1.5 : 0.5}
                strokeDasharray={d.aborted ? "3 2" : undefined}
                opacity={0.8}
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => {
                  const svg = e.currentTarget.ownerSVGElement!;
                  const point = svg.createSVGPoint();
                  point.x = e.clientX;
                  point.y = e.clientY;
                  const svgPoint = point.matrixTransform(svg.getScreenCTM()!.inverse());
                  showTooltip({
                    tooltipData: d,
                    tooltipLeft: svgPoint.x,
                    tooltipTop: svgPoint.y - 10,
                  });
                }}
                onMouseLeave={hideTooltip}
              />
            );
          })}
          <AxisBottom
            scale={xScale}
            top={yMax}
            numTicks={4}
            tickFormat={(v) => formatBytes(v as number)}
            tickLabelProps={() => ({ fontSize: 10, textAnchor: "middle" as const, fill: "#666" })}
          />
          <AxisLeft
            scale={yScale}
            numTicks={5}
            tickFormat={(v) => `${v} ms`}
            tickLabelProps={() => ({ fontSize: 10, textAnchor: "end" as const, fill: "#666", dx: -4 })}
          />
        </Group>
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", padding: "4px 0 0", fontSize: 11 }}>
        {methods.map((m) => (
          <span key={m} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: colorScale(m), display: "inline-block" }} />
            {m}
          </span>
        ))}
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid #999", display: "inline-block" }} />
          cache hit
        </span>
      </div>

      {tooltipOpen && tooltipData && (
        <TooltipWithBounds left={tooltipLeft} top={tooltipTop} style={tooltipStyles}>
          <div><strong>{tooltipData.method}</strong></div>
          <div style={{ fontSize: 11, color: "#666" }}>{tooltipData.key}</div>
          <div>{formatBytes(tooltipData.fetches!.bytes)} &middot; {tooltipData.duration.toFixed(1)} ms</div>
          <div style={{ fontSize: 11, color: tooltipData.aborted ? "#fa8c16" : tooltipData.cacheHit ? "#52c41a" : "#ff4d4f" }}>
            {tooltipData.aborted ? "Aborted" : tooltipData.cacheHit ? "Cache hit" : "Cache miss"}
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
}
