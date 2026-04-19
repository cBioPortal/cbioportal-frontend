import * as React from 'react';
import { useState } from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import useAppStore from '../store/useAppStore';

const MAX_LIST_HEIGHT = 150;

export default function CategoricalLegend() {
    const categoryMap = useAppStore(s => s.categoryMap);
    const highlightedCategories = useAppStore(s => s.highlightedCategories);
    const toggleCategoryHighlight = useAppStore(s => s.toggleCategoryHighlight);
    const clearCategoryHighlights = useAppStore(s => s.clearCategoryHighlights);
    const [search, setSearch] = useState('');

    if (categoryMap.length === 0) return null;

    const filtered = search
        ? categoryMap
              .map((entry, index) => ({ ...entry, index }))
              .filter(({ label }) =>
                  label.toLowerCase().includes(search.toLowerCase())
              )
        : categoryMap.map((entry, index) => ({ ...entry, index }));

    const isAnyHighlighted = highlightedCategories.size > 0;

    return (
        <div style={{ marginTop: 8 }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                }}
            >
                <div
                    style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#888',
                        textTransform: 'uppercase',
                    }}
                >
                    Legend{' '}
                    {isAnyHighlighted && (
                        <span
                            style={{ fontWeight: 400, textTransform: 'none' }}
                        >
                            ({highlightedCategories.size} highlighted)
                        </span>
                    )}
                </div>
                {isAnyHighlighted && (
                    <span
                        style={{
                            fontSize: 11,
                            color: '#1677ff',
                            cursor: 'pointer',
                        }}
                        onClick={clearCategoryHighlights}
                    >
                        Clear
                    </span>
                )}
            </div>

            {/* Search input */}
            {categoryMap.length > 10 && (
                <Input
                    size="small"
                    placeholder="Filter categories..."
                    prefix={<SearchOutlined style={{ color: '#bbb' }} />}
                    allowClear
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ marginBottom: 4 }}
                />
            )}

            {/* Always-visible scrollable list */}
            <div
                style={{
                    maxHeight: MAX_LIST_HEIGHT,
                    overflowY: 'auto',
                    border: '1px solid #f0f0f0',
                    borderRadius: 4,
                }}
            >
                {filtered.map(({ label, color, index }) => {
                    const isHighlighted = highlightedCategories.has(index);
                    return (
                        <div
                            key={index}
                            onClick={() => toggleCategoryHighlight(index)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 8px',
                                fontSize: 12,
                                cursor: 'pointer',
                                opacity:
                                    isAnyHighlighted && !isHighlighted
                                        ? 0.4
                                        : 1,
                                fontWeight: isHighlighted ? 600 : 400,
                                backgroundColor: isHighlighted
                                    ? '#f0f5ff'
                                    : 'transparent',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = isHighlighted
                                    ? '#e0ecff'
                                    : '#fafafa';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = isHighlighted
                                    ? '#f0f5ff'
                                    : 'transparent';
                            }}
                        >
                            <span
                                style={{
                                    display: 'inline-block',
                                    width: 10,
                                    height: 10,
                                    backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
                                    borderRadius: 2,
                                    flexShrink: 0,
                                }}
                            />
                            <span
                                style={{
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    flex: 1,
                                }}
                            >
                                {label}
                            </span>
                        </div>
                    );
                })}
                {filtered.length === 0 && (
                    <div
                        style={{
                            padding: '8px',
                            fontSize: 12,
                            color: '#999',
                            textAlign: 'center',
                        }}
                    >
                        No matches
                    </div>
                )}
            </div>
        </div>
    );
}
