import * as React from 'react';
import _ from 'lodash';
import { RootCloseWrapper } from 'react-overlays';
import { Dropdown } from 'react-bootstrap';
import { observer } from 'mobx-react';
import { action, observable, makeObservable } from 'mobx';
import { ICON_FILTER_OFF, ICON_FILTER_ON } from 'shared/lib/Colors';

export interface IFilterIconModalProps {
    id: string;
    filterIsActive: boolean;
    deactivateFilter: () => void;
    activateFilter: () => void;
    sliderComponent?: JSX.Element;
}

class FilterIcon extends React.Component<any, {}> {
    render() {
        return (
            <span
                onClick={this.props.onClickFilter}
                style={{
                    color: this.props.isActive
                        ? ICON_FILTER_ON
                        : ICON_FILTER_OFF,
                    fontSize: '24px',
                    cursor: 'pointer',
                }}
            >
                <i className="fa fa-filter"></i>
            </span>
        );
    }
}

class FilterMenu extends React.Component<any, {}> {
    // auto-scroll to make menu visible (if not already)
    componentDidUpdate() {
        const rect = document
            .getElementById(this.props.id)!
            .getBoundingClientRect();
        const height =
            window.innerHeight || document.documentElement.clientHeight;
        const width = window.innerWidth || document.documentElement.clientWidth;
        const isFullyVisible =
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= height &&
            rect.right <= width;

        if (!isFullyVisible) {
            const xOffset = rect.right - width + 20;
            const yOffset = rect.top < 0 ? rect.top : 0;
            window.scroll(window.scrollX + xOffset, window.scrollY + yOffset);
        }
    }

    render() {
        return (
            <div id={this.props.id} className="dropdown-menu">
                <div style={{ margin: '6px', marginBottom: '0px' }}>
                    {this.props.sliderComponent}
                    <button
                        onClick={this.props.onClickRemove}
                        style={{ marginTop: '10px', float: 'right' }}
                    >
                        Remove
                    </button>
                </div>
            </div>
        );
    }
}

@observer
export default class FilterIconModal extends React.Component<
    IFilterIconModalProps,
    {}
> {
    @observable private isOpen: boolean = false;

    constructor(props: IFilterIconModalProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    private hide() {
        this.isOpen = false;
    }

    @action.bound
    private onClickRemove() {
        this.isOpen = false;
        this.props.deactivateFilter();
    }

    @action.bound
    private onClickFilter() {
        this.isOpen = !this.isOpen;
        if (!this.props.filterIsActive) {
            this.props.activateFilter();
        }
    }

    render() {
        return (
            <RootCloseWrapper onRootClose={this.hide}>
                <Dropdown
                    id={this.props.id}
                    open={this.isOpen}
                    className="dropup"
                >
                    <FilterIcon
                        bsRole="toggle"
                        isActive={this.props.filterIsActive}
                        onClickFilter={this.onClickFilter}
                    />
                    <FilterMenu
                        bsRole="menu"
                        id={this.props.id + ' filterMenu'}
                        onClickRemove={this.onClickRemove}
                        sliderComponent={this.props.sliderComponent}
                    />
                </Dropdown>
            </RootCloseWrapper>
        );
    }
}
