import * as React from "react";
import { useRef, useEffect } from "react";
import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";
import { AxisBottom } from "@visx/axis";
import { useTooltip, TooltipWithBounds, defaultStyles } from "@visx/tooltip";
import { METHOD_COLORS, getMethodColor, formatBytes, formatShape } from "../constants";
import type { ProfileEntry } from "../types";

const BAR_HEIGHT = 16;
const BAR_GAP = 2;
const MARGIN = { top: 10, right: 16, bottom: 30, left: 16 };
const MAX_VISIBLE_ROWS = 50;

const tooltipStyles = {
  ...defaultStyles,
  fontSize: 12,
  padding: "6px 10px",
};

interface Props {
  entries: ProfileEntry[];
  width?: number;
}

export default function SessionWaterfallChart({ entries, width = 800 }: Props) {
  const { showTooltip, hideTooltip, tooltipOpen, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip<ProfileEntry>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [entries]);

  if (!entries || entries.length === 0) return null;

  const innerWidth = width - MARGIN.left - MARGIN.right;
  const svgHeight = entries.length * (BAR_HEIGHT + BAR_GAP) + MARGIN.top + MARGIN.bottom;
  const maxScrollHeight = MAX_VISIBLE_ROWS * (BAR_HEIGHT + BAR_GAP) + MARGIN.top + MARGIN.bottom;

  const t0 = entries[0].startTime;
  const tMax = entries.reduce((max, e) => Math.max(max, e.startTime + e.duration - t0), 1);

  const xScale = scaleLinear({
    domain: [0, tMax],
    range: [0, innerWidth],
  });

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={scrollRef}
        style={{
          maxHeight: maxScrollHeight,
          overflowY: svgHeight > maxScrollHeight ? "auto" : "hidden",
          overflowX: "hidden",
        }}
      >
        <svg width={width} height={svgHeight}>
          <Group left={MARGIN.left} top={MARGIN.top}>
            {entries.map((entry, i) => {
              const x = xScale(entry.startTime - t0);
              const barWidth = Math.max(xScale(entry.duration) - xScale(0), 2);
              const y = i * (BAR_HEIGHT + BAR_GAP);
              const color = entry.aborted ? "#999" : getMethodColor(entry.method);

              return (
                <g key={entry.id ?? i}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={BAR_HEIGHT}
                    fill={entry.cacheHit ? "transparent" : color}
                    stroke={color}
                    strokeWidth={entry.cacheHit || entry.aborted ? 1.5 : 0}
                    strokeDasharray={entry.aborted ? "4 2" : undefined}
                    rx={2}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => {
                      const svg = e.currentTarget.ownerSVGElement!;
                      const point = svg.createSVGPoint();
                      point.x = e.clientX;
                      point.y = e.clientY;
                      const svgPoint = point.matrixTransform(svg.getScreenCTM()!.inverse());
                      showTooltip({
                        tooltipData: entry,
                        tooltipLeft: svgPoint.x,
                        tooltipTop: svgPoint.y - 10,
                      });
                    }}
                    onMouseLeave={hideTooltip}
                  />
                  {barWidth > 40 && (
                    <text
                      x={x + 4}
                      y={y + BAR_HEIGHT / 2}
                      fontSize={9}
                      fill={entry.cacheHit ? color : "#fff"}
                      dominantBaseline="central"
                      pointerEvents="none"
                    >
                      {entry.method}
                    </text>
                  )}
                </g>
              );
            })}
            <AxisBottom
              scale={xScale}
              top={entries.length * (BAR_HEIGHT + BAR_GAP)}
              numTicks={6}
              tickFormat={(v) => `${(v as number).toFixed(0)} ms`}
              tickLabelProps={() => ({ fontSize: 10, textAnchor: "middle" as const, fill: "#999" })}
              stroke="#ddd"
              tickStroke="#ddd"
            />
          </Group>
        </svg>
      </div>

      {tooltipOpen && tooltipData && (
        <TooltipWithBounds left={tooltipLeft} top={tooltipTop} style={tooltipStyles}>
          <div><strong>{tooltipData.method}</strong></div>
          <div style={{ fontSize: 11, color: "#666" }}>{tooltipData.key}</div>
          <div>{tooltipData.duration.toFixed(1)} ms</div>
          {tooltipData.fetches && (
            <div style={{ fontSize: 11, color: "#666" }}>
              {tooltipData.fetches.requests} req &middot; {formatBytes(tooltipData.fetches.bytes)}
            </div>
          )}
          {tooltipData.chunks && (
            <div style={{ fontSize: 11, color: "#666" }}>
              Chunks: {formatShape(tooltipData.chunks.chunkShape)}
              {tooltipData.chunks.sharded ? " (sharded)" : ""}
            </div>
          )}
          <div style={{ fontSize: 11, color: tooltipData.aborted ? "#fa8c16" : tooltipData.cacheHit ? "#52c41a" : "#ff4d4f" }}>
            {tooltipData.aborted ? "Aborted" : tooltipData.cacheHit ? "Cache hit" : "Cache miss"}
          </div>
        </TooltipWithBounds>
      )}

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", padding: "4px 0 0", fontSize: 11 }}>
        {Object.entries(METHOD_COLORS).map(([method, color]) => (
          <span key={method} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: "inline-block" }} />
            {method}
          </span>
        ))}
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, border: "1.5px solid #999", display: "inline-block" }} />
          cache hit
        </span>
      </div>
    </div>
  );
}
