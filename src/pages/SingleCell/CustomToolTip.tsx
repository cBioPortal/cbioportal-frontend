import React from 'react';

const CustomToolTip: React.FC = () => {
    return (
        <div
            style={{
                backgroundColor: 'white',
                padding: '10px',
                border: '1px solid black',
            }}
        >
            <p>Type of Cell: Suraj</p>
            <p>Percentage: 100%</p> {/* Assuming 100% percentage */}
        </div>
    );
};

export default CustomToolTip;
