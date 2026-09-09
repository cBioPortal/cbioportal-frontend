'use client';

import { useState, FC } from 'react';
import { useComposerAddAttachment } from '@assistant-ui/core/react';
import { FrameIcon, LoaderIcon } from 'lucide-react';
import { TooltipIconButton } from '@/components/assistant-ui/elements/tooltip-icon-button';
import { requestScreenshot } from '@/lib/screenshot';

// Captures the current cBioPortal view (host page, not this iframe) and adds
// it as a pending attachment — the user still has to hit Send.
export const ScreenshotButton: FC = () => {
    const { addAttachment, disabled } = useComposerAddAttachment();
    const [capturing, setCapturing] = useState(false);

    const onClick = async () => {
        if (capturing) return;
        setCapturing(true);
        try {
            const dataUrl = await requestScreenshot();
            if (!dataUrl) return;
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], 'screenshot.png', {
                type: 'image/png',
            });
            await addAttachment(file);
        } finally {
            setCapturing(false);
        }
    };

    if (disabled) return null;

    return (
        <TooltipIconButton
            tooltip="Screenshot current view"
            side="bottom"
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground size-7 rounded-full"
            aria-label="Screenshot current view"
            onClick={onClick}
            disabled={capturing}
        >
            {capturing ? (
                <LoaderIcon className="size-4 animate-spin" />
            ) : (
                <FrameIcon className="size-4" />
            )}
        </TooltipIconButton>
    );
};
