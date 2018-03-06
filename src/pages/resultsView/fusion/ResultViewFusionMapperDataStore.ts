/**
 * Copyright (c) 2018 The Hyve B.V.
 * This code is licensed under the GNU Affero General Public License (AGPL),
 * version 3, or (at your option) any later version.
 *
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 **/

import * as _ from 'lodash';
import { StructuralVariant } from "../../../shared/api/generated/CBioPortalAPI";
import { action, observable, computed } from "mobx";
import Immutable from "seamless-immutable";
import { SimpleLazyMobXTableApplicationDataStore } from '../../../shared/lib/ILazyMobXTableApplicationDataStore';

type PositionAttr = { [position: string]: boolean };
type ImmutablePositionAttr = PositionAttr & Immutable.ImmutableObject<PositionAttr>;

export default class FusionMapperDataStore extends SimpleLazyMobXTableApplicationDataStore<StructuralVariant[]> {
    @observable.ref private selectedPositions: ImmutablePositionAttr;
    @observable.ref private highlightedPositions: ImmutablePositionAttr;

    @action
    public setPositionSelected(position: number, newVal: boolean) {
        const toMerge: PositionAttr = {};
        toMerge[position + ""] = newVal;
        this.selectedPositions = this.selectedPositions.merge(toMerge) as ImmutablePositionAttr;
    }

    @action
    public setPositionHighlighted(position: number, newVal: boolean) {
        const toMerge: PositionAttr = {};
        toMerge[position + ""] = newVal;
        this.highlightedPositions = this.highlightedPositions.merge(toMerge) as ImmutablePositionAttr;
    }

    @action
    public clearSelectedPositions() {
        if (!_.isEmpty(this.selectedPositions)) {
            this.selectedPositions = Immutable.from<PositionAttr>({});
        }
    }

    @action
    public clearHighlightedPositions() {
        if (!_.isEmpty(this.highlightedPositions)) {
            this.highlightedPositions = Immutable.from<PositionAttr>({});
        }
    }

    public isPositionSelected(position: number) {
        return !!this.selectedPositions[position + ""];
    }

    public isPositionHighlighted(position: number) {
        return !!this.highlightedPositions[position + ""];
    }

    @action
    public resetFilterAndSelection() {
        super.resetFilter();
        this.clearSelectedPositions();
    }

    constructor(data: StructuralVariant[][]) {
        super(data);
        this.selectedPositions = Immutable.from<PositionAttr>({});
        this.highlightedPositions = Immutable.from<PositionAttr>({});
    }
}
