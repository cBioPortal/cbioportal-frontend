import * as React from 'react';
import QueryContainer from "../../shared/components/query2/QueryContainer";
import * as styles_any from './styles.module.scss';

function getRootElement()
{
	for (let node of document.childNodes)
		if (node instanceof HTMLElement)
			return node;
	throw new Error("No HTMLElement found");
}

const styles = styles_any as {
	rootHtml: string,
};

interface IHomePageProps
{
}

export default class HomePage extends React.Component<IHomePageProps, {}>
{
    constructor(props:IHomePageProps)
    {
        super(props);
    }

    componentDidMount()
    {
		getRootElement().className += ' ' + styles.rootHtml
    }

    componentWillUnmount()
	{
		getRootElement().className = getRootElement().className.split(styles.rootHtml).join('');
	}

    public render()
    {
        return (
       		<QueryContainer/>
		);
    }
}
