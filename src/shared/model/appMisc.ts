export class SiteError {
    constructor(
        public errorObj: any,
        public displayType: 'alert' | 'site' = 'site',
        public title?: string
    ) {}
}
