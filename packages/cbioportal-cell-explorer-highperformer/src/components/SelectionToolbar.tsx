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
                top: 48,
                left: 12,
                zIndex: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
            }}
        >
            <Space direction="vertical" size="small">
                <Tooltip title="Pan & Zoom (Esc)" placement="right">
                    <Button
                        icon={<DragOutlined />}
                        type={selectionTool === 'pan' ? 'primary' : 'default'}
                        onClick={() => setSelectionTool('pan')}
                    />
                </Tooltip>
                <Tooltip title="Rectangle select" placement="right">
                    <Button
                        icon={<GatewayOutlined />}
                        type={
                            selectionTool === 'rectangle'
                                ? 'primary'
                                : 'default'
                        }
                        onClick={() => setSelectionTool('rectangle')}
                    />
                </Tooltip>
                <Tooltip title="Lasso select" placement="right">
                    <Button
                        icon={<EditOutlined />}
                        type={selectionTool === 'lasso' ? 'primary' : 'default'}
                        onClick={() => setSelectionTool('lasso')}
                    />
                </Tooltip>
            </Space>

            {hasSelection && (
                <Space direction="vertical" size="small">
                    <Tooltip
                        title={
                            selectionDisplayMode === 'dim'
                                ? 'Hide unselected'
                                : 'Dim unselected'
                        }
                        placement="right"
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
                        />
                    </Tooltip>
                    <Tooltip title="Clear all selections" placement="right">
                        <Button
                            icon={<ClearOutlined />}
                            onClick={clearAllSelections}
                        />
                    </Tooltip>
                </Space>
            )}

            {!summaryPanelOpen && (
                <Tooltip title="Show summary panel" placement="right">
                    <Button
                        icon={<BarChartOutlined />}
                        size="small"
                        onClick={() => setSummaryPanelOpen(true)}
                    />
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
                        marginTop: 4,
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
