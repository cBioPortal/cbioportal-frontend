import * as React from "react";
import {observer} from "mobx-react";
import ErrorIcon from "./ErrorIcon";
import AppConfig from "appConfig";

export interface IErrorMessageProps {
    message?:string;
}

@observer
export default class ErrorMessage extends React.Component<IErrorMessageProps, {}> {
    static defaultProps = {
        message: "Error encountered."
    };

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
            {this.props.message!} Please let us know about this error and how you got here at <b style={{ whiteSpace: "nowrap" }}><a href={`mailto:${AppConfig.serverConfig.skin_email_contact}`}>{AppConfig.serverConfig.skin_email_contact}</a></b>
        </span>
    }
}