import * as React from 'react';
import IMutationColumnFormatterProps from './MutationColumnFormatterProps';

export default class GeneColumnFormatter extends React.Component<IMutationColumnFormatterProps, {}>
{
    constructor(props:IMutationColumnFormatterProps)
    {
        super(props);
        this.state = {};
    }

    public render()
    {
        const {data} = this.props;

        return (
            <span>{data.gene.hugoGeneSymbol}</span>
        );
    }
}
