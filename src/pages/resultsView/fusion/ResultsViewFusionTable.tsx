/**
 * Copyright (c) 2018 The Hyve B.V.
 * This code is licensed under the GNU Affero General Public License (AGPL),
 * version 3, or (at your option) any later version.
 *
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 **/

import * as React from "react";
import { observer } from "mobx-react";
import FusionTable, { FusionTableColumnType } from '../../../shared/components/fusionTable/FusionTable';
import { IFusionTableProps } from '../../../shared/components/fusionTable/IFusionTableProps';

export interface IResultsViewFusionTableProps extends IFusionTableProps {
    // add results view specific props here if needed
}

@observer
export default class ResultsViewFusionTable extends FusionTable<IResultsViewFusionTableProps> {

    constructor(props: IResultsViewFusionTableProps) {
        super(props);
    }

    public static defaultProps =
        {
            ...FusionTable.defaultProps,
            columns: [
                FusionTableColumnType.STUDY,
                FusionTableColumnType.SAMPLE_ID,
                FusionTableColumnType.SITE1_ENTREZ_GENE_ID,
                FusionTableColumnType.SITE1_HUGO_SYMBOL,
                FusionTableColumnType.SITE1_ENSEMBL_TRANSCRIPT_ID,
                FusionTableColumnType.SITE1_EXON,
                FusionTableColumnType.SITE1_CHROMOSOME,
                FusionTableColumnType.SITE1_POSITION,
                FusionTableColumnType.SITE1_DESCRIPTION,
                FusionTableColumnType.SITE2_ENTREZ_GENE_ID,
                FusionTableColumnType.SITE2_HUGO_SYMBOL,
                FusionTableColumnType.SITE2_ENSEMBL_TRANSCRIPT_ID,
                FusionTableColumnType.SITE2_EXON,
                FusionTableColumnType.SITE2_CHROMOSOME,
                FusionTableColumnType.SITE2_POSITION,
                FusionTableColumnType.SITE2_DESCRIPTION,
                FusionTableColumnType.SITE2_EFFECT_ON_FRAME,
                FusionTableColumnType.NCBI_BUILD,
                FusionTableColumnType.DNA_SUPPORT,
                FusionTableColumnType.RNA_SUPPORT,
                FusionTableColumnType.NORMAL_READ_COUNT,
                FusionTableColumnType.TUMOR_READ_COUNT,
                FusionTableColumnType.NORMAL_VARIANT_COUNT,
                FusionTableColumnType.TUMOR_VARIANT_COUNT,
                FusionTableColumnType.NORMAL_PAIRED_END_READ_COUNT,
                FusionTableColumnType.TUMOR_PAIRED_END_READ_COUNT,
                FusionTableColumnType.NORMAL_SPLIT_READ_COUNT,
                FusionTableColumnType.TUMOR_SPLIT_READ_COUNT,
                FusionTableColumnType.ANNOTATION,
                FusionTableColumnType.BREAKPOINT_TYPE,
                FusionTableColumnType.CENTER,
                FusionTableColumnType.CONNECTION_TYPE,
                FusionTableColumnType.EVENT_INFO,
                FusionTableColumnType.VARIANT_CLASS,
                FusionTableColumnType.LENGTH,
                FusionTableColumnType.COMMENTS,
                FusionTableColumnType.EXTERNAL_ANNOTATION,
                FusionTableColumnType.DRIVER_FILTER,
                FusionTableColumnType.DRIVER_FILTER_ANNOTATION,
                FusionTableColumnType.DRIVER_TIERS_FILTER,
                FusionTableColumnType.DRIVER_TIERS_FILTER_ANNOTATION
            ]
        };

    componentWillUpdate(nextProps: IResultsViewFusionTableProps) {
        this._columns[FusionTableColumnType.STUDY].visible = !!(nextProps.studyIdToStudy && (Object.keys(nextProps.studyIdToStudy).length > 1));
    }

    protected generateColumns() {

        super.generateColumns();

        // order columns
        // =============

        this._columns[FusionTableColumnType.STUDY].order = 0;
        this._columns[FusionTableColumnType.SAMPLE_ID].order = 5;

        this._columns[FusionTableColumnType.SITE1_ENTREZ_GENE_ID].order = 10;
        this._columns[FusionTableColumnType.SITE1_HUGO_SYMBOL].order = 20;
        this._columns[FusionTableColumnType.SITE1_ENSEMBL_TRANSCRIPT_ID].order = 30;
        this._columns[FusionTableColumnType.SITE1_EXON].order = 40;
        this._columns[FusionTableColumnType.SITE1_CHROMOSOME].order = 50;
        this._columns[FusionTableColumnType.SITE1_POSITION].order = 60;
        this._columns[FusionTableColumnType.SITE1_DESCRIPTION].order = 70;

        this._columns[FusionTableColumnType.SITE2_ENTREZ_GENE_ID].order = 80;
        this._columns[FusionTableColumnType.SITE2_HUGO_SYMBOL].order = 90;
        this._columns[FusionTableColumnType.SITE2_ENSEMBL_TRANSCRIPT_ID].order = 100;
        this._columns[FusionTableColumnType.SITE2_EXON].order = 110;
        this._columns[FusionTableColumnType.SITE2_CHROMOSOME].order = 120;
        this._columns[FusionTableColumnType.SITE2_POSITION].order = 130;
        this._columns[FusionTableColumnType.SITE2_DESCRIPTION].order = 140;
        this._columns[FusionTableColumnType.SITE2_EFFECT_ON_FRAME].order = 145;

        this._columns[FusionTableColumnType.NCBI_BUILD].order = 150;
        this._columns[FusionTableColumnType.DNA_SUPPORT].order = 160;
        this._columns[FusionTableColumnType.RNA_SUPPORT].order = 170;

        this._columns[FusionTableColumnType.NORMAL_READ_COUNT].order = 180;
        this._columns[FusionTableColumnType.TUMOR_READ_COUNT].order = 190;

        this._columns[FusionTableColumnType.NORMAL_VARIANT_COUNT].order = 200;
        this._columns[FusionTableColumnType.TUMOR_VARIANT_COUNT].order = 210;

        this._columns[FusionTableColumnType.NORMAL_PAIRED_END_READ_COUNT].order = 220;
        this._columns[FusionTableColumnType.TUMOR_PAIRED_END_READ_COUNT].order = 230;

        this._columns[FusionTableColumnType.NORMAL_SPLIT_READ_COUNT].order = 240;
        this._columns[FusionTableColumnType.TUMOR_SPLIT_READ_COUNT].order = 250;

        this._columns[FusionTableColumnType.BREAKPOINT_TYPE].order = 260;
        this._columns[FusionTableColumnType.ANNOTATION].order = 270;
        this._columns[FusionTableColumnType.CENTER].order = 280;
        this._columns[FusionTableColumnType.CONNECTION_TYPE].order = 290;
        this._columns[FusionTableColumnType.EVENT_INFO].order = 300;
        this._columns[FusionTableColumnType.VARIANT_CLASS].order = 310;
        this._columns[FusionTableColumnType.LENGTH].order = 320;
        this._columns[FusionTableColumnType.COMMENTS].order = 330;
        this._columns[FusionTableColumnType.EXTERNAL_ANNOTATION].order = 340;

        this._columns[FusionTableColumnType.DRIVER_FILTER].order = 350;
        this._columns[FusionTableColumnType.DRIVER_FILTER_ANNOTATION].order = 360;
        this._columns[FusionTableColumnType.DRIVER_TIERS_FILTER].order = 370;
        this._columns[FusionTableColumnType.DRIVER_TIERS_FILTER_ANNOTATION].order = 380;

    }
}
