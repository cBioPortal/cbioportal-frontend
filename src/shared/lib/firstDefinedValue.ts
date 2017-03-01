export default function firstDefinedValue<T1,T2>(v1:T1|undefined, v2:T2):T1|T2;
export default function firstDefinedValue<T1,T2,T3>(v1:T1|undefined, v2:T2|undefined, v3:T3):T1|T2|T3;
export default function firstDefinedValue<T1,T2,T3,T4>(v1:T1|undefined, v2:T2|undefined, v3:T3|undefined, v4:T4):T1|T2|T3|T4;
export default function firstDefinedValue(...values:any[])
{
	let value;
	for (value of values)
		if (value !== undefined)
			break;
	return value;
}
