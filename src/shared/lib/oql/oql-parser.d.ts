export declare class SyntaxError {
    constructor(
        message: string,
        expected: string,
        found: string,
        offset: number,
        line: number,
        column: number
    );

    message: string;
    expected: string;
    found: string;
    location: {
        start: { offset: number; line: number; column: number };
        end: { offset: number; line: number; column: number };
    };
    name: 'SyntaxError';
}

export declare function parse(str: string): OQLQuery | undefined;

export declare type AminoAcid =
    | 'G'
    | 'P'
    | 'A'
    | 'V'
    | 'L'
    | 'I'
    | 'M'
    | 'C'
    | 'F'
    | 'Y'
    | 'W'
    | 'H'
    | 'K'
    | 'R'
    | 'Q'
    | 'N'
    | 'E'
    | 'D'
    | 'S'
    | 'T';

export declare type OQLQuery = (SingleGeneQuery | MergedGeneQuery)[];

export declare type MergedGeneQuery = {
    label?: string;
    list: SingleGeneQuery[];
};
export declare type SingleGeneQuery = {
    gene: string;
    alterations: false | Alteration[];
};

export declare type Alteration =
    | AnyTypeWithModifiersCommand
    | CNACommand
    | EXPCommand
    | PROTCommand
    | FUSIONCommand
    | MUTCommand<Mutation>;

export declare type AnyTypeWithModifiersCommand = {
    alteration_type: 'any';
    modifiers: AnyModifier[];
};

export declare type CNAType = 'AMP' | 'DEEPDEL' | 'GAIN' | 'SHALLOWDEL';

export declare type CNACommand = {
    alteration_type: 'cna';
    constr_rel?: ComparisonOp | '=';
    constr_val?: CNAType;
    modifiers: CNAModifier[];
};

export declare type MUTCommand<M extends Mutation> =
    | {
          alteration_type: 'mut';
          constr_rel?: undefined;
          constr_type?: undefined;
          constr_val?: undefined;
          info: {};
          modifiers: M['modifiers'];
      }
    | {
          alteration_type: 'mut';
          constr_rel: '=' | '!=';
          constr_type: M['type'];
          constr_val: M['value'];
          info: M['info'];
          modifiers: M['modifiers'];
      };

export declare type EXPCommand = {
    alteration_type: 'exp';
    constr_rel: ComparisonOp;
    constr_val: number;
};

export declare type FUSIONCommand = {
    alteration_type: 'fusion';
    modifiers: FusionModifier[];
};

export declare type PROTCommand = {
    alteration_type: 'prot';
    constr_rel: ComparisonOp;
    constr_val: number;
};

export declare type ComparisonOp = '>=' | '<=' | '>' | '<';

export declare type MutationType =
    | 'MISSENSE'
    | 'NONSENSE'
    | 'NONSTART'
    | 'NONSTOP'
    | 'FRAMESHIFT'
    | 'INFRAME'
    | 'SPLICE'
    | 'TRUNC'
    | 'PROMOTER';

export declare type MutationModifier =
    | { type: 'GERMLINE' }
    | { type: 'SOMATIC' }
    | RangeModifier
    | DriverModifier;

export declare type CNAModifier = DriverModifier;

export declare type FusionModifier = DriverModifier;

export declare type AnyModifier = DriverModifier;

export declare type DriverModifier = { type: 'DRIVER' };

export declare type RangeModifier = {
    type: 'RANGE';
    completeOverlapOnly: boolean;
    start?: number;
    end?: number;
};

export declare type Mutation =
    | {
          type: 'class';
          value: MutationType;
          info: {};
          modifiers: MutationModifier[];
      }
    | {
          type: 'name';
          value: string;
          info: { unrecognized?: boolean };
          modifiers: MutationModifier[];
      }
    | {
          type: 'position';
          value: number;
          info: { amino_acid: AminoAcid };
          modifiers: MutationModifier[];
      };
