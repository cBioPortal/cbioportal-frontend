declare module "url-parse"
{
	export type ParsedQuery = {[key:string]: undefined | string | string[]};

	export interface ParsedUrl
	{
		protocol: string; //The protocol scheme of the URL (e.g. http:).
		slashes: string; //A boolean which indicates whether the protocol is followed by two forward slashes (//).
		auth: string; //Authentication information portion (e.g. username:password).
		username: string; //Username of basic authentication.
		password: string; //Password of basic authentication.
		host: string; //Host name with port number.
		hostname: string; //Host name without port number.
		port: string; //Optional port number.
		pathname: string; //URL path.
		query: string | ParsedQuery; //Parsed object containing query string, unless parsing is set to false.
		hash: string; //The "fragment" portion of the URL including the pound-sign (#).
		href: string; //The full URL.
		origin: string; //The origin of the URL.
	}

	function URL(url:string, parseQueryString:true):ParsedUrl & {query: ParsedQuery};
	function URL(url:string, parseQueryString?:false):ParsedUrl & {query: string};

	export default URL;
}
