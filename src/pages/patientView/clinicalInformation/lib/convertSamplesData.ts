import { ClinicalData } from '../../../../shared/api/CBioPortalAPI';
import {ClinicalDataBySampleId} from "../getClinicalInformationData";

export default function (data: Array<ClinicalDataBySampleId>) {
    const output:any = { columns: [], items: {} };

    data.forEach((sample: ClinicalDataBySampleId) => {
        const sampleId = sample.id;

        output.columns.push({ id: sampleId });

        sample.clinicalData.forEach((dataItem) => {
            output.items[dataItem.attrId] = output.items[dataItem.attrId] || {};
            output.items[dataItem.attrId][sampleId] = dataItem.attrValue.toString();
            output.items[dataItem.attrId].clinicalAttribute = dataItem.clinicalAttribute;
            output.items[dataItem.attrId].id = dataItem.attrId;
        });
    });

    return output;
}
