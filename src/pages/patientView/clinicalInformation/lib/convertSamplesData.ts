import {
    ClinicalData,
    ClinicalDataBySampleId,
    ClinicalAttribute,
    Sample,
} from 'cbioportal-ts-api-client';

export interface IColumn {
    id: string;
}

export interface IAttrData {
    [attrId: string]: {
        [sampleId: string]: ClinicalAttribute | string;
        clinicalAttribute: ClinicalAttribute;
        id: string;
    };
}

export interface IConvertedSamplesData {
    columns: IColumn[];
    items: IAttrData;
}

export default function(
    data?: Array<ClinicalDataBySampleId>
): IConvertedSamplesData {
    const output: IConvertedSamplesData = { columns: [], items: {} };

    if (!data) {
        return output;
    }

    output.columns = new Array<IColumn>(data.length);

    for (let sampleIndex = 0; sampleIndex < data.length; sampleIndex += 1) {
        const sample = data[sampleIndex];
        const sampleId = sample.id;

        output.columns[sampleIndex] = { id: sampleId };

        for (
            let clinicalDataIndex = 0;
            clinicalDataIndex < sample.clinicalData.length;
            clinicalDataIndex += 1
        ) {
            const clinicalData: ClinicalData =
                sample.clinicalData[clinicalDataIndex];
            let attributeItem = output.items[clinicalData.clinicalAttributeId];

            if (!attributeItem) {
                attributeItem = output.items[clinicalData.clinicalAttributeId] =
                    {
                        clinicalAttribute: clinicalData.clinicalAttribute,
                        id: clinicalData.clinicalAttributeId,
                    };
            }

            attributeItem[sampleId] = clinicalData.value.toString();
        }
    }

    return output;
}
