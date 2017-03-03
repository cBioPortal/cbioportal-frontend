declare module 'react-select'
{
	export type ReactSelectOption = {label: string, value: any};

    export interface ReactSelectProps<T>
    {
    	className?: string;
		value?: T;
		options: ReactSelectOption[];
		onChange?: (option: ReactSelectOption | null) => void;
		autofocus?: boolean;
		autosize?: boolean;
		promptTextCreator?: (label: string) => string;
		placeholder?: string;
		noResultsText?: boolean;
		onCloseResetsInput?: boolean;
		onInputChange?: (searchText: string) => void;
    }

    export default class ReactSelect extends React.Component<ReactSelectProps<any>, {}> { }
}
