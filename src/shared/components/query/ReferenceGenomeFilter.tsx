import * as React from 'react';
import { FunctionComponent } from 'react';
import { Dropdown } from 'react-bootstrap';
import { DropdownToggleProps } from 'react-bootstrap/lib/DropdownToggle';
import { DropdownMenuProps } from 'react-bootstrap/lib/DropdownMenu';

export type IReferenceGenomeFilterProps = {
    referenceGenomes: string[];
    selectedGenomes: string[];
    onToggle: (genome: string) => void;
};

export const ReferenceGenomeFilter: FunctionComponent<IReferenceGenomeFilterProps> = props => {
    const selectedCount = props.selectedGenomes.length;

    return (
        <div style={{ paddingRight: 5 }}>
            <div className="input-group input-group-sm input-group-toggle">
                <Dropdown id="dropdown-reference-genome-filter">
                    <Dropdown.Toggle
                        {...({
                            rootCloseEvent: 'click',
                        } as DropdownToggleProps)}
                        className="btn-sm"
                        style={{
                            width: 170,
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
                            Reference genome
                        </span>
                        {selectedCount > 0 && (
                            <span
                                className="oncoprintDropdownCount"
                                style={{ marginLeft: 5 }}
                            >
                                {selectedCount} /{' '}
                                {props.referenceGenomes.length}
                            </span>
                        )}
                    </Dropdown.Toggle>
                    <Dropdown.Menu
                        {...({ bsRole: 'menu' } as DropdownMenuProps)}
                        style={{
                            paddingLeft: 10,
                            paddingRight: 10,
                            minWidth: 200,
                        }}
                    >
                        <div style={{ paddingTop: 8, paddingBottom: 8 }}>
                            Filter studies by reference genome
                        </div>
                        {props.referenceGenomes.map(genome => (
                            <div key={genome} style={{ paddingBottom: 6 }}>
                                <label
                                    style={{
                                        fontWeight: 'normal',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        style={{ marginRight: 5 }}
                                        checked={props.selectedGenomes.includes(
                                            genome
                                        )}
                                        onChange={() => props.onToggle(genome)}
                                    />
                                    {genome}
                                </label>
                            </div>
                        ))}
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </div>
    );
};
