import * as React from 'react';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { action, computed, makeObservable, observable } from 'mobx';
import styles from '../styles.module.scss';
import { CirclePicker, CirclePickerProps } from 'react-color';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { ColorPickerIcon } from 'pages/groupComparison/comparisonGroupManager/ColorPickerIcon';
import {
    CLI_FEMALE_COLOR,
    CLI_NO_COLOR,
    CLI_YES_COLOR,
    DARK_GREY,
} from 'shared/lib/Colors';
import { COLORS } from 'pages/studyView/StudyViewUtils';
import { ResultsViewPageStore } from 'pages/resultsView/ResultsViewPageStore';
import {
    IOncoprintControlsHandlers,
    IOncoprintControlsState,
} from './OncoprintControls';
import { RGBAColor } from 'oncoprintjs';

export interface IGroupCheckboxProps {
    alteration: string;
    store?: ResultsViewPageStore;
    handlers: IOncoprintControlsHandlers;
    state: IOncoprintControlsState;
    setRules?: (alteration: string, color: RGBAColor | undefined) => void;
    color?: string;
    markedWithWarningSign: boolean;
}

const COLOR_UNDEFINED = '#FFFFFF';

const alterationToLabel: { [alteration: string]: string } = {
    missense: 'Missense Mutation (unknown significance)',
    missense_rec: 'Missense Mutation (putative driver)',
    trunc: 'Truncating Mutation (unknown significance)',
    trunc_rec: 'Truncating Mutation (putative driver)',
    inframe: 'Inframe Mutation (unknown significance)',
    inframe_rec: 'Inframe Mutation (putative driver)',
    splice: 'Splice Mutation (unknown significance)',
    splice_rec: 'Splice Mutation (putative driver)',
    promoter: 'Promoter Mutation (unknown significance)',
    promoter_rec: 'Promoter Mutation (putative driver)',
    other: 'Other Mutation (unknown significance)',
    other_rec: 'Other Mutation (putative driver)',
};

@observer
export default class OncoprintColors extends React.Component<
    IGroupCheckboxProps,
    {}
> {
    constructor(props: IGroupCheckboxProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    handleChangeComplete = (color: any, event: any) => {
        // if same color is select, unselect it (go back to no color)
        if (color.hex === this.props.color) {
            this.props.store?.onAlterationColorChange(
                this.props.alteration,
                undefined
            );
            this.props.setRules &&
                this.props.setRules(this.props.alteration, undefined);
            this.props.store!.flagDuplicateColorsForAlterations(
                this.props.alteration,
                undefined
            );
        } else {
            this.props.store?.onAlterationColorChange(
                this.props.alteration,
                color.hex
            );
            this.props.setRules &&
                this.props.setRules(this.props.alteration, [
                    color.rgb.r,
                    color.rgb.g,
                    color.rgb.b,
                    color.rgb.a,
                ]);
            this.props.store!.flagDuplicateColorsForAlterations(
                this.props.alteration,
                color.hex
            );
        }
        this.props.handlers.onSelectTest &&
            this.props.handlers.onSelectTest(!this.props.state.test!);
        this.props.handlers.onSetRule &&
            this.props.handlers.onSetRule(this.props.state.rule!);
    };

    @computed get colorList() {
        let colors: string[] = COLORS.slice(0, 20);
        colors.push(CLI_YES_COLOR);
        colors.push(CLI_NO_COLOR);
        colors.push(CLI_FEMALE_COLOR);
        colors.push(DARK_GREY);
        return colors;
    }

    buildColorChooserWidget = () => (
        <Popover>
            <div
                onMouseDown={e => {
                    e.nativeEvent.stopImmediatePropagation();
                }}
                onClick={e => {
                    e.nativeEvent.stopImmediatePropagation();
                }}
            >
                <CirclePicker
                    colors={this.colorList}
                    circleSize={20}
                    circleSpacing={3}
                    onChangeComplete={this.handleChangeComplete}
                    color={this.props.color}
                    width="140px"
                />
            </div>
        </Popover>
    );

    render() {
        return (
            <div>
                {alterationToLabel[this.props.alteration]}
                <DefaultTooltip
                    overlay={
                        'You have selected identical colors for some alterations.'
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
                    overlay={this.buildColorChooserWidget()}
                    rootClose={true}
                >
                    <DefaultTooltip
                        overlay={
                            'Optional: Select color for alteration to be used in oncoprint. If no color is selected, the default color will be applied.'
                        }
                    >
                        <span
                            style={{
                                // marginTop: 2,
                                // marginRight: 2,
                                float: 'right',
                            }}
                        >
                            <ColorPickerIcon
                                color={this.props.color || COLOR_UNDEFINED}
                            />
                        </span>
                    </DefaultTooltip>
                </OverlayTrigger>
            </div>
        );
    }
}
