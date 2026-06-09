import * as React from 'react';
import { fireEvent, render } from '@testing-library/react';
import FilterIconModal from './FilterIconModal';

describe('FilterIconModal', () => {
    it('exposes class hooks for hover/open filter visibility', () => {
        const { container } = render(
            <table>
                <thead>
                    <tr>
                        <th className="multilineHeader">
                            <FilterIconModal
                                id="Sample ID"
                                filterIsActive={true}
                                deactivateFilter={() => undefined}
                                setupFilter={() => undefined}
                                menuComponent={<div>Filter menu</div>}
                            />
                        </th>
                    </tr>
                </thead>
            </table>
        );

        const filterIcon = container.querySelector(
            '.headerFilterIcon'
        ) as HTMLElement;

        expect(filterIcon.className).toContain('active');
        expect(filterIcon.style.visibility).toBe('');

        fireEvent.click(filterIcon);

        expect(filterIcon.className).toContain('open');
    });
});
