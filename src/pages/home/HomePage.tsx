import * as React from "react";

interface HomePageProps
{
}

interface HomePageState
{
}

export default class HomePage extends React.Component<HomePageProps, HomePageState>
{
	render()
	{
		let x = 3;
		x += 4;
		console.log(x);
		x += 4;
		console.log(x);
		return <div>Hello TypeScript1</div>;
	}
};
