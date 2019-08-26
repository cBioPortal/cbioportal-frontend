/**
 * Copyright (c) 2017 The Hyve B.V.
 * This code is licensed under the GNU General Public License,
 * version 3, or (at your option) any later version.
 */


import React from 'react';
import PropTypes from 'prop-types'

class OptionTools extends React.Component {

    constructor(props, context) {
        super(props, context);
        this.addAll = this. addAll.bind(this);
        this.clearAll = this. clearAll.bind(this);
    }

    addAll(event) {
        event.preventDefault();
        event.stopPropagation();
        this.props.onAddAll();
    }

    clearAll(event) {
        event.preventDefault();
        event.stopPropagation();
        this.props.onClearAll();
    }

    render () {
        const optionToolsStyles = {
            fontColor: 'inherit',
            textAlign:'center',
            padding: '.5em',
            borderBottom: '1px solid #ccc'
        };
        const toolButtonStyle = {
            borderRadius: '0.3em',
            fontColor: 'inherit',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            padding: '0.5em',
            textAlign: 'center',
            textDecoration: 'none',
            fontSize: 'smaller',
            cursor: 'pointer',
            marginLeft: '0.3em',
        };
        return (
            <div style={optionToolsStyles}>
                <button onClick={this.addAll} style={toolButtonStyle}>
                    {this.props.addAllTitle} ({this.props.filteredOptions})
                </button>
                <button onClick={this.clearAll} style={toolButtonStyle}>{this.props.clearAllTitle}</button>
            </div>
        );
    }
}

OptionTools.propTypes = {
    filteredOptions: PropTypes.number,
    onAddAll: PropTypes.func,
    onClearAll: PropTypes.func,
    addAllTitle: PropTypes.string,
    clearAllTitle: PropTypes.string,
};

export default OptionTools;
