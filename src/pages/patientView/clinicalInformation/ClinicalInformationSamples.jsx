import React, { PropTypes as T } from 'react';

import {Table, Column, Cell} from 'fixed-data-table';

import EnhancedFixedDataTable from 'shared/components/enhancedFixedDataTable/EnhancedFixedDataTable';

import covertSampleData from './lib/convertSamplesData';

export class ClinicalInformationSamplesTable extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            myTableData: [
                { name: 'Rylan' },
                { name: 'Amelia' },
                { name: 'Estevan' },
                { name: 'Florence' },
                { name: 'Tressa' },
            ],
        };
    }

    render() {
        const data = covertSampleData(this.props.data);

        const cells = [];

        Object.keys(data.items).forEach((key) => {
            const item = data.items[key];

            data.columns.forEach((col) => {
                if (col.id in item) {
                    cells.push({ attr_name: item.clinicalAttribute.displayName, attr_id: col.id, attr_val: item[col.id] });
                } else {
                    cells.push({ attr_name: item.clinicalAttribute.displayName, attr_id: col.id, attr_val: 'N/A' });
                }
            });
        });

        const d = {
            attributes: data.columns.map((col) => {
                return { attr_id: col.id, datatype: 'STRING', display_name: col.id };
            }),
            data: cells,
        };

        d.attributes.unshift({ attr_id: 'attr_name', datatype: 'STRING', display_name: 'Attribute' });

        return <EnhancedFixedDataTable input={d} groupHeader={false} filter="GLOBAL" rowHeight={33} headerHeight={33} download="ALL" uniqueId="attr_name" tableWidth={1190} autoColumnWidth={true} />;
    }
}

export default ClinicalInformationSamplesTable;


ClinicalInformationSamplesTable.propTypes = {
    data: T.any.isRequired,
};

