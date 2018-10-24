import * as React from "react";
import {observer} from "mobx-react";
import ErrorIcon from "./ErrorIcon";

export interface IErrorMessageProps {
}

@observer
export default class ErrorMessage extends React.Component<IErrorMessageProps, {}> {
    render() {
        return <span>
            <i
                className="fa fa-md fa-exclamation-triangle"
                style={{
                    color: "#BB1700",
                    cursor: "pointer",
                    marginRight:7
                }}
            />
            Error encountered. Please let us know about this error and how you got here at <b>cbioportal at googlegroups dot com.</b>
        </span>
    }
}