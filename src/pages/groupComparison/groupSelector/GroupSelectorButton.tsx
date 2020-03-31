import * as React from 'react';
import { observer } from 'mobx-react';
import classNames from 'classnames';
import styles from '../styles.module.scss';
import {
    caseCountsInParens,
    ComparisonGroup,
    getPatientIdentifiers,
    getSampleIdentifiers,
    MissingSamplesMessage,
} from '../GroupComparisonUtils';
import ErrorIcon from '../../../shared/components/ErrorIcon';
import ComplexKeyMap from '../../../shared/lib/complexKeyDataStructures/ComplexKeyMap';
import { Sample } from '../../../shared/api/generated/CBioPortalAPI';
import { SortableElement } from 'react-sortable-hoc';
import { getTextColor, renderGroupNameWithOrdinal } from '../OverlapUtils';
import { TOOLTIP_MOUSE_ENTER_DELAY_MS } from 'cbioportal-frontend-commons';
import * as ReactDOM from 'react-dom';
import { Popover, Overlay } from 'react-bootstrap';
import classnames from 'classnames';
import { action, observable } from 'mobx';
import autobind from 'autobind-decorator';
import { ButtonHTMLAttributes } from 'react';

export interface IGroupSelectorButtonProps {
    onClick: (name: string) => void;
    onClickDelete: (name: string) => void;
    deletable: boolean;
    isSelected: (name: string) => boolean;
    group: ComparisonGroup;
    sampleSet: ComplexKeyMap<Sample>;
    excludedFromAnalysis: boolean;
}

@observer
class GroupSelectorButton extends React.Component<
    IGroupSelectorButtonProps,
    {}
> {
    @observable hovered = false;
    @observable.ref button: HTMLButtonElement | null;
    private hoverTimeout: any = null;

    @autobind
    @action
    private buttonRef(button: HTMLButtonElement | null) {
        this.button = button;
    }

    @autobind
    @action
    private onMouseClick() {
        this.hovered = false;
    }

    @autobind
    @action
    private onMouseEnter() {
        this.hoverTimeout = setTimeout(() => {
            this.hovered = true;
        }, TOOLTIP_MOUSE_ENTER_DELAY_MS);
    }

    @autobind
    @action
    private onMouseLeave() {
        this.hovered = false;
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = null;
    }

    @autobind
    @action
    private onMouseDown() {
        this.hovered = false;
    }

    render() {
        const group = this.props.group;
        const selected = this.props.isSelected(group.name);
        const sampleIdentifiers = getSampleIdentifiers([group]);
        const patientIdentifiers = getPatientIdentifiers(
            sampleIdentifiers,
            this.props.sampleSet
        );

        const button = (
            <button
                ref={this.buttonRef}
                className={classNames('btn btn-xs', {
                    [styles.buttonUnselected]: !selected,
                    [styles.buttonExcludedFromAnalysis]: this.props
                        .excludedFromAnalysis,
                })}
                onClick={this.onMouseClick}
                onMouseEnter={this.onMouseEnter}
                onMouseLeave={this.onMouseLeave}
                onMouseDown={this.onMouseDown}
                style={{
                    backgroundColor: group.color,
                }}
                data-test={`groupSelectorButton${group.name}`}
            >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                        style={{ display: 'flex', alignItems: 'center' }}
                        onClick={() => this.props.onClick(group.name)}
                    >
                        <div
                            className="text-with-ellipsis"
                            style={{
                                display: 'inline-block',
                                color: getTextColor(group.color),
                                maxWidth: 200,
                            }}
                        >
                            {renderGroupNameWithOrdinal(group)}
                        </div>
                        &nbsp;
                        <span style={{ color: getTextColor(group.color) }}>
                            (
                            {sampleIdentifiers.length ===
                            patientIdentifiers.length
                                ? sampleIdentifiers.length
                                : `${sampleIdentifiers.length}/${patientIdentifiers.length}`}
                            )
                        </span>
                    </div>
                    {group.nonExistentSamples.length > 0 && (
                        <ErrorIcon
                            style={{ marginLeft: 7 }}
                            tooltip={
                                <MissingSamplesMessage
                                    samples={group.nonExistentSamples}
                                />
                            }
                        />
                    )}
                    {this.props.deletable && (
                        <div
                            style={{
                                paddingLeft: 2,
                                marginLeft: 5,
                                marginRight: -3,
                                borderLeft: '1px dashed white',
                                cursor: 'pointer',
                            }}
                            data-test="deleteButton"
                            onClick={() => this.props.onClickDelete(group.name)}
                        >
                            <i className="fa fa-times-circle" />
                        </div>
                    )}
                </span>
                {this.button &&
                    (ReactDOM as any).createPortal(
                        <Overlay
                            rootClose
                            placement="top"
                            show={this.hovered}
                            target={this.button}
                        >
                            <Popover
                                arrowOffsetTop={17}
                                className={classnames(
                                    'cbioportal-frontend',
                                    'cbioTooltip',
                                    styles.Tooltip
                                )}
                            >
                                <div>
                                    {renderGroupNameWithOrdinal(group)}&nbsp;
                                    {caseCountsInParens(
                                        sampleIdentifiers,
                                        patientIdentifiers
                                    )}
                                </div>
                                {this.props.excludedFromAnalysis && (
                                    <div
                                        style={{
                                            maxWidth: 300,
                                            whiteSpace: 'initial',
                                            marginTop: 5,
                                        }}
                                    >
                                        This group is a subset of the other
                                        selected groups, so it's excluded from
                                        analysis, and not considered in overlap
                                        calculations.
                                    </div>
                                )}
                            </Popover>
                        </Overlay>,
                        document.body
                    )}
            </button>
        );

        return button;
    }
}

export default SortableElement(GroupSelectorButton);
