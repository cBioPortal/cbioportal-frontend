import * as React from 'react';
import { ClinicalData } from 'cbioportal-ts-api-client';

export type IClinicalAttributesInlineProps = {
    clinicalData?: ClinicalData;
    cancerStudyId: string;
};
