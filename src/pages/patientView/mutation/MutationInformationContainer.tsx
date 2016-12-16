import * as React from "react";
import mockData from "./mock/mutationData.json";
import MutationTable from "../../../shared/components/mutationTable/MutationTable";

export interface IMutationInformationContainerProps {
    // setTab?: (activeTab:number) => void;
    store?: any;
};

export default class MutationInformationContainer extends React.Component<IMutationInformationContainerProps, {}> {
    public render() {
        // TODO properly customize table for patient view specific columns!!!
        let columns = {
            tumors: {
                name: "Tumors"
            },
            annotation: {
                name: "Annotation"
            },
            copyNumber: {
                name: "Copy #"
            },
            mRnaExp: {
                name: "mRNA Exp."
            },
            cohort: {
                name: "Cohort"
            },
            cosmic: {
                name: "COSMIC"
            }
        };

        return (
            <div>
                <MutationTable rawData={mockData} columns={columns}/>
            </div>
        );
    }
}
