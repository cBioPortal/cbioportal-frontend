import * as React from 'react';
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import { observer, Observer } from "mobx-react";
import GroupComparisonStore from './GroupComparisonStore';
import { computed, observable } from 'mobx';
import Venn from './OverlapVenn';
import _ from "lodash";
import OverlapStackedBar from './OverlapStackedBar';
import autobind from 'autobind-decorator';
import DownloadControls from 'shared/components/downloadControls/DownloadControls';

export interface IOverlapProps {
    store: GroupComparisonStore
}

const SVG_ID = "comparison-tab-overlap-svg";

enum PlotType {
    StackedBar,
    Venn
}

@observer
export default class Overlap extends React.Component<IOverlapProps, {}> {

    constructor(props: IOverlapProps, context: any) {
        super(props, context);
    }
    @observable plotExists = false;

    @computed get isStackedBar() {
        return this.props.store.sampleGroups.isComplete && this.props.store.sampleGroups.result.length > 3 ? true : false
    }

    componentDidUpdate() {
        this.plotExists = !!this.getSvg();
    }

    @autobind
    private getSvg() {
        return document.getElementById(SVG_ID) as SVGElement | null;
    }

    @computed get plotType() {
        return this.props.store.sampleGroups.isComplete && this.props.store.sampleGroups.result.length > 3 ? PlotType.StackedBar : PlotType.Venn
    }

    @computed get plot() {
        let plotElt: any = null;
        switch (this.plotType) {
            case PlotType.StackedBar:
                plotElt = (
                    <OverlapStackedBar
                        svgId={SVG_ID}
                        sampleGroupsCombinationSets={this.props.store.sampleGroupsCombinationSets.result!}
                        patientGroupsCombinationSets={this.props.store.patientGroupsCombinationSets.result!}
                        categoryToColor={this.props.store.categoryToColor}
                    />)
                break;
            case PlotType.Venn:
                plotElt = (
                    <Venn
                        svgId={SVG_ID}
                        sampleGroupsCombinationSets={this.props.store.sampleGroupsCombinationSets.result!}
                        patientGroupsCombinationSets={this.props.store.patientGroupsCombinationSets.result!}
                        categoryToColor={this.props.store.categoryToColor}
                    />)
                break;
            default:
                return <span>Not implemented yet</span>
        }

        return (
            <div>
                <div data-test="ComparisonTabOverlapDiv" className="borderedChart posRelative">
                    {this.plotExists && (
                        <DownloadControls
                            getSvg={this.getSvg}
                            filename={'overlap'}
                            dontFade={true}
                            style={{ position: 'absolute', right: 10, top: 10 }}
                            collapse={true}
                        />
                    )}
                    <div style={{ position: "relative", display: "inline-block" }}>
                        {plotElt}
                    </div>
                </div>
            </div>
        );
    }


    public render() {
        if (this.props.store.sampleGroupsCombinationSets.isPending ||
            this.props.store.patientGroupsCombinationSets.isPending) {
            return <LoadingIndicator isLoading={true} size={"big"} center={true} />;
        }
        return (
            <div className="inlineBlock">
                {this.plot}
            </div>
        )
    }
}
