import * as React from 'react';
import FontAwesome from 'react-fontawesome';

interface PathwayMapperMessageBoxProps {
    message: string | null;
    defaultMessage: string;
    loadingMessage: string;
    onClearMessage: () => void;
}
const PathwayMapperMessageBox: React.SFC<
    PathwayMapperMessageBoxProps
> = props => {
    const message = props.message;
    const isWarningMessage =
        message !== props.loadingMessage && message !== props.defaultMessage;

    return (
        <div
            className={
                'alert ' +
                (isWarningMessage ? 'alert-warning' : 'alert-success')
            }
            style={{
                marginLeft: '1%',
                marginBottom: '0px',
                color: message !== props.defaultMessage ? 'black' : 'gray',
                maxHeight: '35px',
                overflowY: 'auto',
            }}
        >
            <button
                type="button"
                className="close"
                onClick={() => {
                    props.onClearMessage();
                }}
                style={{
                    display:
                        message !== props.defaultMessage ? 'block' : 'none',
                }}
            >
                <FontAwesome name="times" />
            </button>
            {isWarningMessage && (
                <i
                    className="fa fa-md fa-exclamation-triangle"
                    style={{
                        marginRight: '6px',
                        marginBottom: '1px',
                    }}
                ></i>
            )}
            {message}
        </div>
    );
};

export default PathwayMapperMessageBox;
