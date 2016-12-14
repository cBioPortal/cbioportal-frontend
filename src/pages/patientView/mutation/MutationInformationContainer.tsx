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
            geneticProfileId: {
                name: "geneticProfileId"
            },
            endPos: {
                name: "End Position",
                sortable: false
            }
        };

        return (
            <div>
                <MutationTable rawData={mockData} columns={columns}/>
            </div>
        );
    }
}
