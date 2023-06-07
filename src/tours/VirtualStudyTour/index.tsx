import React from 'react';
import getSteps, { virtualStudyId } from './steps';
import Tour from 'tours/Tour';

type VirtualStudyTourProps = {
    isLoggedIn?: boolean;
    hideEntry?: boolean;
    startAt?: number;
    studies?: number;
};

export { virtualStudyId };
export default function VirtualStudyTour({
    isLoggedIn = false,
    hideEntry = false,
    studies = 0,
    startAt = 0,
}: VirtualStudyTourProps) {
    return (
        <Tour
            title="Create a Virtual Study"
            studies={studies}
            startAt={startAt}
            hideEntry={hideEntry}
            isLoggedIn={isLoggedIn}
            localStorageId={virtualStudyId}
            getSteps={getSteps}
        />
    );
}
