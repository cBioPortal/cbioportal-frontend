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
    rgbaToHex,
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
    type: string;
    store?: ResultsViewPageStore;
    handlers: IOncoprintControlsHandlers;
    state: IOncoprintControlsState;
    setRule?: (
        alteration: string,
        type: string,
        color: RGBAColor | undefined
    ) => void;
    color: RGBAColor;
    markedWithWarningSign: boolean;
}

const COLOR_UNDEFINED = '#FFFFFF';

export const alterationToTypeToLabel: {
    [alteration: string]: { [type: string]: string };
} = {
    // disp_cna
    disp_cna: {
        'amp_rec,amp': 'Amplification',
        'gain_rec,gain': 'Gain',
        'hetloss_rec,hetloss': 'Shallow Deletion',
        'homdel_rec,homdel': 'Deep Deletion',
    },
    // disp_germ
    disp_germ: {
        true: 'Germline Mutation',
    },
    // disp_mrna
    disp_mrna: {
        high: 'mRNA High',
        low: 'mRNA Low',
    },
    // disp_mut
    disp_mut: {
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
    },
    // disp_prot
    disp_prot: {
        high: 'Protein High',
        low: 'Protein Low',
    },
    // disp_structuralVariant
    disp_structuralVariant: {
        sv: 'Structural Variant (unknown significance)',
        sv_rec: 'Structural Variant (putative driver)',
    },
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
        if (color.hex === rgbaToHex(this.props.color)) {
            this.props.setRule &&
                this.props.setRule(
                    this.props.alteration,
                    this.props.type,
                    undefined
                );
        } else {
            this.props.setRule &&
                this.props.setRule(this.props.alteration, this.props.type, [
                    color.rgb.r,
                    color.rgb.g,
                    color.rgb.b,
                    color.rgb.a,
                ]);
        }
        this.props.handlers.onChangeRule &&
            this.props.handlers.onChangeRule(!this.props.state.changeRule!);
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
                    color={rgbaToHex(this.props.color)}
                    width="140px"
                />
            </div>
        </Popover>
    );

    render() {
        return (
            <div>
                {
                    alterationToTypeToLabel[this.props.alteration][
                        this.props.type
                    ]
                }
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
                                float: 'right',
                            }}
                        >
                            <ColorPickerIcon
                                color={
                                    rgbaToHex(this.props.color) ||
                                    COLOR_UNDEFINED
                                }
                            />
                        </span>
                    </DefaultTooltip>
                </OverlayTrigger>
            </div>
        );
    }
}
