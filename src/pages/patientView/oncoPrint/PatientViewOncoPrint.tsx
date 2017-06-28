import * as React from 'react';
import * as _ from 'lodash';
import SampleManager from "../sampleManager";
import {Mutation} from "shared/api/generated/CBioPortalAPI";

interface IPatientViewOncoPrintProps {
  sampleManager: SampleManager;
  mutationData: Mutation[][];
}

export default class PatientViewOncoPrint extends React.Component<IPatientViewOncoPrintProps, {}> {
  constructor(props:IPatientViewOncoPrintProps) {
    super(props);
  }

  render() {

    return (
      <div></div>
    )
  }
}
