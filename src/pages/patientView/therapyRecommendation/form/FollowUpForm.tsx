import * as React from 'react';
import * as _ from 'lodash';
import { Modal, Button } from 'react-bootstrap';
import { ITherapyRecommendation, IMtb, MtbState } from 'cbioportal-utils';
import Select from 'react-select';

interface IFollowUpFormProps {
    show: boolean;
    patientID: string;
    title: string;
    userEmailAddress: string;
    mtbs: IMtb[];
    onHide: (
        newTherapyRecommendation?:
            | ITherapyRecommendation
            | ITherapyRecommendation[]
    ) => void;
}

class FollowUpForm extends React.Component<IFollowUpFormProps, {}> {
    public render() {
        let selectedTherapyRecommendation: ITherapyRecommendation;
        const groupStyles = {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 18,
        };
        const groupBadgeStyles = {
            backgroundColor: '#EBECF0',
            borderRadius: '2em',
            color: '#172B4D',
            display: 'inline-block',
            fontSize: 12,
            lineHeight: '1',
            minWidth: 1,
            padding: '0.16666666666667em 0.5em',
        };
        return (
            <Modal
                show={this.props.show}
                onHide={() => {
                    this.props.onHide(undefined);
                }}
                backdrop={'static'}
            >
                <Modal.Header closeButton>
                    <Modal.Title>{this.props.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form className="form">
                        <div className="form-group">
                            <h5>Select therapy recommendation:</h5>
                            <Select
                                options={this.props.mtbs
                                    // .filter(mtb => mtb.mtbState.valueOf() == "FINAL" ? true : false)
                                    .map(mtb => {
                                        let d = new Date(mtb.date);
                                        let dateString =
                                            ('0' + d.getDate()).slice(-2) +
                                            '.' +
                                            ('0' + (d.getMonth() + 1)).slice(
                                                -2
                                            ) +
                                            '.' +
                                            d.getFullYear();
                                        return {
                                            label: 'MTB' + ' ' + dateString,
                                            options: mtb.therapyRecommendations.map(
                                                (
                                                    therapyRecommendation,
                                                    therapyRecommendationIndex
                                                ) => ({
                                                    label: therapyRecommendation
                                                        .treatments.length
                                                        ? therapyRecommendation.treatments.map(
                                                              treatment =>
                                                                  treatment.name
                                                          )
                                                        : 'No treatment specified',
                                                    value: {
                                                        mtb,
                                                        therapyRecommendation,
                                                    },
                                                })
                                            ),
                                        };
                                    })}
                                name="therapyRecommendationSelect"
                                className="basic-select"
                                classNamePrefix="select"
                                onChange={(selectedOption: {
                                    label: string;
                                    value: {
                                        mtb: IMtb;
                                        therapyRecommendation: ITherapyRecommendation;
                                    };
                                }) => {
                                    let therapyRecommendation =
                                        selectedOption.value
                                            .therapyRecommendation;
                                    console.log(selectedOption);
                                    selectedTherapyRecommendation = therapyRecommendation;
                                }}
                                formatGroupLabel={(data: any) => (
                                    <div
                                        style={groupStyles}
                                        // onClick={(e: any) => {
                                        //     e.stopPropagation();
                                        //     e.preventDefault();
                                        //     console.log('Group heading clicked', data);
                                        // }}
                                    >
                                        <span>{data.label}</span>
                                        <span style={groupBadgeStyles}>
                                            {data.options.length}
                                        </span>
                                    </div>
                                )}
                            />
                        </div>
                    </form>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        type="button"
                        bsStyle="default"
                        onClick={() => {
                            this.props.onHide(undefined);
                        }}
                    >
                        Dismiss
                    </Button>
                    <Button
                        type="button"
                        bsStyle="primary"
                        onClick={() => {
                            this.props.onHide(selectedTherapyRecommendation);
                        }}
                    >
                        Select therapy recommendation
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

export default FollowUpForm;
