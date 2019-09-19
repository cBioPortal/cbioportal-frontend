import * as React from "react";
import {observer} from "mobx-react";
import {SortableContainer, SortableElement} from "react-sortable-hoc";
import * as _ from "lodash";
import {ClinicalDataBySampleId} from "../../../shared/api/api-types-extended";
import {getMouseIcon} from "../SVGIcons";
import {getSampleViewUrl} from "../../../shared/api/urls";
import SampleManager from "../sampleManager";
import {getSpanElementsFromCleanData} from "../clinicalInformation/lib/clinicalAttributesUtil";
import LoadingIndicator from "../../../shared/components/loadingIndicator/LoadingIndicator";
import SignificantMutationalSignatures from "./SignificantMutationalSignatures";
import {PatientViewPageStore} from "../clinicalInformation/PatientViewPageStore";

export interface ISampleInlineListProps {
    samples: ClinicalDataBySampleId[];
    sampleManager: SampleManager;
    store:PatientViewPageStore;
    handleSampleClick:(sampleId:string, event:React.MouseEvent<HTMLAnchorElement>)=>void;
}

const SampleInlineListButton = SortableElement(observer(
    (props:{
        sampleManager: SampleManager,
        store:PatientViewPageStore,
        sample:ClinicalDataBySampleId,
    })=>{
        const {sampleManager, sample, store} = props;
        const isPDX:boolean = (
            sampleManager.clinicalDataLegacyCleanAndDerived &&
            sampleManager.clinicalDataLegacyCleanAndDerived[sample.id] &&
            sampleManager.clinicalDataLegacyCleanAndDerived[sample.id].DERIVED_NORMALIZED_CASE_TYPE === 'Xenograft'
        );

        return (
            <div className="patientSample no-select">
                <span className='clinical-spans'>
                    {
                        sampleManager!.getComponentForSample(sample.id,1, '',
                            <span style={{display:'inline-flex'}}>
                                {'\u00A0'}
                                {isPDX && getMouseIcon()}
                                {isPDX && '\u00A0'}
                                <a
                                    href={getSampleViewUrl(store.studyMetaData.result!.studyId, sample.id)}
                                    target="_blank"
                                    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => this.props.handleSampleClick(sample.id, e)}
                                >
                                    {SampleManager.getClinicalAttributeInSample(sample, "DISPLAY_SAMPLE_NAME") ? `${SampleManager.getClinicalAttributeInSample(sample, "DISPLAY_SAMPLE_NAME")!.value} (${sample.id})` : sample.id}
                                </a>
                                {sampleManager &&
                                sampleManager.clinicalDataLegacyCleanAndDerived[sample.id] &&
                                getSpanElementsFromCleanData(sampleManager.clinicalDataLegacyCleanAndDerived[sample.id], store.studyId)}
                            </span>
                        )
                    }
                </span>
                {store.hasMutationalSignatureData.result === true &&
                <LoadingIndicator isLoading={store.mutationalSignatureData.isPending && store.mutationalSignatureMetaData.isPending}/>}

                {store.hasMutationalSignatureData.result === true &&
                store.clinicalDataGroupedBySample.isComplete && store.mutationalSignatureData.isComplete &&
                store.mutationalSignatureMetaData.isComplete &&
                (<SignificantMutationalSignatures data={store.mutationalSignatureData.result}
                                                  metadata={store.mutationalSignatureMetaData.result} uniqueSampleKey={sample.id}/>)}

            </div>
        );
    }));

@observer
class SampleInlineList extends React.Component<ISampleInlineListProps, {}> {
    render() {
        return (
            <div>
                <div> {/*https://github.com/clauderic/react-sortable-hoc/issues/367 we need these extra divs*/}
                    {this.props.samples.map((sample: ClinicalDataBySampleId, index:number) => (
                        <SampleInlineListButton
                            sampleManager={this.props.sampleManager}
                            store={this.props.store}
                            sample={sample}
                            index={index}
                        />
                    ))}
                </div>
            </div>
        );
    }
}

export default SortableContainer(SampleInlineList);