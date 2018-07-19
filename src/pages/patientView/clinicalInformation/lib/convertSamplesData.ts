import {ClinicalData, ClinicalAttribute, Sample} from '../../../../shared/api/generated/CBioPortalAPI';
import { ClinicalDataBySampleId } from "../../../../shared/api/api-types-extended";

export interface IColumn {
    id:string;
};

export interface IAttrData {
    [attrId:string]: {
        [sampleId: string]: ClinicalAttribute | string | number;
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

            sample.clinicalData.forEach((clinicalData: ClinicalData) => {
                output.items[clinicalData.clinicalAttributeId] = output.items[clinicalData.clinicalAttributeId] || {};
                output.items[clinicalData.clinicalAttributeId][sampleId] = clinicalData.value.toString();
                output.items[clinicalData.clinicalAttributeId].clinicalAttribute = clinicalData.clinicalAttribute;
                output.items[clinicalData.clinicalAttributeId].id = clinicalData.clinicalAttributeId;
            });
        });

    return output;
}

