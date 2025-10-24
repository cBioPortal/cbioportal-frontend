import * as React from 'react';
import { FunctionComponent } from 'react';
import { Dropdown } from 'react-bootstrap';
import { DropdownToggleProps } from 'react-bootstrap/lib/DropdownToggle';

import { DropdownMenuProps } from 'react-bootstrap/lib/DropdownMenu';
import { QueryStore } from 'shared/components/query/QueryStore';

export interface IFilterDef {
    id: string;
    name: string;
    checked: boolean;
}

export type IDataTypeFilterProps = {
    dataFilter: string[];
    isChecked: boolean;
    buttonText: string | JSX.Element;
    dataFilterActive?: IFilterDef[];
    store: QueryStore;
    samplePerFilter: number[];
    studyPerFilter: number[];
    toggleFilter: (id: string) => void;
};

export const DataTypeFilter: FunctionComponent<IDataTypeFilterProps> = props => {
    return (
        <div data-test="dropdown-data-type-filter" style={{ paddingRight: 5 }}>
            <div className="input-group input-group-sm input-group-toggle">
                <Dropdown id="dropdown-study-data-filter">
                    <Dropdown.Toggle
                        {...({
                            rootCloseEvent: 'click',
                        } as DropdownToggleProps)}
                        className="btn-sm"
                        style={{
                            minWidth: 118,
                            textAlign: 'right',
                            float: 'right',
                            paddingRight: 5,
                        }}
                    >
                        <span
                            style={{
                                float: 'left',
                                paddingLeft: 0,
                                marginLeft: 0,
                            }}
                        >
                            {props.buttonText}
                        </span>
                        {props.store.dataTypeFilters!.length > 0 && (
                            <span
                                className="oncoprintDropdownCount"
                                style={{ marginLeft: 5 }}
                            >
                                {props.store.dataTypeFilters!.length} /{' '}
                                {props.dataFilterActive!.length}
                            </span>
                        )}
                    </Dropdown.Toggle>
                    <Dropdown.Menu
                        {...({ bsRole: 'menu' } as DropdownMenuProps)}
                        style={{
                            paddingLeft: 10,
                            overflow: 'auto',
                            maxHeight: 300,
                            whiteSpace: 'nowrap',
                            paddingRight: 1,
                            width: 350,
                        }}
                    >
                        <label style={{ paddingTop: 8 }}>
                            Filter studies with selected data types
                        </label>
                        <label
                            style={{
                                color: '#3786C2',
                                paddingTop: 5,
                                float: 'left',
                                width: 220,
                            }}
                        >
                            Data type
                        </label>
                        <label
                            style={{
                                paddingTop: 6,
                                paddingRight: 15,
                                color: '#999',
                                textAlign: 'right',
                                float: 'left',
                                width: 55,
                                display: 'inline-block',
                            }}
                        >
                            Studies
                        </label>
                        <label
                            style={{
                                paddingTop: 6,
                                color: '#999',
                                marginRight: 2,
                                textAlign: 'right',
                                float: 'left',
                                width: 55,
                                display: 'inline-block',
                            }}
                        >
                            Samples
                        </label>
                        {props.dataFilterActive!.map((type, i) => {
                            return (
                                <div style={{ display: 'inline' }}>
                                    <label
                                        style={{
                                            paddingTop: 5,
                                            float: 'left',
                                            width: 220,
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            style={{ marginRight: 2 }}
                                            checked={type.checked}
                                            onClick={() => {
                                                props.toggleFilter(type.id);
                                                props.store.dataTypeFilters = createDataTypeUpdate(
                                                    props.dataFilterActive!
                                                );
                                            }}
                                        />
                                        {}
                                        <span style={{ paddingLeft: 5 }}>
                                            {type.name}
                                        </span>
                                    </label>
                                    <label
                                        style={{
                                            paddingTop: 5,
                                            color: '#999',
                                            paddingRight: 10,
                                            textAlign: 'right',
                                            float: 'left',
                                            width: 55,
                                            display: 'inline-block',
                                        }}
                                    >
                                        {props.studyPerFilter![i]}
                                    </label>
                                    <label
                                        style={{
                                            paddingTop: 5,
                                            float: 'left',
                                            width: 55,
                                            color: '#999',
                                            marginRight: 2,
                                            textAlign: 'right',
                                            display: 'inline-block',
                                        }}
                                    >
                                        {props.samplePerFilter![i]}
                                    </label>
                                </div>
                            );
                        })}
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </div>
    );
};

export function createDataTypeUpdate(allFilters: IFilterDef[]): string[] {
    const toAdd: string[] = [];
    allFilters.map((subDataFilter: IFilterDef) =>
        subDataFilter.checked ? toAdd.push(subDataFilter.id) : ''
    );
    return toAdd;
}
