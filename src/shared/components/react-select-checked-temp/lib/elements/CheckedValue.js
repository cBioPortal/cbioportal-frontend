/**
 * Copyright (c) 2017 The Hyve B.V.
 * This code is licensed under the GNU General Public License,
 * version 3, or (at your option) any later version.
 */

import React from 'react';

class CheckedValue extends React.Component {
    render() {
        // extract context passed down by the valueRenderer callback
        const { valueIndex, shouldShowPlaceholder, placeholder } = this.props.children[0];
        // render the first value as the placeholder would have appeared,
        // display nothing for subsequent values
        return (valueIndex === 0 && shouldShowPlaceholder
            ? <div className="Select-placeholder">{placeholder}</div>
            : null
        );
    }
}
export default CheckedValue;
