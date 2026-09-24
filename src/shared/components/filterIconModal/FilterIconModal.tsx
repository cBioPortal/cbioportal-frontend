import * as React from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import RootCloseWrapper from 'react-overlays/lib/RootCloseWrapper';
import { Dropdown } from 'react-bootstrap';
import { observer } from 'mobx-react';
import { action, observable, makeObservable } from 'mobx';
import { ICON_FILTER_OFF } from 'shared/lib/Colors';
import './styles.scss';

export interface IFilterIconModalProps {
    id: string;
    label?: string;
    filterIsActive: boolean;
    deactivateFilter: () => void;
    setupFilter: () => void;
    menuComponent?: JSX.Element;
}

class FilterIcon extends React.Component<any, {}> {
    render() {
        return (
            <button
                type="button"
                className="filterIconModalToggle"
                aria-label={`Filter ${this.props.label || this.props.id}`}
                aria-expanded={this.props.isOpen}
                onClick={this.props.onClickFilter}
                style={{
                    color: this.props.isActive ? '#0000ff' : ICON_FILTER_OFF,
                }}
            >
                <i className="fa fa-filter"></i>
            </button>
        );
    }
}

class FilterMenu extends React.Component<any, {}> {
    @observable private pullRight: boolean = false;
    private menu = React.createRef<HTMLDivElement>();

    componentDidUpdate() {
        if (!this.props.isOpen || !this.menu.current) return;
        const rect = this.menu.current.getBoundingClientRect();

        if (rect.right > window.innerWidth) {
            this.pullRight = true;
        }

        let yOffset = 0;
        const height = window.innerHeight;
        if (rect.bottom > height) {
            yOffset = rect.bottom - height + 15;
        }
        window.scroll(window.scrollX, window.scrollY + yOffset);
    }

    render() {
        return (
            <div
                ref={this.menu}
                className={classNames(
                    'dropdown-menu',
                    this.pullRight ? 'pull-right' : 'pull-left'
                )}
                style={{
                    transform: this.pullRight
                        ? 'translateX(10px)'
                        : 'translateX(-5px)',
                    visibility: this.props.isOpen ? 'visible' : 'hidden',
                }}
            >
                <div style={{ margin: '6px', marginBottom: '0px' }}>
                    {this.props.label || this.props.id}

                    <div style={{ marginTop: '10px' }}>
                        {this.props.menuComponent}
                    </div>

                    <button
                        className="btn btn-default btn-xs"
                        onClick={this.props.onClickRemove}
                        disabled={!this.props.isActive}
                        style={{ marginTop: '10px', float: 'right' }}
                    >
                        Remove filter
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
                <Dropdown
                    id={this.props.id + ' filterIconModal'}
                    open={this.isOpen}
                    className={classNames('filterIconModal', {
                        'is-active': this.props.filterIsActive,
                        'is-open': this.isOpen,
                    })}
                >
                    <FilterIcon
                        bsRole="toggle"
                        id={this.props.id}
                        label={this.props.label}
                        isOpen={this.isOpen}
                        isActive={this.props.filterIsActive}
                        onClickFilter={this.onClickFilter}
                    />
                    <FilterMenu
                        bsRole="menu"
                        id={this.props.id}
                        label={this.props.label}
                        isOpen={this.isOpen}
                        isActive={this.props.filterIsActive}
                        onClickRemove={this.onClickRemove}
                        menuComponent={this.props.menuComponent}
                    />
                </Dropdown>
            </RootCloseWrapper>
        );
    }
}
