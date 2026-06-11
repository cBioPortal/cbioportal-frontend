import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import LoadingIndicator from './LoadingIndicator';

/**
 * `LoadingIndicator` renders an animated spinner while async work is in
 * progress and nothing when `isLoading` is false.  It is used across the app
 * wherever data is being fetched from the backend or computed asynchronously.
 */
const meta: Meta<typeof LoadingIndicator> = {
    title: 'Shared/LoadingIndicator',
    component: LoadingIndicator,
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['small', 'big'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof LoadingIndicator>;

/** The default small spinner — used inline next to data that is loading. */
export const Small: Story = {
    args: {
        isLoading: true,
        size: 'small',
    },
};

/** Large, centred spinner — used for full-page or panel-level loading states. */
export const Big: Story = {
    args: {
        isLoading: true,
        size: 'big',
        center: true,
    },
};

/** A message can be shown below the spinner to explain what is loading. */
export const WithMessage: Story = {
    render: args => (
        <LoadingIndicator {...args}>Loading study data…</LoadingIndicator>
    ),
    args: {
        isLoading: true,
        size: 'big',
    },
};

/**
 * When `isLoading` is false the component renders nothing at all.
 * This story documents that expected behaviour explicitly.
 */
export const NotLoading: Story = {
    name: 'Renders nothing when not loading',
    args: {
        isLoading: false,
    },
};
