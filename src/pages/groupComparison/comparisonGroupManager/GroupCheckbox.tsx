import * as React from 'react';
import { observer } from 'mobx-react';
import {
    caseCounts,
    getNumPatients,
    getNumSamples,
    MissingSamplesMessage,
    StudyViewComparisonGroup,
} from '../GroupComparisonUtils';
import { StudyViewPageStore } from '../../studyView/StudyViewPageStore';
import autobind from 'autobind-decorator';
import { computed, observable } from 'mobx';
import ErrorIcon from '../../../shared/components/ErrorIcon';
import styles from '../styles.module.scss';
import { CirclePicker } from 'react-color';
import { Popover, OverlayTrigger, Tooltip, Button } from 'react-bootstrap';
import { COLORS } from '../../studyView/StudyViewUtils';
import {
    CLI_YES_COLOR,
    CLI_NO_COLOR,
    CLI_FEMALE_COLOR,
    CLI_MALE_COLOR,
    DARK_GREY,
} from '../../../shared/lib/Colors';
import {
    DefaultTooltip,
    EllipsisTextTooltip,
} from 'cbioportal-frontend-commons';
import classnames from 'classnames';

export interface IGroupCheckboxProps {
    group: StudyViewComparisonGroup;
    store: StudyViewPageStore;
    markedForDeletion: boolean;
    markedWithWarningSign: boolean;
    studyIds: string[];
    restore: (group: StudyViewComparisonGroup) => void;
    delete: (group: StudyViewComparisonGroup) => void;
    shareGroup: (group: StudyViewComparisonGroup) => void;
    changeColor: (group: StudyViewComparisonGroup, color: string) => void;
}

interface IColorPickerIconProps {
    color: string;
}

export class ColorPickerIcon extends React.Component<
    IColorPickerIconProps,
    {}
> {
    constructor(props: IColorPickerIconProps) {
        super(props);
        this.render = this.render.bind(this);
    }

    public render() {
        const { color } = this.props;
        return (
            <svg
                width="12"
                height="12"
                className="case-label-header"
                data-test="color-picker-icon"
            >
                <rect
                    width="12"
                    height="12"
                    fill={color == undefined ? '#FFFFFF' : color}
                    stroke="#3786c2"
                    stroke-width="4"
                    cursor="pointer"
                />
                {color === '#FFFFFF' && (
                    <line
                        x1="10"
                        y1="2"
                        x2="2"
                        y2="10"
                        stroke="red"
                        stroke-width="1"
                    />
                )}
            </svg>
        );
    }
}

@observer
export default class GroupCheckbox extends React.Component<
    IGroupCheckboxProps,
    {}
> {
    state = {
        groupColor:
            this.props.group.color == undefined
                ? '#FFFFFF'
                : this.props.group.color,
    };

    @autobind
    private onCheckboxClick() {
        this.props.store.toggleComparisonGroupSelected(this.props.group.uid);
        this.props.store.checkSelectedGroupsColors(
            this.props.group.uid,
            this.props.group.color!
        );
    }

    @autobind
    private onRestoreClick() {
        this.props.restore(this.props.group);
    }

    @autobind
    private onDeleteClick() {
        this.props.delete(this.props.group);
    }

    @autobind
    private shareGroup() {
        this.props.shareGroup(this.props.group);
    }

    @autobind
    private onOverlayEnter() {
        this.props.store.groupColorChanged = true;
    }

    @autobind
    private onOverlayExit() {
        this.props.store.groupColorChanged = false;
    }

    @computed get label() {
        return (
            <span style={{ display: 'flex', alignItems: 'center' }}>
                <EllipsisTextTooltip text={this.props.group.name} />
                &nbsp;(
                {caseCounts(
                    getNumSamples(this.props.group),
                    getNumPatients(this.props.group)
                )}
                )
            </span>
        );
    }

    @computed get colorList() {
        let colors: string[] = COLORS.slice(0, 20);
        colors.push(CLI_YES_COLOR);
        colors.push(CLI_NO_COLOR);
        colors.push(CLI_FEMALE_COLOR);
        colors.push(DARK_GREY);
        return colors;
    }

    handleChangeComplete = (color: any, event: any) => {
        // if same color is select, unselect it (go back to no color)
        if (color.hex === this.props.group.color) {
            this.setState({ groupColor: '#FFFFFFF' });
            this.props.changeColor(this.props.group, undefined!);
            this.props.store.checkSelectedGroupsColors(
                this.props.group.uid,
                undefined!
            );
        } else {
            this.setState({ groupColor: color.hex });
            this.props.changeColor(this.props.group, color.hex);
            this.props.store.checkSelectedGroupsColors(
                this.props.group.uid,
                color.hex
            );
        }
    };

    render() {
        const popover = (
            <Popover
                id="popover-basic"
                onClick={e => {
                    e.stopPropagation();
                    e.preventDefault();
                }}
            >
                <div>
                    <CirclePicker
                        colors={this.colorList}
                        circleSize={20}
                        circleSpacing={3}
                        onChangeComplete={this.handleChangeComplete}
                        color={this.state.groupColor}
                        width="140px"
                    />
                </div>
            </Popover>
        );
        const group = this.props.group;
        let checkboxAndLabel;
        if (this.props.markedForDeletion) {
            checkboxAndLabel = (
                <span className={styles.markedForDeletion}>{this.label}</span>
            );
        } else {
            checkboxAndLabel = (
                <div
                    className={styles.groupItem}
                    style={{ display: 'flex', alignItems: 'center' }}
                >
                    <input
                        type="checkbox"
                        value={group.uid}
                        checked={this.props.store.isComparisonGroupSelected(
                            group.uid
                        )}
                        onClick={this.onCheckboxClick}
                    />
                    {this.label}
                </div>
            );
        }

        return (
            <div
                key={group.uid}
                className={classnames(styles.groupRow, {
                    [styles.sharedGroup]: this.props.group.isSharedGroup,
                })}
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: 4,
                    paddingTop: 4,
                    minHeight: '35px',
                }}
            >
                {checkboxAndLabel}

                <div className={styles.groupLineItemActionButtons}>
                    {!this.props.markedForDeletion && (
                        <>
                            <DefaultTooltip
                                overlay={
                                    'You have selected identical colors for compared groups.'
                                }
                            >
                                <span>
                                    {this.props.markedWithWarningSign && (
                                        <i
                                            className="fa fa-warning"
                                            style={{
                                                cursor: 'pointer',
                                                color: '#fad201',
                                                position: 'relative',
                                                top: '1px',
                                                right: '2px',
                                            }}
                                        />
                                    )}
                                </span>
                            </DefaultTooltip>
                            <OverlayTrigger
                                containerPadding={40}
                                trigger="click"
                                placement="bottom"
                                overlay={popover}
                                onEnter={this.onOverlayEnter}
                                onExit={this.onOverlayExit}
                            >
                                <DefaultTooltip
                                    overlay={
                                        'Select color for group used in group comparison'
                                    }
                                >
                                    <span
                                        style={{ marginTop: 2, marginRight: 2 }}
                                    >
                                        <ColorPickerIcon
                                            color={this.state.groupColor}
                                        />
                                    </span>
                                </DefaultTooltip>
                            </OverlayTrigger>

                            <DefaultTooltip overlay={'Delete Group'}>
                                <span onClick={this.onDeleteClick}>
                                    <i
                                        className="fa fa-md fa-trash"
                                        style={{
                                            cursor: 'pointer',
                                        }}
                                    />
                                </span>
                            </DefaultTooltip>
                            <span onClick={this.shareGroup}>
                                <i
                                    className="fa fa-share-alt"
                                    style={{
                                        cursor: 'pointer',
                                    }}
                                />
                            </span>
                        </>
                    )}
                    {this.props.group.nonExistentSamples.length > 0 && (
                        <ErrorIcon
                            tooltip={
                                <MissingSamplesMessage
                                    samples={
                                        this.props.group.nonExistentSamples
                                    }
                                />
                            }
                        />
                    )}
                    {this.props.markedForDeletion && (
                        <button
                            style={{ marginLeft: 10 }}
                            className="btn btn-xs btn-default"
                            onClick={this.onRestoreClick}
                        >
                            Restore
                        </button>
                    )}
                </div>
            </div>
        );
    }
}
