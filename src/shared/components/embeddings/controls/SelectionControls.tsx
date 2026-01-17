import * as React from 'react';

export interface SelectionControlsProps {
    selectionMode: 'none' | 'rectangle';
    onSelectionModeChange: (mode: 'none' | 'rectangle') => void;
}

export const SelectionControls: React.FC<SelectionControlsProps> = ({
    selectionMode,
    onSelectionModeChange,
}) => {
    return (
        <div
            style={{
                display: 'flex',
                gap: '2px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '2px',
            }}
        >
            <button
                onClick={() => onSelectionModeChange('none')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                    fontSize: '11px',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    backgroundColor:
                        selectionMode === 'none' ? '#007bff' : 'transparent',
                    color: selectionMode === 'none' ? 'white' : '#333',
                    transition: 'all 0.2s ease',
                }}
            >
                <i
                    className="fa-regular fa-hand"
                    style={{ marginRight: '4px', fontSize: '11px' }}
                ></i>
                Pan
            </button>
            <button
                onClick={() => onSelectionModeChange('rectangle')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                    fontSize: '11px',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    backgroundColor:
                        selectionMode === 'rectangle'
                            ? '#007bff'
                            : 'transparent',
                    color: selectionMode === 'rectangle' ? 'white' : '#333',
                    transition: 'all 0.2s ease',
                }}
            >
                <span style={{ marginRight: '4px', fontSize: '12px' }}>⬚</span>
                Select
            </button>
        </div>
    );
};
