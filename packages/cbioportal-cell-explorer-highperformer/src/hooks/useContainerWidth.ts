import { useLayoutEffect, useState } from 'react';

export function useContainerWidth(
    ref: React.RefObject<HTMLElement | null>,
    fallback = 260
): number {
    const [width, setWidth] = useState(fallback);
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ro = new ResizeObserver(entries => {
            const w = entries[0]?.contentRect.width;
            if (w && w > 0) setWidth(Math.floor(w));
        });
        ro.observe(el);
        const initial = el.getBoundingClientRect().width;
        if (initial > 0) setWidth(Math.floor(initial));
        return () => ro.disconnect();
    }, [ref]);
    return width;
}
