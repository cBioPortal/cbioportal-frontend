import * as React from "react";
import { useCallback, useRef, useEffect, useState, useMemo } from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import { Table, Tag, Space, Button, Typography, message, Collapse, Input } from "antd";
import { DeleteOutlined, SaveOutlined, UpOutlined, DownOutlined, SearchOutlined, HistoryOutlined } from "@ant-design/icons";
import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";
import { AxisBottom } from "@visx/axis";
import { useTooltip, TooltipWithBounds, defaultStyles } from "@visx/tooltip";
import { METHOD_COLORS, getMethodColor, formatBytes, formatShape } from "../constants";
import type { ProfileEntry, RenderLink } from "../types";

const { Text } = Typography;

const BAR_HEIGHT = 18;
const BAR_GAP = 3;
const MARGIN = { top: 10, right: 16, bottom: 30, left: 16 };
const WATERFALL_MAX_VISIBLE = 60;

const COLLAPSED_HEIGHT = 40;
const EXPANDED_HEIGHT = 360;

const tooltipStyles = {
  ...defaultStyles,
  fontSize: 12,
  padding: "6px 10px",
};

interface ProfileCollector {
  entries: ProfileEntry[];
  version: number;
  subscribe: (cb: () => void) => () => void;
  clear: () => void;
  toJSON: () => ProfileEntry[];
}

interface ProfileBarProps {
  profiler?: ProfileCollector;
  onSave?: (entries: ProfileEntry[]) => void;
  renderLink?: RenderLink;
}

function WaterfallTimeline({ entries, width }: { entries: ProfileEntry[]; width: number }) {
  const { showTooltip, hideTooltip, tooltipOpen, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip<ProfileEntry>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <div style={{ padding: "16px 0", textAlign: "center", color: "#999" }}>
        <Text type="secondary">No queries recorded yet. Interact with the viewer to see profiling data.</Text>
      </div>
    );
  }

  const innerWidth = width - MARGIN.left - MARGIN.right;
  const svgHeight = entries.length * (BAR_HEIGHT + BAR_GAP) + MARGIN.top + MARGIN.bottom;

  const t0 = entries.length > 0 ? entries[0].startTime : 0;
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
          maxHeight: WATERFALL_MAX_VISIBLE * (BAR_HEIGHT + BAR_GAP) + MARGIN.top + MARGIN.bottom,
          overflowY: "auto",
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
                <g key={entry.id}>
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
                      fontSize={10}
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
              numTicks={5}
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
          {tooltipData.chunks && (
            <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
              <div>Shape: {formatShape(tooltipData.chunks.arrayShape)}</div>
              <div>Chunks: {formatShape(tooltipData.chunks.chunkShape)}</div>
              <div>dtype: {tooltipData.chunks.dtype}</div>
              {tooltipData.chunks.sharded && (
                <Tag color="purple" style={{ margin: 0, marginTop: 2 }}>SHARDED</Tag>
              )}
            </div>
          )}
          {tooltipData.fetches && (
            <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
              {tooltipData.fetches.requests} req · {formatBytes(tooltipData.fetches.bytes)}
            </div>
          )}
          <div>
            {tooltipData.aborted ? (
              <Tag color="orange" style={{ margin: 0, marginTop: 2 }}>ABORTED</Tag>
            ) : (
              <Tag
                color={tooltipData.cacheHit ? "green" : "red"}
                style={{ margin: 0, marginTop: 2 }}
              >
                {tooltipData.cacheHit ? "CACHE HIT" : "CACHE MISS"}
              </Tag>
            )}
          </div>
        </TooltipWithBounds>
      )}

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 12px", padding: "8px 0 0", fontSize: 11 }}>
        {Object.entries(METHOD_COLORS).map(([method, color]) => (
          <span key={method} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: "inline-block" }} />
            {method}
          </span>
        ))}
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, border: "1.5px solid #999", display: "inline-block" }} />
          cache hit (outline)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, border: "1.5px dashed #999", display: "inline-block" }} />
          aborted (dashed)
        </span>
      </div>
    </div>
  );
}

function keySearchFilter() {
  return {
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: {
      setSelectedKeys: (keys: React.Key[]) => void;
      selectedKeys: React.Key[];
      confirm: () => void;
      clearFilters?: () => void;
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder="Search key…"
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ width: 200, marginBottom: 8, display: "block" }}
          size="small"
        />
        <Space>
          <Button type="primary" onClick={() => confirm()} icon={<SearchOutlined />} size="small" style={{ width: 90 }}>
            Search
          </Button>
          <Button onClick={() => { clearFilters?.(); confirm(); }} size="small" style={{ width: 90 }}>
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />,
    onFilter: (value: unknown, record: ProfileEntry) => {
      const v = String(value).toLowerCase();
      return record.key.toLowerCase().includes(v) || (record.label?.toLowerCase().includes(v) ?? false);
    },
  };
}

function buildTableColumns(entries: ProfileEntry[]) {
  const methods = [...new Set(entries.map((e) => e.method))].sort();
  return [
    { title: "#", dataIndex: "id", key: "id", width: 50 },
    {
      title: "Method",
      dataIndex: "method",
      key: "method",
      width: 120,
      filters: methods.map((m) => ({ text: m, value: m })),
      onFilter: (value: unknown, record: ProfileEntry) => record.method === value,
    },
    {
      title: "Key",
      dataIndex: "key",
      key: "key",
      ellipsis: true,
      ...keySearchFilter(),
      render: (key: string, record: ProfileEntry) =>
        record.label ? (
          <span>
            {key} <Text type="secondary" style={{ fontSize: 11 }}>({record.label})</Text>
          </span>
        ) : (
          key
        ),
    },
    {
      title: "Status",
      key: "status",
      width: 90,
      filters: [
        { text: "HIT", value: "hit" },
        { text: "MISS", value: "miss" },
        { text: "ABORTED", value: "aborted" },
      ],
      onFilter: (value: unknown, record: ProfileEntry) => {
        if (value === "aborted") return !!record.aborted;
        if (value === "hit") return record.cacheHit && !record.aborted;
        return !record.cacheHit && !record.aborted;
      },
      render: (_: unknown, record: ProfileEntry) => {
        if (record.aborted) return <Tag color="orange">ABORTED</Tag>;
        return <Tag color={record.cacheHit ? "green" : "red"}>{record.cacheHit ? "HIT" : "MISS"}</Tag>;
      },
    },
    {
      title: "Chunks",
      key: "chunks",
      width: 140,
      render: (_: unknown, r: ProfileEntry) =>
        r.chunks ? (
          <span style={{ fontSize: 11 }}>
            {formatShape(r.chunks.chunkShape)}
            {r.chunks.sharded && <Tag color="purple" style={{ marginLeft: 4 }}>S</Tag>}
          </span>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Requests",
      key: "requests",
      width: 80,
      render: (_: unknown, r: ProfileEntry) => r.fetches?.requests ?? <Text type="secondary">-</Text>,
      sorter: (a: ProfileEntry, b: ProfileEntry) => (a.fetches?.requests ?? 0) - (b.fetches?.requests ?? 0),
    },
    {
      title: "Bytes",
      key: "bytes",
      width: 90,
      render: (_: unknown, r: ProfileEntry) => r.fetches ? formatBytes(r.fetches.bytes) : <Text type="secondary">-</Text>,
      sorter: (a: ProfileEntry, b: ProfileEntry) => (a.fetches?.bytes ?? 0) - (b.fetches?.bytes ?? 0),
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      width: 100,
      render: (ms: number) => `${ms.toFixed(1)} ms`,
      sorter: (a: ProfileEntry, b: ProfileEntry) => a.duration - b.duration,
    },
  ];
}

const pulseStyle = `
@keyframes czl-pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.3); }
  100% { opacity: 0; transform: scale(1); }
}
`;

export default function ProfileBar({ profiler, onSave, renderLink }: ProfileBarProps) {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [barWidth, setBarWidth] = useState(0);

  const subscribe = useCallback(
    (cb: () => void) => (profiler ? profiler.subscribe(cb) : () => {}),
    [profiler],
  );
  const getSnapshot = useCallback(
    () => (profiler ? profiler.version : 0),
    [profiler],
  );

  const version = useSyncExternalStore(subscribe, getSnapshot);
  const entries = profiler?.entries ?? [];

  // Activity pulse
  const [pulseVisible, setPulseVisible] = useState(false);
  const prevVersionRef = useRef(version);
  useEffect(() => {
    if (version !== prevVersionRef.current && version > 0) {
      setPulseVisible(true);
      const timer = setTimeout(() => setPulseVisible(false), 1000);
      prevVersionRef.current = version;
      return () => clearTimeout(timer);
    }
    prevVersionRef.current = version;
    return undefined;
  }, [version]);

  // Measure container width for responsive waterfall
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setBarWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const totalTime = entries.reduce((sum, e) => sum + e.duration, 0);
  const cacheHits = entries.filter((e) => e.cacheHit).length;
  const hitRate = entries.length > 0 ? ((cacheHits / entries.length) * 100).toFixed(0) : 0;
  const totalBytes = entries.reduce((sum, e) => sum + (e.fetches?.bytes ?? 0), 0);

  const handleClear = () => profiler?.clear();

  const handleSave = () => {
    if (!profiler || entries.length === 0) return;
    onSave?.(profiler.toJSON());
    message.success("Profile session saved to history");
  };

  const dataSource = useMemo(() => [...entries].reverse(), [entries, version]);
  const columns = useMemo(() => buildTableColumns(entries), [entries, version]);

  const currentHeight = expanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;
  const waterfallWidth = Math.max(barWidth - 48, 200);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: currentHeight,
        zIndex: 1000,
        background: "#fff",
        borderTop: "1px solid #e8e8e8",
        boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.08)",
        transition: "height 0.2s ease",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <style>{pulseStyle}</style>

      {/* Summary strip — always visible, clickable to toggle */}
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: COLLAPSED_HEIGHT,
          minHeight: COLLAPSED_HEIGHT,
          padding: "0 16px",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <Space size="middle">
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
            {pulseVisible && (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#52c41a",
                  display: "inline-block",
                  animation: "czl-pulse 1s ease-out forwards",
                }}
              />
            )}
            Query Profiler
          </span>
          <Text type="secondary">Queries: {entries.length}</Text>
          <Text type="secondary">Hit: {hitRate}%</Text>
          <Text type="secondary">{totalTime.toFixed(0)} ms</Text>
          {totalBytes > 0 && <Text type="secondary">{formatBytes(totalBytes)}</Text>}
        </Space>

        <Space>
          {renderLink?.(
            <span
              onClick={(e) => e.stopPropagation()}
              style={{ display: "inline-flex", alignItems: "center" }}
            >
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                <HistoryOutlined style={{ marginRight: 4 }} />
                History
              </Typography.Text>
            </span>
          )}
          <Button
            icon={<SaveOutlined />}
            size="small"
            onClick={(e) => { e.stopPropagation(); handleSave(); }}
            disabled={entries.length === 0}
          >
            Save
          </Button>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={(e) => { e.stopPropagation(); handleClear(); }}
            disabled={entries.length === 0}
          >
            Clear
          </Button>
          {expanded ? <DownOutlined /> : <UpOutlined />}
        </Space>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ flex: 1, overflow: "auto", padding: "0 16px 12px" }}>
          <WaterfallTimeline entries={entries} width={waterfallWidth} />

          <Collapse ghost style={{ marginTop: 12 }}>
            <Collapse.Panel
              key="log"
              header={<Text type="secondary" style={{ fontSize: 12 }}>Query log table</Text>}
            >
              <Table
                size="small"
                pagination={{ defaultPageSize: 50, showSizeChanger: true }}
                dataSource={dataSource}
                columns={columns}
                rowKey="id"
              />
            </Collapse.Panel>
          </Collapse>
        </div>
      )}
    </div>
  );
}

/** Height of the collapsed profile bar, for use as bottom padding on content. */
export const PROFILE_BAR_HEIGHT = COLLAPSED_HEIGHT;
