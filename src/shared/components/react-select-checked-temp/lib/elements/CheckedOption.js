/**
 * Copyright (c) 2017 The Hyve B.V.
 * This code is licensed under the GNU General Public License,
 * version 3, or (at your option) any later version.
 */

import React from 'react';
import PropTypes from 'prop-types'
import classNames from 'classnames';

class CheckedOption extends React.Component {

    constructor(props, context) {
        super(props, context);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
    }

    blockEvent(event) {
        event.preventDefault();
        event.stopPropagation();
        if ((event.target.tagName !== 'A') || !('href' in event.target)) {
            return;
        }
        if (event.target.target) {
            window.open(event.target.href, event.target.target);
        } else {
            window.location.href = event.target.href;
        }
    }

    handleMouseDown(event) {
        event.preventDefault();
        event.stopPropagation();
        this.props.onSelect(this.props.option, event);
    }

    handleMouseEnter(event) {
        this.props.onFocus(this.props.option, event);
    }

    handleMouseMove(event) {
        if (this.props.isFocused) return;
        this.props.onFocus(this.props.option, event);
    }

    renderMarker(disabled) {
        const checkIconStyle = {
            width: '.7em',
            height: '.7em',
        };
        const uncheckedImg = 'data:image/png;base64,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';
        const checkedImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAMAAABrrFhUAAAAzFBMVEUAAABmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmbop8NfAAAAQ3RSTlMAAQIDBAUGBwgJCwwODxASExQVFhcaGxwdHiQmJyowOEZeYWlwc4iRmrS5vsDDxcfKzM7P1dna4uTo6e3v8fP19/n7iNWGAAAAA9hJREFUeNrt3Nd2E0EQhOGRLJIBkREmY3JOxoDBskS//ztxYYyTtNqdndDdVfUAc87330+HwHEcx3Ecx3Ecx3Ecx5ndmYsjZP7DDyLy+fEAlD98JfvbugzpH72Vg00niP53crjZBNsPWOCEH67AKT9YgQV+qAIL/UAFlvhhCiz1gxRo8EMUaPQDFFjhd19gpd95gRZ+1wVa+R0XaOl3W6C132mBDn6XBTr5HRbo6HdXoLPfWYEIv6sCUX5HBSL9bgpE+50U6OF3UaCX30GBnn7zBXr7jRdI4DddIInfcIFEfrMFkvmNFkjoN1kgqd9ggcR+cwWS+40VyOA3VSCL31CBTH4zBbL5jRTI6DdRIKtfZHYb2y+yewnbL/JtiO0XeQLul98DbL/IdXC/3AP3yw1w/+4A2y+b4P7tIbZ/Osb2z++A+zfop59++umnn3766aeffvrpp59++umnn3766aeffvobN7g6WQf2rz2disjXR6j+K9//Pfv6HKR/svf/4Z9jRP/syNM7Y2x/fAEv/tgCfvxxBTz5Ywr48ncv4M3ftYA/f7cCHv1dCvj0ty/g1d+2gF9/uwKe/W0K+PavLuDdv6qAf39zAQR/UwEM//ICKP5lBXD8iwsg+RcVwPKfLoDmP1kAz3+8AKL/aAFM/2EBVP9BAVz/fgFkv8jOGNsvsvMR219w9NNPP/30008//fTTH79b4P71X9j+8Abcfx/cH16A+8MWuD9Mwf3hE7g/PAf3h5vg/hBegvvD2hdsfwjnt7H9IVzYxvZbKJD7/7P2Avn/f+suUOL/u+YCZf7/6y1Q6v6B1gLl7j/oLFDy/oXGAmXvf+grUPr+ibYC5e+/6CpQ4/6NpgJ17v/oKVDr/pGWAvXuP+koUPP+lYYCde9/1S9Q+/5Z7QL177/VLaDh/l3NAjru/9UroOX+Ya0Ceu4/1img6f5ljQK67n+WL6Dt/mnpAvruv5YtoPH+bckCKu//Fiyg01+ugFZ/qQJ6/WUKaPaXKKDbn7+Adn/uAvr9eQtY8OcsYMOfr4AVf64Cdvx5Cljy5yhgy5++gDV/6gL2/GkLWPSnLGDTn66AVX+qAnb9aQpY9qcoYNvfv4B1f98C9v39Cnjw9yngwx9fwIs/toAff1wBT/6YAr783Qt483ct4M/frYBHf5cCPv3tC3j1ty3g19+ugGd/mwK+/asLePevKuDf31wAwd9UAMO/vACKf1kBHP/iAkj+RQWw/KcLoPlPFsDzHy+A6A/h7PsD/49rAXKDzbnIH5k/GwXUDe9uPNgYBo7jOI7jOI7jOI7jOI7TuL/OhrIas3WI7wAAAABJRU5ErkJggg==';
        const emptyImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN89/x5PQAIxAM9itiOzQAAAABJRU5ErkJggg==';
        const srcImg = this.props.isSelected ? checkedImg : (disabled ? emptyImg : uncheckedImg);
        return (<span><img style={checkIconStyle} src={srcImg}/>&nbsp;</span>);
    }

    render() {
        let {option, instancePrefix, optionIndex} = this.props;
        let className = classNames(this.props.className, option.className);

        return option.disabled ? (
            <div className={className}
                 onMouseDown={this.blockEvent}
                 onClick={this.blockEvent}>
                {this.renderMarker(option.disabled)}
                {this.props.option.label}
            </div>
        ) : (
            <div className={className}
                 style={option.style}
                 role="option"
                 onMouseDown={this.handleMouseDown}
                 onMouseEnter={this.handleMouseEnter}
                 onMouseMove={this.handleMouseMove}
                 id={instancePrefix + '-option-' + optionIndex}
                 title={this.props.option.title}>
                {this.renderMarker()}
                {this.props.option.label}
            </div>
        );
    }
}

CheckedOption.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    ignoreAccents: PropTypes.bool,
    ignoreCase: PropTypes.bool,
    isDisabled: PropTypes.bool,
    isFocused: PropTypes.bool,
    isSelected: PropTypes.bool,
    matchPos: PropTypes.string,
    matchProp: PropTypes.string,
    onFocus: PropTypes.func,
    onSelect: PropTypes.func,
    option: PropTypes.object.isRequired,
    valueKey: PropTypes.string,
};

export default CheckedOption;
