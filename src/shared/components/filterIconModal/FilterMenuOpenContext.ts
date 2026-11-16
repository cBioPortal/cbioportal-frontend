import * as React from 'react';

// whether the filter menu is open; menus stay mounted while closed, so they can
// skip expensive work (e.g. value counts) until they are shown
export const FilterMenuOpenContext = React.createContext<boolean>(true);
