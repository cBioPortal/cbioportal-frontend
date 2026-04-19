import * as React from 'react';
import { Button, Space, Tooltip } from 'antd';
import {
    DragOutlined,
    GatewayOutlined,
    EditOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    BarChartOutlined,
    ClearOutlined,
    CloseOutlined,
} from '@ant-design/icons';
import useAppStore, { CUSTOM_GROUP_ID } from '../store/useAppStore';
import type { SelectionTool } from '../store/useAppStore';

const TOOL_OPTIONS: {
    value: SelectionTool;
    label: string;
    icon: React.ReactNode;
    tooltip: string;
}[] = [
    {
        value: 'pan',
        label: 'Pan',
        icon: <DragOutlined />,
        tooltip: 'Pan & zoom (Esc)',
    },
    {
        value: 'rectangle',
        label: 'Rectangle',
        icon: <GatewayOutlined />,
        tooltip: 'Rectangle select',
    },
    {
        value: 'lasso',
        label: 'Lasso',
        icon: <EditOutlined />,
        tooltip: 'Lasso select',
    },
];

function useCustomGroupCount() {
    return useAppStore(s => s.customGroupCommittedCount);
}

export default function SelectionToolbar() {
    const selectionTool = useAppStore(s => s.selectionTool);
    const setSelectionTool = useAppStore(s => s.setSelectionTool);
    const selectionDisplayMode = useAppStore(s => s.selectionDisplayMode);
    const setSelectionDisplayMode = useAppStore(s => s.setSelectionDisplayMode);
    const selectionGroups = useAppStore(s => s.selectionGroups);
    const clearGroup = useAppStore(s => s.clearGroup);
    const clearAllSelections = useAppStore(s => s.clearAllSelections);
    const customGroupCount = useCustomGroupCount();
    const summaryPanelOpen = useAppStore(s => s.summaryPanelOpen);
    const setSummaryPanelOpen = useAppStore(s => s.setSummaryPanelOpen);

    const hasSelection = selectionGroups.length > 0;

    return (
        <div
            style={{
                position: 'absolute',
                top: 12,
                left: 12,
                zIndex: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 8,
            }}
        >
            <Space.Compact size="small">
                {TOOL_OPTIONS.map(opt => (
                    <Tooltip
                        key={opt.value}
                        title={opt.tooltip}
                        placement="bottom"
                    >
                        <Button
                            type={
                                selectionTool === opt.value
                                    ? 'primary'
                                    : 'default'
                            }
                            icon={opt.icon}
                            onClick={() => setSelectionTool(opt.value)}
                        >
                            {opt.label}
                        </Button>
                    </Tooltip>
                ))}
            </Space.Compact>

            {hasSelection && (
                <Space.Compact size="small">
                    <Tooltip
                        title={
                            selectionDisplayMode === 'dim'
                                ? 'Hide unselected'
                                : 'Dim unselected'
                        }
                        placement="bottom"
                    >
                        <Button
                            icon={
                                selectionDisplayMode === 'dim' ? (
                                    <EyeOutlined />
                                ) : (
                                    <EyeInvisibleOutlined />
                                )
                            }
                            onClick={() =>
                                setSelectionDisplayMode(
                                    selectionDisplayMode === 'dim'
                                        ? 'hide'
                                        : 'dim'
                                )
                            }
                        >
                            {selectionDisplayMode === 'dim' ? 'Hide' : 'Dim'}
                        </Button>
                    </Tooltip>
                    <Tooltip title="Clear all selections" placement="bottom">
                        <Button
                            icon={<ClearOutlined />}
                            onClick={clearAllSelections}
                        >
                            Clear
                        </Button>
                    </Tooltip>
                </Space.Compact>
            )}

            {!summaryPanelOpen && (
                <Tooltip title="Show summary panel" placement="bottom">
                    <Button
                        size="small"
                        icon={<BarChartOutlined />}
                        onClick={() => setSummaryPanelOpen(true)}
                    >
                        Summary
                    </Button>
                </Tooltip>
            )}

            {/* Per-group chips */}
            {selectionGroups.length > 0 && (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: 2,
                    }}
                >
                    {selectionGroups.map(group => (
                        <div
                            key={group.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: `rgba(${group.color[0]}, ${group.color[1]}, ${group.color[2]}, 0.15)`,
                                border: `1px solid rgba(${group.color[0]}, ${group.color[1]}, ${group.color[2]}, 0.4)`,
                                fontSize: 11,
                                color: '#333',
                            }}
                        >
                            <div
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: `rgb(${group.color[0]}, ${group.color[1]}, ${group.color[2]})`,
                                }}
                            />
                            <span>
                                {group.id === CUSTOM_GROUP_ID
                                    ? (() => {
                                          const {
                                              customGroupEnabledIds,
                                              customGroupIndexMap,
                                              customGroupColumn,
                                          } = useAppStore.getState();
                                          return `Custom${
                                              customGroupColumn
                                                  ? ` (${customGroupColumn})`
                                                  : ''
                                          }: ${customGroupEnabledIds.size}/${
                                              Object.keys(customGroupIndexMap)
                                                  .length
                                          }`;
                                      })()
                                    : `Group ${group.id}`}
                            </span>
                            <span style={{ fontSize: 10, color: '#999' }}>
                                {(() => {
                                    const count =
                                        group.id === CUSTOM_GROUP_ID
                                            ? customGroupCount
                                            : group.indices.length;
                                    return count > 0
                                        ? `(${count.toLocaleString()})`
                                        : '...';
                                })()}
                            </span>
                            <CloseOutlined
                                style={{
                                    fontSize: 9,
                                    cursor: 'pointer',
                                    color: '#999',
                                }}
                                onClick={() => clearGroup(group.id)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
