export const mockData = {
    patient: {
        'clinicalData': [
            {
                'id': 'PROSPECTIVE_COLLECTION',
                'name': 'Tissue Prospective Collection Indicator',
                'description': 'Text indicator for the time frame of tissue procurement, indicating that the tissue was procured in parallel to the project.',
                'priority': 1,
                'dataType': 'STRING',
                'patientAttribute': true,
                'value': 'YES',
            },
            {
                'id': 'RETROSPECTIVE_COLLECTION',
                'name': 'Tissue Retrospective Collection Indicator',
                'description': 'Text indicator for the time frame of tissue procurement, indicating that the tissue was obtained and stored prior to the initiation of the project.',
                'priority': 1,
                'dataType': 'STRING',
                'patientAttribute': true,
                'value': 'NO',
            },
        ],
    },
    samples: [
        {
            'id': 'TCGA-P6-A5OH-01',
            'type': 'Recurrent Solid Tumor',
            'cancerTypeId': 'acc',
            'clinicalData': [
                {
                    'id': 'OTHER_SAMPLE_ID',
                    'name': 'Other Sample ID',
                    'description': 'Legacy DMP sample identifier (DMPnnnn)',
                    'priority': 1,
                    'dataType': 'STRING',
                    'patientAttribute': false,
                    'value': '5C631CE8-F96A-4C35-A459-556FC4AB21E1',
                },
                {
                    'id': 'DAYS_TO_COLLECTION',
                    'name': 'Days to Sample Collection.',
                    'description': 'Days to sample collection.',
                    'priority': 1,
                    'dataType': 'STRING',
                    'patientAttribute': false,
                    'value': 276,
                },
            ],
        },
        {
            'id': 'TCGA-OR-A5LI-01',
            'type': 'Primary Solid Tumor',
            'cancerTypeId': 'blca',
            'clinicalData': [
                {
                    'id': 'IS_FFPE',
                    'name': 'Is FFPE',
                    'description': 'If the sample is from FFPE',
                    'priority': 1,
                    'dataType': 'STRING',
                    'patientAttribute': false,
                    'value': 'NO',
                },
                {
                    'id': 'DAYS_TO_COLLECTION',
                    'name': 'Days to Sample Collection.',
                    'description': 'Days to sample collection.',
                    'priority': 1,
                    'dataType': 'STRING',
                    'patientAttribute': false,
                    'value': 312,
                },
                {
                    'id': 'OCT_EMBEDDED',
                    'name': 'Oct embedded',
                    'description': 'Oct embedded',
                    'priority': 1,
                    'dataType': 'STRING',
                    'patientAttribute': false,
                    'value': false,
                },
            ],
        },
    ],
    nodes: {
        'name': 'Top Node',
        'label': '1',
        'children': [
            {
                'name': 'Bob: Child of Top Node',
                'label': '1.1',
                'parent': 'Top Node',
                'children': [
                    {
                        'name': 'Sonn of Bob',
                        'label': '1.1.1',
                        'parent': 'Bob: Child of Top Node',
                    },
                    {
                        'name': 'Daughter of Bob',
                        'label': '1.1.2',
                        'parent': 'Bob: Child of Top Node',
                    },
                ],
            },
            {
                'name': 'Sally: Child of Top Node',
                'label': '1.2',
                'parent': 'Top Node',
                'children': [
                    {
                        'name': 'Son of Sally',
                        'label': '1.2.1',
                        'parent': 'Sally: Child of Top Node',
                    },
                    {
                        'name': 'Daughter of Sally',
                        'label': '1.2.2',
                        'parent': 'Sally: Child of Top Node',
                    },
                    {
                        'name': 'Daughter of Sally',
                        'label': '1.2.2',
                        'parent': 'Sally: Child of Top Node',
                    },
                    {
                        'name': 'Daughter #2 of Sally',
                        'label': '1.2.3',
                        'parent': 'Sally: Child of Top Node',
                        'children': [
                            {
                                'name': 'Daughter of Daughter #2 of Sally',
                                'label': '1.2.3.1',
                                'parent': 'Daughter #2 of Sally',
                            },
                        ],
                    },
                ],
            },
            {
                'name': 'Dirk: Child of Top Node',
                'label': '1.3',
                'parent': 'Top Node',
                'children': [
                    {
                        'name': 'Son of Dirk',
                        'label': '1.3.1',
                        'parent': 'Dirk: Child of Top Node',
                    },
                ],
            },
        ],
    },
};
