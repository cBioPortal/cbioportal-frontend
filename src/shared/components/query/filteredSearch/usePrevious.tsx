import { useEffect, useRef } from 'react';

/**
 * Hook to access previous value of state
 * Source: https://usehooks.com/usePrevious/
 */
export function usePrevious(value: any) {
    const ref = useRef();
    useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref.current;
}
