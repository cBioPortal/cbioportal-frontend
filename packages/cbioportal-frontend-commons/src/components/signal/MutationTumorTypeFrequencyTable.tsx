import { ISignalTumorTypeDecomposition } from 'cbioportal-utils';
import _ from 'lodash';
import { computed } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import ReactTable, { Column } from 'react-table';
import {
    FrequencyTableColumnEnum,
    FREQUENCY_COLUMNS_DEFINITION,
} from './SignalHelper';

import 'react-table/react-table.css';
import './styles.scss';

export interface ITumorTypeFrequencyTableProps {
    data: ISignalTumorTypeDecomposition[];
    columns?: Column<ISignalTumorTypeDecomposition>[];
}

@observer
class MutationTumorTypeFrequencyTable extends React.Component<
    ITumorTypeFrequencyTableProps
> {
    @computed
    private get defaultPageSize() {
        if (this.props.data.length > 10) {
            return 10;
        } else if (this.props.data.length === 0) {
            return 1;
        } else {
            return this.props.data.length;
        }
    }

    static readonly defaultProps = {
        frequencyTableColumns: [
            FREQUENCY_COLUMNS_DEFINITION[FrequencyTableColumnEnum.TUMOR_TYPE],
            FREQUENCY_COLUMNS_DEFINITION[
                FrequencyTableColumnEnum.MUTATION_STATUS
            ],
            FREQUENCY_COLUMNS_DEFINITION[FrequencyTableColumnEnum.SAMPLE_COUNT],
            FREQUENCY_COLUMNS_DEFINITION[
                FrequencyTableColumnEnum.VARIANT_COUNT
            ],
            FREQUENCY_COLUMNS_DEFINITION[
                FrequencyTableColumnEnum.PREVALENCE_FREQUENCY
            ],
            FREQUENCY_COLUMNS_DEFINITION[
                FrequencyTableColumnEnum.BIALLELIC_RATIO
            ],
            // TODO: add more columns after having additional columns data for pathogenic variants
        ],
    };

    public render() {
        return (
            <div>
                <ReactTable
                    data={this.props.data}
                    columns={this.props.columns}
                    defaultSorted={[
                        {
                            id: FrequencyTableColumnEnum.PREVALENCE_FREQUENCY,
                            desc: true,
                        },
                    ]}
                    defaultSortDesc={true}
                    defaultPageSize={this.defaultPageSize}
                    showPagination={
                        this.defaultPageSize !== this.props.data.length
                    }
                    minRows={0}
                    className="-striped -highlight"
                    previousText="<"
                    nextText=">"
                />
            </div>
        );
    }
}

export default MutationTumorTypeFrequencyTable;
