import * as React from 'react';
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import {observer} from "mobx-react";
import GroupComparisonStore from './GroupComparisonStore';
import {observable} from 'mobx';
import Venn from './OverlapVenn';
import _ from "lodash";
import autobind from 'autobind-decorator';
import DownloadControls from 'shared/components/downloadControls/DownloadControls';
import {MakeMobxView} from "../../shared/components/MobxView";
import Loader from "../../shared/components/loadingIndicator/LoadingIndicator";
import ErrorMessage from "../../shared/components/ErrorMessage";
import {getSampleIdentifiers, OVERLAP_NOT_ENOUGH_GROUPS_MSG} from "./GroupComparisonUtils";
import {remoteData} from "../../shared/api/remoteData";
import UpSet from './UpSet';

export interface IOverlapProps {
    store: GroupComparisonStore
}

const SVG_ID = "comparison-tab-overlap-svg";
const SAMPLE_SVG_ID = "comparison-tab-overlap-sample-svg";
const PATIENT_SVG_ID = "comparison-tab-overlap-patinet-svg";

enum PlotType {
    Upset,
    Venn
}

@observer
export default class Overlap extends React.Component<IOverlapProps, {}> {

    @observable plotExists = false;

    componentDidUpdate() {
        this.plotExists = !!this.getSvg();
    }

    readonly tabUI = MakeMobxView({
        await:()=>{
            if (this.props.store._activeGroupsNotOverlapRemoved.isComplete &&
                this.props.store._activeGroupsNotOverlapRemoved.result.length < 2) {
                // dont bother loading data for and computing overlap if not enough groups for it
                return [this.props.store._activeGroupsNotOverlapRemoved];
            } else {
                return [this.props.store._activeGroupsNotOverlapRemoved, this.overlapUI];
            }
        },
        render:()=>{
            if (this.props.store._activeGroupsNotOverlapRemoved.result!.length < 2) {
                return <span>{OVERLAP_NOT_ENOUGH_GROUPS_MSG}</span>;
            } else {
                return this.overlapUI.component;
            }
        },
        renderPending:()=><Loader isLoading={true} center={true} size={"big"}/>,
        renderError:()=><ErrorMessage/>
    });

    @autobind
    private getSvg() {
        if (this.plotType.result! === PlotType.Upset) {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGElement;
            let sampleSVGElement = document.getElementById(SAMPLE_SVG_ID) as SVGElement | null
            const sampleElement = sampleSVGElement!.cloneNode(true) as Element;

            let patienrSVGElement = document.getElementById(PATIENT_SVG_ID) as SVGElement | null
            const patientElement = patienrSVGElement!.cloneNode(true) as Element;

            const height = $(sampleElement).height() + $(patientElement).height();
            const width = $(sampleElement).width() + $(patientElement).width();

            $(svg).attr("height", height);
            $(svg).attr("width", width);
            $(svg).css({ height, width });

            svg.appendChild(sampleElement)

            //move patient element down by sample element size
            patientElement.setAttribute("y", `${$(sampleElement).height()}`)
            svg.appendChild(patientElement)
            return svg;
        }
        return document.getElementById(SVG_ID) as SVGElement | null
    }

    readonly plotType = remoteData({
        await:()=>[this.props.store._activeGroupsNotOverlapRemoved],
        invoke:async()=>(this.props.store._activeGroupsNotOverlapRemoved.result!.length > 3 ? PlotType.Upset : PlotType.Venn)
    });


    public readonly sampleGroupsWithCases = remoteData({
        await: () => [
            this.props.store._activeGroupsNotOverlapRemoved,
            this.props.store.sampleSet,
        ],
        invoke: () => {
            const sampleSet = this.props.store.sampleSet.result!;
            const groupsWithSamples = _.map(this.props.store._activeGroupsNotOverlapRemoved.result, group => {
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
            this.props.store._activeGroupsNotOverlapRemoved,
            this.props.store.sampleSet,
        ],
        invoke: () => {
            const sampleSet = this.props.store.sampleSet.result!;
            const groupsWithPatients = _.map(this.props.store._activeGroupsNotOverlapRemoved.result, group => {
                let samples = getSampleIdentifiers([group]).map(sampleIdentifier => sampleSet.get({studyId: sampleIdentifier.studyId, sampleId: sampleIdentifier.sampleId}));
                return {
                    uid: group.uid,
                    cases: _.uniq(_.map(samples, sample => sample!.uniquePatientKey))
                }
            });
            return Promise.resolve(groupsWithPatients);
        }
    }, []);

    readonly uidToGroup = remoteData({
        await:()=>[this.props.store._activeGroupsNotOverlapRemoved],
        invoke:()=>Promise.resolve(_.keyBy(this.props.store._activeGroupsNotOverlapRemoved.result!, group=>group.uid))
    });

    readonly plot = MakeMobxView({
        await:()=>[
            this.plotType,
            this.sampleGroupsWithCases,
            this.patientGroupsWithCases,
            this.uidToGroup
        ],
        render:()=>{
            let plotElt: any = null;
            switch (this.plotType.result!) {
                case PlotType.Upset: {
                    plotElt = (
                        <div>
                            <UpSet
                                groups={this.sampleGroupsWithCases.result!}
                                title="Sample Sets Intersection"
                                svgId={SAMPLE_SVG_ID}
                                uidToGroup={this.uidToGroup.result!}
                                caseType="sample"
                            />
                            <UpSet
                                groups={this.patientGroupsWithCases.result!}
                                title="Patient Sets Intersection"
                                svgId={PATIENT_SVG_ID}
                                uidToGroup={this.uidToGroup.result!}
                                caseType="patient"
                            />
                        </div>)
                    break;
                }
                case PlotType.Venn:
                    plotElt = (
                        <Venn
                            svgId={SVG_ID}
                            sampleGroups={this.sampleGroupsWithCases.result!}
                            patientGroups={this.patientGroupsWithCases.result!}
                            uidToGroup={this.uidToGroup.result!}
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
                <div data-test="ComparisonPageOverlapTabDiv" className="borderedChart posRelative">
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
