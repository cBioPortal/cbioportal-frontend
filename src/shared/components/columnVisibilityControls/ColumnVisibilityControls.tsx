import * as React from 'react';
import * as _ from 'lodash';
import { Dropdown, Checkbox } from 'react-bootstrap';
import { DropdownToggleProps } from 'react-bootstrap/lib/DropdownToggle';
import { DropdownMenuProps } from 'react-bootstrap/lib/DropdownMenu';
import AddColumns from 'pages/resultsView/mutation/AddColumns';

export interface IColumnVisibilityDef {
    id: string;
    name: string;
    visible: boolean;
    togglable?: boolean;
    clinicalAttributeId?: string;
}

export interface IColumnVisibilityControlsProps {
    className?: string;
    buttonText?: string | JSX.Element;
    columnVisibility?: IColumnVisibilityDef[];
    onColumnEnabled?: (columnId: string) => void;
    onColumnDisabled?: (columnId: string) => void;
    onColumnToggled?: (
        columnId: string,
        columnVisibility?: IColumnVisibilityDef[]
    ) => void;
    clinicalAttributeIdToAvailableSampleCount?: { [id: string]: number };
    sampleCount?: number;
    isMutationsTabTable?: boolean;
}

/**
 * @author Selcuk Onur Sumer
 * @author Aaron Lisman
 */
export class ColumnVisibilityControls extends React.Component<
    IColumnVisibilityControlsProps,
    {}
> {
    public static defaultProps: IColumnVisibilityControlsProps = {
        className: '',
        buttonText: 'Columns',
    };

    constructor(props: IColumnVisibilityControlsProps) {
        super(props);
        this.handleSelect = this.handleSelect.bind(this);
    }

    public render() {
        return (
            <div>
                {this.props.isMutationsTabTable
                    ? this.mutationsTabAddColumnsDropdown
                    : this.defaultDropdown}
            </div>
        );
    }

    private get mutationsTabAddColumnsDropdown() {
        return (
            <div style={{ float: 'right' }}>
                <AddColumns
                    className={this.props.className}
                    columnVisibility={this.props.columnVisibility}
                    onColumnEnabled={this.props.onColumnEnabled}
                    onColumnDisabled={this.props.onColumnDisabled}
                    onColumnToggled={this.props.onColumnToggled}
                    clinicalAttributeIdToAvailableSampleCount={
                        this.props.clinicalAttributeIdToAvailableSampleCount
                    }
                    sampleCount={this.props.sampleCount}
                />
            </div>
        );
    }

    private get defaultDropdown() {
        return (
            <Dropdown className={this.props.className} id="dropdown-custom-1">
                <Dropdown.Toggle
                    {...({ rootCloseEvent: 'click' } as DropdownToggleProps)}
                    className="btn-sm"
                >
                    {this.props.buttonText}
                </Dropdown.Toggle>
                <Dropdown.Menu
                    {...({ bsRole: 'menu' } as DropdownMenuProps)}
                    style={{
                        paddingLeft: 10,
                        overflow: 'auto',
                        maxHeight: 300,
                        whiteSpace: 'nowrap',
                    }}
                >
                    <ul className="list-unstyled">
                        {this.props.columnVisibility &&
                            _.map(
                                this.props.columnVisibility,
                                (visibility: IColumnVisibilityDef) => {
                                    return visibility.togglable ? (
                                        <li key={visibility.id}>
                                            <Checkbox
                                                data-id={visibility.id}
                                                onChange={
                                                    this
                                                        .handleSelect as React.FormEventHandler<
                                                        any
                                                    >
                                                }
                                                checked={visibility.visible}
                                                inline
                                            >
                                                {visibility.name}
                                            </Checkbox>
                                        </li>
                                    ) : null;
                                }
                            )}
                    </ul>
                </Dropdown.Menu>
            </Dropdown>
        );
    }

    private handleSelect(evt: React.FormEvent<HTMLInputElement>) {
        const id = evt.currentTarget.getAttribute('data-id');

        if (this.props.onColumnToggled && id) {
            this.props.onColumnToggled(id, this.props.columnVisibility);
        }
    }
}
