import { assert } from 'chai';
import * as React from 'react';
import "./globalComponents";

describe('globalComponents', ()=>{
    it('should expose a function called addGenesAndSubmitQuery to the window, for use by the cbioportal main project', ()=>{
        assert.equal(typeof (window as any).addGenesAndSubmitQuery, "function");
    });
});