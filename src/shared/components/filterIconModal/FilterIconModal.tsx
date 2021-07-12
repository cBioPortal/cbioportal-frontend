import * as React from 'react';
import _ from 'lodash';
import { RootCloseWrapper } from 'react-overlays';
import { Dropdown } from 'react-bootstrap';
import { observer } from 'mobx-react';
import { action, observable, makeObservable } from 'mobx';
import { ICON_FILTER_OFF } from 'shared/lib/Colors';

export interface IFilterIconModalProps {
    id: string;
    filterIsActive: boolean;
    deactivateFilter: () => void;
    setupFilter: () => void;
    menuComponent?: JSX.Element;
}

class FilterIcon extends React.Component<any, {}> {
    render() {
        return (
            <span
                onClick={this.props.onClickFilter}
                style={{
                    color: this.props.isActive ? '#0000ff' : ICON_FILTER_OFF,
                    position: 'absolute',
                    top: '-1.37px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    visibility: 'hidden',
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
        const padding = 20;
        const rect = document
            .getElementById(this.props.id)!
            .getBoundingClientRect();

        let xOffset = 0;
        const width = window.innerWidth;
        if (rect.right > width) {
            xOffset = rect.right - width + padding;
        }

        let yOffset = 0;
        const height = window.innerHeight;
        if (rect.bottom > height) {
            yOffset = rect.bottom - height + padding;
        }

        window.scroll(window.scrollX + xOffset, window.scrollY + yOffset);
    }

    render() {
        return (
            <div
                id={this.props.id}
                className="dropdown-menu"
                style={{ transform: 'translateX(-5px)' }}
            >
                <div style={{ margin: '6px', marginBottom: '0px' }}>
                    {this.props.menuComponent}
                    <button
                        className="btn btn-default btn-xs"
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
            this.props.setupFilter();
        }
    }

    render() {
        return (
            <RootCloseWrapper onRootClose={this.hide}>
                <Dropdown id={this.props.id} open={this.isOpen}>
                    <FilterIcon
                        bsRole="toggle"
                        isActive={this.props.filterIsActive}
                        onClickFilter={this.onClickFilter}
                    />
                    <FilterMenu
                        bsRole="menu"
                        id={this.props.id + ' filterMenu'}
                        onClickRemove={this.onClickRemove}
                        menuComponent={this.props.menuComponent}
                    />
                </Dropdown>
            </RootCloseWrapper>
        );
    }
}
