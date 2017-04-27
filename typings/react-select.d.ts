declare module 'react-select'
{
	export type ReactSelectOption<T> = {label: React.ReactChild, value: T};

	export interface MenuRendererProps<T>
	{
		focusedOption: ReactSelectOption<T>,
		instancePrefix: string,
		onFocus: OptionComponentProps<T>['onFocus'],
		onSelect: OptionComponentProps<T>['onSelect'],
		optionClassName: ReactSelectProps<T>['optionClassName'],
		optionComponent: ReactSelectProps<T>['optionComponent'],
		optionRenderer: ReactSelectProps<T>['optionRenderer'],
		options: ReactSelectOption<T>[],
		valueArray: ReactSelectOption<T>[],
		valueKey: ReactSelectProps<T>['valueKey'],
		onOptionRef: (ref:HTMLElement, isFocused:boolean) => void
	}

	export interface OptionComponentProps<T>
	{
		children?: React.ReactNode,
		className?: string,             // className (based on mouse position)
		instancePrefix: string,         // unique prefix for the ids (used for aria)
		isDisabled?: boolean,           // the option is disabled
		isFocused?: boolean,            // the option is focused
		isSelected?: boolean,           // the option is selected
		onFocus?: React.MouseEventHandler<HTMLElement>, // method to handle mouseEnter on option element
		onSelect?: (option:T, event:React.MouseEvent<HTMLElement>) => void, // method to handle click on option element
		onUnfocus?: React.MouseEventHandler<HTMLElement>, // method to handle mouseLeave on option element
		option: ReactSelectOption<T>,   // object that is base for that option
		optionIndex: number,            // index of the option, used to generate unique ids for aria
	}

	export interface ValueComponentProps<T>
	{
		id?: string;
		instancePrefix?: string;
		disabled?: boolean;
		onClick?: React.MouseEventHandler<HTMLElement>;
		onRemove?: (value:T) => void;
	}

	export interface ArrowProps
	{
		onMouseDown: React.MouseEventHandler<HTMLElement>,
		isOpen: boolean,
	}

	type ComponentRenderer<P> = React.ComponentClass<P> | React.StatelessComponent<P>;

	export interface ReactSelectProps<T>
	{
		addLabelText?: string,       // placeholder displayed when you want to add a label on a multi-value input
		'aria-label'?: string,       // Aria label (for assistive tech)
		'aria-labelledby'?: string,  // HTML ID of an element that should be used as the label (for assistive tech)
		arrowRenderer?: ComponentRenderer<ArrowProps>,        // Create drop-down caret element
		autoBlur?: boolean,          // automatically blur the component when an option is selected
		autofocus?: boolean,         // autofocus the component on mount
		autosize?: boolean,          // whether to enable autosizing or not
		backspaceRemoves?: boolean,  // whether backspace removes an item if there is no text input
		backspaceToRemoveMessage?: string,  // Message to use for screenreaders to press backspace to remove the current item - {label} is replaced with the item label
		className?: string,          // className for the outer element
		clearAllText?: React.ReactNode, // title for the "clear" control when multi: true
		clearRenderer?: () => React.ReactNode, // create clearable x element
		clearValueText?: React.ReactNode, // title for the "clear" control
		clearable?: boolean,         // should it be possible to reset value
		deleteRemoves?: boolean,     // whether backspace removes an item if there is no text input
		delimiter?: string,          // delimiter to use to join multiple values for the hidden field value
		disabled?: boolean,          // whether the Select is disabled or not
		escapeClearsValue?: boolean, // whether escape clears the value when the menu is closed
		filterOption?: (option:ReactSelectOption<T>, filterString:string) => boolean, // method to filter a single option (option, filterString)
		filterOptions?: any,         // boolean to enable default filtering or function to filter the options array ([options], filterString, [values])
		ignoreAccents?: boolean,     // whether to strip diacritics when filtering
		ignoreCase?: boolean,        // whether to perform case-insensitive filtering
		inputProps?: object,         // custom attributes for the Input
		inputRenderer?: ComponentRenderer<React.HTMLProps<HTMLInputElement>>, // returns a custom input component
		instanceId?: string,         // set the components instanceId
		isLoading?: boolean,         // whether the Select is loading externally or not (such as options being loaded)
		joinValues?: boolean,        // joins multiple values into a single form field with the delimiter (legacy mode)
		labelKey?: string,           // path of the label value in option objects
		matchPos?: string,           // (any|start) match the start or entire string when filtering
		matchProp?: string,          // (any|label|value) which option property to filter on
		menuBuffer?: number,         // optional buffer (in px) between the bottom of the viewport and the bottom of the menu
		menuContainerStyle?: object, // optional style to apply to the menu container
		menuRenderer?: ComponentRenderer<MenuRendererProps<T>>, // renders a custom menu with options
		menuStyle?: object,          // optional style to apply to the menu
		multi?: boolean,             // multi-value input
		name?: string,               // generates a hidden <input /> tag with this field name for html forms
		noResultsText?: React.ReactNode, // placeholder displayed when there are no matching search results
		onBlur?: React.FocusEventHandler<HTMLElement>,               // onBlur handler: function (event) {}
		onBlurResetsInput?: boolean, // whether input is cleared on blur
		onChange?: (option: ReactSelectOption<T> | null) => void, // onChange handler: function (newValue) {}
		onClose?: () => void,              // fires when the menu is closed
		onCloseResetsInput?: boolean, // whether input is cleared when menu is closed through the arrow
		onFocus?: React.FocusEventHandler<HTMLInputElement>, // onFocus handler: function (event) {}
		onInputChange?: (inputValue:string) => void, // onInputChange handler: function (inputValue) {}
		onInputKeyDown?: React.KeyboardEventHandler<HTMLInputElement>,       // input keyDown handler: function (event) {}
		onMenuScrollToBottom?: () => void, // fires when the menu is scrolled to the bottom; can be used to paginate options
		onOpen?: () => void,         // fires when the menu is opened
		onValueClick?: React.MouseEventHandler<HTMLElement>, // onClick handler for value labels: function (value, event) {}
		openAfterFocus?: boolean,    // boolean to enable opening dropdown when focused
		openOnFocus?: boolean,       // always open options menu on focus
		optionClassName?: string,    // additional class(es) to apply to the <Option /> elements
		optionComponent?: ComponentRenderer<OptionComponentProps<T>>, // option component to render in dropdown
		optionRenderer?: (option:ReactSelectOption<T>, i:number) => React.ReactNode, // optionRenderer: function (option) {}
		options?: ReactSelectOption<T>[], // array of options
		pageSize?: number,           // number of entries to page when using page up/down keys
		placeholder?: React.ReactNode, // field placeholder, displayed when there's no value
		required?: boolean,          // applies HTML5 required attribute when needed
		resetValue?: any,            // value to use when you clear the control
		scrollMenuIntoView?: boolean, // boolean to enable the viewport to shift so that the full menu fully visible when engaged
		searchable?: boolean,        // whether to enable searching feature or not
		simpleValue?: boolean,       // pass the value to onChange as a simple value (legacy pre 1.0 mode), defaults to false
		style?: object,              // optional style to apply to the control
		tabIndex?: string,           // optional tab index of the control
		tabSelectsValue?: boolean,   // whether to treat tabbing out while focused to be value selection
		value?: T,                 // initial field value
		valueComponent?: ComponentRenderer<ValueComponentProps<T>>, // value component to render
		valueKey?: string,           // path of the label value in option objects
		valueRenderer?: (option:ReactSelectOption<T>, i:number) => React.ReactNode, // valueRenderer: function (option) {}
		wrapperStyle?: object,       // optional style to apply to the component wrapper
	}

	export interface ReactSelectCreatableProps<T> extends ReactSelectProps<T>
	{
		promptTextCreator?: (label: string) => string;
	}

	export default class ReactSelect extends React.Component<ReactSelectProps<any>, {}> { }
}
