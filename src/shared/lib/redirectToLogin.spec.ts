const mockWindow = {
    location: { href: 'https://portal.example/patient?studyId=s#wsi:slide=1' },
    localStorage: { setItem: jest.fn() },
};

jest.mock('cbioportal-frontend-commons', () => ({
    ...jest.requireActual('cbioportal-frontend-commons'),
    getBrowserWindow: () => mockWindow,
}));

import { isRedirectingToLogin, redirectToLogin } from './redirectHelpers';

describe('redirectToLogin', () => {
    it('signs in once and comes back to the current page', () => {
        expect(isRedirectingToLogin()).toBe(false);

        redirectToLogin();

        expect(mockWindow.localStorage.setItem).toHaveBeenCalledWith(
            'login-redirect',
            'https://portal.example/patient?studyId=s#wsi:slide=1'
        );
        expect(mockWindow.location.href).toContain('spring-security-redirect=');
        expect(decodeURIComponent(mockWindow.location.href)).toContain(
            'restore?key=login-redirect'
        );
        expect(isRedirectingToLogin()).toBe(true);

        mockWindow.location.href = 'unchanged';
        redirectToLogin();
        expect(mockWindow.location.href).toBe('unchanged');
        expect(mockWindow.localStorage.setItem).toHaveBeenCalledTimes(1);
    });
});
