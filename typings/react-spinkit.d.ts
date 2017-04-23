declare module 'react-spinkit'
{
    interface SpinnerProps
    {
        spinnerName?: string;
        style?: React.CSSProperties
        noFadeIn?: boolean;
    }

    export default class Spinner extends React.Component<SpinnerProps, {}> { }
}
