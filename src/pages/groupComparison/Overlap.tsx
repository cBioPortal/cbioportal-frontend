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
import {MakeMobxView} from "../../shared/components/MobxView";
import Loader from "../../shared/components/loadingIndicator/LoadingIndicator";
import ErrorMessage from "../../shared/components/ErrorMessage";
import {
    ENRICHMENTS_NOT_2_GROUPS_MSG,
    getCombinations,
    getSampleIdentifiers,
    OVERLAP_NOT_ENOUGH_GROUPS_MSG
} from "./GroupComparisonUtils";
import {remoteData} from "../../shared/api/remoteData";
import UpSet from './UpSet';

export interface IOverlapProps {
    store: GroupComparisonStore
}

const SVG_ID = "comparison-tab-overlap-svg";

enum PlotType {
    Upset,
    Venn
}

@observer
export default class Overlap extends React.Component<IOverlapProps, {}> {

    constructor(props: IOverlapProps, context: any) {
        super(props, context);
    }
    @observable plotExists = false;

    @computed get sampleGroups() {
        return this.props.store.activeGroups;
    }

    componentDidUpdate() {
        this.plotExists = !!this.getSvg();
    }

    readonly tabUI = MakeMobxView({
        await:()=>{
            if (this.props.store.activeGroups.isComplete &&
                this.props.store.activeGroups.result.length < 2) {
                // dont bother loading data for and computing overlap if not enough groups for it
                return [this.props.store.activeGroups];
            } else {
                return [this.props.store.activeGroups, this.overlapUI];
            }
        },
        render:()=>{
            if (this.props.store.activeGroups.result!.length < 2) {
                return <span>{OVERLAP_NOT_ENOUGH_GROUPS_MSG}</span>;
            } else {
                return this.overlapUI.component;
            }
        },
        renderPending:()=><Loader isLoading={true} centerRelativeToContainer={true} size={"big"}/>,
        renderError:()=><ErrorMessage/>
    });

    @autobind
    private getSvg() {
        return document.getElementById(SVG_ID) as SVGElement | null;
    }

    readonly plotType = remoteData({
        await:()=>[this.sampleGroups],
        invoke:async()=>(this.sampleGroups.result!.length > 3 ? PlotType.Upset : PlotType.Venn)
    });

    public readonly sampleGroupsWithCases = remoteData({
        await: () => [
            this.props.store.activeGroups,
            this.props.store.sampleSet,
        ],
        invoke: () => {
            const sampleSet = this.props.store.sampleSet.result!;
            const groupsWithSamples = _.map(this.props.store.activeGroups.result, group => {
                let samples = getSampleIdentifiers([group]).map(sampleIdentifier => sampleSet.get({studyId: sampleIdentifier.studyId, sampleId: sampleIdentifier.sampleId}));
                return {
                    uid: group.uid,
                    cases: _.map(samples, sample => sample!.uniqueSampleKey)
                }
            });
            return Promise.resolve(groupsWithSamples);
        }
    }, []);

    public readonly patientGroupsWithCases = remoteData({
        await: () => [
            this.props.store.activeGroups,
            this.props.store.sampleSet,
        ],
        invoke: () => {
            const sampleSet = this.props.store.sampleSet.result!;
            const groupsWithPatients = _.map(this.props.store.activeGroups.result, group => {
                let samples = getSampleIdentifiers([group]).map(sampleIdentifier => sampleSet.get({studyId: sampleIdentifier.studyId, sampleId: sampleIdentifier.sampleId}));
                return {
                    uid: group.uid,
                    cases: _.uniq(_.map(samples, sample => sample!.uniquePatientKey))
                }
            });
            return Promise.resolve(groupsWithPatients);
        }
    }, []);

    readonly plot = MakeMobxView({
        await:()=>[
            this.plotType,
            this.sampleGroupsWithCases,
            this.patientGroupsWithCases,
            this.props.store.uidToGroup
        ],
        render:()=>{
            let plotElt: any = null;
            switch (this.plotType.result!) {
                case PlotType.Upset: {
                    plotElt = (
                        <UpSet
                            groups={this.sampleGroupsWithCases.result!}
                            title="Sample Sets Intersection"
                            svgId={SVG_ID}
                            uidToGroup={this.props.store.uidToGroup.result!}
                            caseType="sample"
                        />)
                    break;
                }
                case PlotType.Venn:
                    plotElt = (
                        <Venn
                            svgId={SVG_ID}
                            sampleGroups={this.sampleGroupsWithCases.result!}
                            patientGroups={this.patientGroupsWithCases.result!}
                            uidToGroup={this.props.store.uidToGroup.result!}
                            store={this.props.store}
                        />)
                    break;
                default:
                    return <span>Not implemented yet</span>
            }
            return plotElt;
        },
        renderPending:()=><Loader isLoading={true} size={"big"}/>,
        renderError:()=><ErrorMessage/>
    });

    readonly overlapUI = MakeMobxView({
        await:()=>[this.plot],
        render:()=>(
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
                        {this.plot.component}
                    </div>
                </div>
            </div>
        ),
        renderPending:()=><LoadingIndicator isLoading={true} centerRelativeToContainer={true} size="big"/>,
        renderError:()=><ErrorMessage/>
    });


    public render() {
        return (
            <div className="inlineBlock">
                {this.tabUI.component}
            </div>
        )
    }
}
