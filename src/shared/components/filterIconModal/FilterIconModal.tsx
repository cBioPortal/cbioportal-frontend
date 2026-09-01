import * as React from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import RootCloseWrapper from 'react-overlays/lib/RootCloseWrapper';
import { Dropdown } from 'react-bootstrap';
import { observer } from 'mobx-react';
import { action, observable, makeObservable } from 'mobx';
import { ICON_FILTER_OFF } from 'shared/lib/Colors';

// Sticky table headers sit at z-index 10 and each one is its own stacking context, so an open
// menu is painted under the header cells that follow it. The menu cannot climb out of its own
// ancestor's context, so the containing cell is what has to be raised while the menu is open.
const OPEN_MENU_HEADER_Z_INDEX = '100';

export interface IFilterIconModalProps {
    id: string;
    label?: string;
    filterIsActive: boolean;
    deactivateFilter: () => void;
    setupFilter: () => void;
    menuComponent?: JSX.Element;
    // Position the open menu against the viewport instead of its `.dropdown`
    // parent. An absolutely positioned menu is clipped by any ancestor that
    // establishes a scroll container, which is what a horizontally scrollable
    // table is; a fixed one is laid out against the viewport and escapes it.
    escapeScrollContainer?: boolean;
}

class FilterIcon extends React.Component<any, {}> {
    render() {
        return (
            <span
                onClick={this.props.onClickFilter}
                className={classNames('headerFilterIcon', {
                    active: this.props.isActive,
                    open: this.props.isOpen,
                })}
                style={{
                    color: this.props.isActive ? '#0000ff' : ICON_FILTER_OFF,
                    display: 'inline-block',
                    cursor: 'pointer',
                    marginLeft: 5,
                    marginTop: -1,
                }}
            >
                <i className="fa fa-filter"></i>
            </span>
        );
    }
}

@observer
class FilterMenu extends React.Component<any, {}> {
    @observable private pullRight: boolean = false;
    @observable.ref private viewportStyle: React.CSSProperties | undefined;
    private stackingContextHost: HTMLElement | null = null;
    private hostZIndexBeforeOpen: string | null = null;

    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    componentDidMount() {
        if (this.props.escapeScrollContainer) {
            window.addEventListener('scroll', this.reposition, true);
            window.addEventListener('resize', this.reposition);
        }
    }

    componentWillUnmount() {
        if (this.props.escapeScrollContainer) {
            window.removeEventListener('scroll', this.reposition, true);
            window.removeEventListener('resize', this.reposition);
            this.restoreStackingContext();
        }
    }

    componentDidUpdate() {
        const element = document.getElementById(this.props.id);
        if (!element) {
            return;
        }

        if (this.props.escapeScrollContainer) {
            this.reposition();
            this.syncStackingContext();
            return;
        }

        const rect = element.getBoundingClientRect();

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

    // Anchor the menu under the filter icon in viewport coordinates, flipping it
    // left and clamping it upward so it stays on screen.
    @action.bound
    private reposition() {
        const element = document.getElementById(this.props.id);
        const anchor = element?.parentElement;
        if (!this.props.isOpen || !element || !anchor) {
            return;
        }

        const anchorRect = anchor.getBoundingClientRect();
        const width = element.offsetWidth;
        const height = element.offsetHeight;
        const overflowsRight =
            anchorRect.left + width > window.innerWidth &&
            width < anchorRect.right;

        const next: React.CSSProperties = {
            position: 'fixed',
            top: Math.max(
                0,
                Math.min(anchorRect.bottom, window.innerHeight - height)
            ),
            left: overflowsRight ? undefined : anchorRect.left,
            right: overflowsRight
                ? Math.max(0, window.innerWidth - anchorRect.right)
                : undefined,
        };

        if (!_.isEqual(next, this.viewportStyle)) {
            this.viewportStyle = next;
        }
    }

    // Lift the header cell holding this menu above its siblings while the menu is open, then put
    // its z-index back exactly as it was.
    private syncStackingContext() {
        if (this.props.isOpen) {
            const host = document.getElementById(this.props.id)?.closest('th');
            if (!host || host === this.stackingContextHost) {
                return;
            }
            this.restoreStackingContext();
            this.stackingContextHost = host as HTMLElement;
            this.hostZIndexBeforeOpen = this.stackingContextHost.style.zIndex;
            this.stackingContextHost.style.zIndex = OPEN_MENU_HEADER_Z_INDEX;
        } else {
            this.restoreStackingContext();
        }
    }

    private restoreStackingContext() {
        if (this.stackingContextHost) {
            this.stackingContextHost.style.zIndex =
                this.hostZIndexBeforeOpen || '';
            this.stackingContextHost = null;
            this.hostZIndexBeforeOpen = null;
        }
    }

    render() {
        return (
            <div
                id={this.props.id}
                className={classNames(
                    'dropdown-menu',
                    this.pullRight ? 'pull-right' : 'pull-left'
                )}
                style={{
                    transform: this.props.escapeScrollContainer
                        ? undefined
                        : this.pullRight
                        ? 'translateX(10px)'
                        : 'translateX(-5px)',
                    visibility: this.props.isOpen ? 'visible' : 'hidden',
                    ...(this.props.escapeScrollContainer
                        ? this.viewportStyle
                        : {}),
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
                >
                    <FilterIcon
                        bsRole="toggle"
                        isActive={this.props.filterIsActive}
                        isOpen={this.isOpen}
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
                        escapeScrollContainer={this.props.escapeScrollContainer}
                    />
                </Dropdown>
            </RootCloseWrapper>
        );
    }
}
