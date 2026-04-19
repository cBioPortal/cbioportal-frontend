import * as React from 'react';
import { Button, Result } from 'antd';
import { Link } from 'react-router-dom';

interface DatasetErrorProps {
    error: string;
    url: string;
    onRetry: () => void;
    showHomeLink?: boolean;
}

export function DatasetError({
    error,
    url,
    onRetry,
    showHomeLink = true,
}: DatasetErrorProps) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: '#fff',
            }}
        >
            <Result
                status="error"
                title="Failed to load dataset"
                subTitle={error}
                extra={[
                    <Button key="retry" type="primary" onClick={onRetry}>
                        Retry
                    </Button>,
                    showHomeLink && (
                        <Link key="home" to="/">
                            <Button>Go to home page</Button>
                        </Link>
                    ),
                ]}
            >
                <div style={{ textAlign: 'center' }}>
                    <code>{url}</code>
                </div>
            </Result>
        </div>
    );
}
