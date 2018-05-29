import * as React from 'react';
import { default as ReactBootstrap, Grid, Row, Col, Label} from 'react-bootstrap';

import './patientSimple.scss';

export default class PatientViewPageSimple extends React.Component<{}> {
    render() {
        return (
            <div className="flex-container">
                <div className="flex-row">
                    <div className="patient-header">
                        <i className="fa fa-user-circle-o patientIcon" aria-hidden="true"></i><br />
                        <div className="patient-text">P04, 22, Glioma, Male, DECEASED (61 months)</div>
                    </div>
                </div>
                <div className="flex-row">
                    <div className="line-in-middle">
                     &nbsp;
                    </div>
                </div>
                <div className="sample-info">
                    <div style={{display:"flex",width:"100%"}}>
                        <div style={{verticalAlgin:"middle",paddingBottom:10,alignSelf:"flex-start"}}>
                            <svg width="20" height="20" className="case-label-header">
                                <g transform="translate(10,10)">
                                    <circle r="10" fill="black" fill-opacity="1">
                                    </circle>
                                    <text x="-5" y="5" text-anchor="middle" fontSize="15" fill="white">1</text>
                                </g>
                            </svg>
                            <span style={{position:"relative",paddingLeft: 10, top:-5}}>P04_Pri, Primary (Astrocytoma)</span>
                        </div>
                    </div>
                    <div className="flex-row sample-info-record">
                        <div className='sample-info-card'>
                            <div className='sample-info-card-title extra-text-header'>Mutations</div>
                            <div className='sample-info-card-number'><div>25</div></div>
                            <div className='sample-info-card-extra-info extra-text'><div className="extra-info-drivers extra-text">1 driver</div><div className="extra-info-passengers extra-text">total</div></div>
                        </div>
                        <div className='sample-info-card'>
                            <div className='sample-info-card-title extra-text-header'>Copy number</div>
                            <div className='sample-info-card-number'><div>5</div></div>
                            <div className='sample-info-card-extra-info extra-text'><div className="extra-info-drivers extra-text">1</div><div className="extra-info-passengers extra-text">0</div></div>
                        </div>
                        <div className='sample-info-card'>
                            <div className='sample-info-card-title extra-text-header'>Rearrangements</div>
                            <div className='sample-info-card-number'><div>0</div></div>
                            <div className='sample-info-card-extra-info extra-text'><div className="extra-info-drivers"></div><div className="extra-info-passengers extra-text">&nbsp;</div></div>
                        </div>
                    </div>
                    <div className="flex-row sample-info-record sample-info-record-drugs">
                        <div className='sample-info-card sample-info-drugs'>
                            <div className='sample-info-card-title extra-text-header'>Drug info</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /*
    render() {
        return (
            <Grid>
                <div className="patient-info">
                    <Row>
                        <Col className="patient-info-record" xsOffset={3} xs={6} md={6}>
                            <div className="patient-icon-aligner">
                                <i className="fa fa-user-circle-o patientIcon" aria-hidden="true"></i><br />
                            </div>
                            <div className="patient-text">P04, 22, Glioma, Male, DECEASED (61 months)</div>
                        </Col>
                    </Row>
                </div>
                <div className="line-in-middle"></div>
                <div className="sample-info-record">
                    <Row className="patient-icon-row">
                        <svg width="70" height="70" className="case-label-header">
                            <g transform="translate(35,35)">
                                <circle r="35" fill="black" fill-opacity="1">
                                </circle>
                                <text x="-10" y="10" text-anchor="middle" fontSize="35" fill="white">1</text>
                            </g>
                        </svg>
                    </Row>
                    <Row className="sample-header">
                        <Col xs={12} md={12}>
                            <div className="sample-text">P04_Pri, Primary, Astrocytoma</div>
                        </Col>
                    </Row>
                    <Row>
                        <Col className="sample-info-card" xsOffset={1} xs={2} md={2}>
                        <h4>Mutations</h4>
                        <div className="count">12</div>
                        </Col>
                        <Col className="sample-info-card" xsOffset={1} xs={2} md={2}>
                        <h4>Copy Number</h4>
                        <div className="count">5</div>
                        </Col>
                        <Col className="sample-info-card" xsOffset={1} xs={2} md={2}>
                        <h4>Rearrangements</h4>
                        <div className="count">0</div>
                        </Col>
                    </Row>
                    <Row className="actionable-section">
                        <Col className="sample-info-card" xsOffset={1} xs={10} md={10}>
                        Oncokb stuff
                        </Col>
                    </Row>
                </div>
            </Grid>
        );
    }
    */
}