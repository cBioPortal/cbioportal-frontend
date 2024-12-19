import React from 'react';
import { observer, inject } from 'mobx-react';
import { AnnotationVisualisation } from 'oncokb-annotation-visualisation';
import { patientId, patientInfo, notifications } from '../../../../APIResponse';
import {
    ANNOTATION_TYPE,
    AnnotationImplication,
    TreatmentImplication,
} from 'oncokb-annotation-visualisation/config/constants';

const AnnotationVisualisationComponent = inject('routing')(
    observer(props => {
        const { mutationData, structuralVariantData, cnaData } = props;
        const totalAnnotations = {
            mutationData: mutationData,
            cnaData: cnaData,
            structuralVariantData: structuralVariantData,
        };
        return (
            <AnnotationVisualisation
                data={totalAnnotations}
                patientId={patientId}
                patientInfo={patientInfo}
                isPatientInfoVisible={false}
                notifications={notifications}
            />
        );
    })
);

export default AnnotationVisualisationComponent;
