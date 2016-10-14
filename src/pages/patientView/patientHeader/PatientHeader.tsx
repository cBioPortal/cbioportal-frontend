import {List} from "immutable";
import * as React from 'react';
import {Button, OverlayTrigger, Popover} from 'react-bootstrap';
import SampleInline from './SampleInline';
import TooltipTable from '../clinicalInformation/ClinicalInformationPatientTable';
import * as Immutable from 'immutable';
import Spinner from 'react-spinkit';
import OrderedMap = Immutable.OrderedMap;

type TODO = any;

type Sample = {clinicalData:TODO};

export interface PatientHeaderProps
{
    samples:List<Sample>;
    status:'fetching'|'complete'|'error';
    patient:TODO;
}

export default class PatientHeader extends React.Component<PatientHeaderProps, {}>
{
    getPopover(sample:Sample, number:number)
    {
        return (
            <Popover key={number} id={'popover-sample-' + number}>
                <TooltipTable data={Immutable.fromJS(sample.clinicalData)} />
            </Popover>
        );
    }

    drawHeader()
    {
        if (this.props.samples && this.props.samples.size > 0)
        {
            return (
                <div>
                    {this.props.samples.map((sample:Sample, number:number) => {
                        //let clinicalData = this.props.samples.get('items').keys().map(attr_id => { 
                        //    return Object({'id': x, 
                        //                  'value': this.props.samples.get('items').get(attr_id).get('TCGA-P6-A5OH-01')
                        //    }) 
                        //}).filter(x => x.value);
                        console.log(sample);

                        return (
                            <OverlayTrigger delayHide={100} key={number} trigger={['hover', 'focus']} placement="bottom" 
                             overlay={this.getPopover(sample, number+1)}>
                                <span>
                                    <SampleInline sample={sample} number={number+1} />
                                </span>
                            </OverlayTrigger>
                        );
                    })}
                </div>
            );
        }
        else
        {
            return <div>There was an error.</div>;
        }
    }

    render()
    {
        switch (this.props.status)
        {
            case 'fetching':
                return <div><Spinner spinnerName="three-bounce" /></div>;

            case 'complete':
                return this.drawHeader();

            case 'error':
                return <div>There was an error.</div>;

            default:
                return <div />;
        }
    }
}
