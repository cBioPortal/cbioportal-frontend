import * as React from "react";
import {observer} from "mobx-react";
import {SortableElement} from "react-sortable-hoc";
import GroupComparisonStore from "../GroupComparisonStore";

export interface ISelectionButtonProps {
    store:GroupComparisonStore;
}

@observer
class SelectionButton extends React.Component<ISelectionButtonProps, {}> {
    render() {
        return (
            <div style={{
                display:'inline-flex',
                whiteSpace:'nowrap',
                paddingLeft:7,
                paddingRight:7
            }} >
                <a onClick={this.props.store.selectAllGroups}>Select all</a>
                &nbsp;|&nbsp;
                <a onClick={this.props.store.deselectAllGroups}>Deselect all</a>
            </div>
        );
    }
}

export default SortableElement(SelectionButton);
