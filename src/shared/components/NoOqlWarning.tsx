import * as React from "react";

//<div className="alert alert-info" role="alert">

const NoOqlWarning = (
    <span style={{color:"#74bedb", fontFamily:"arial", fontSize:"13px", fontWeight:"bold"}}>
        <span style={{marginRight:4, verticalAlign:"middle"}}>
            <i
                className="fa fa-md fa-info-circle"
            />
        </span>
        This tab does not reflect the OQL specification from your query.
    </span>
);

export default NoOqlWarning;