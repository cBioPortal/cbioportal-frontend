/*
 * Copyright (c) 2016 Memorial Sloan-Kettering Cancer Center.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

export type OMath = Math & { log2: (x: number) => number };
export const OMath: OMath = Math as any;

OMath.log2 =
    OMath.log2 ||
    function(x: number) {
        return Math.log(x) / Math.LN2;
    };
