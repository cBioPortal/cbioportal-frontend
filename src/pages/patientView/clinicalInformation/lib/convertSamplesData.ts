import {ClinicalData, ClinicalAttribute, Sample} from '../../../../shared/api/CBioPortalAPI';
import {ClinicalDataBySampleId} from "../getClinicalInformationData";

export interface IColumn {
    id:string;
};

export interface IAttrData {
    [attrId:string]: {
        [sampleId: string]: ClinicalAttribute | string;
        clinicalAttribute: ClinicalAttribute;
        id: string;
    };
};

export interface IConvertedSamplesData {
    columns: IColumn[];
    items: IAttrData;
}

export default function (data?: Array<ClinicalDataBySampleId>):IConvertedSamplesData {
    const output:IConvertedSamplesData = { columns: [], items: {} };

    if (data)
        data.forEach((sample: ClinicalDataBySampleId) => {
            const sampleId = sample.id;

            output.columns.push({ id: sampleId });

            sample.clinicalData.forEach((dataItem) => {
                output.items[dataItem.clinicalAttributeId] = output.items[dataItem.clinicalAttributeId] || {};
                output.items[dataItem.clinicalAttributeId][sampleId] = dataItem.value.toString();
                output.items[dataItem.clinicalAttributeId].clinicalAttribute = dataItem.clinicalAttribute;
                output.items[dataItem.clinicalAttributeId].id = dataItem.clinicalAttributeId;
            });
        });

    return output;
}
