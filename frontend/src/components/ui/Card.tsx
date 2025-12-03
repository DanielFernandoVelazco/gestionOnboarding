import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, title, subtitle, actions, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={twMerge(
                    clsx(
                        'rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4 shadow-sm',
                        className
                    )
                )}
                {...props}
            >
                {(title || subtitle || actions) && (
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            {title && (
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {title}
                                </h3>
                            )}
                            {subtitle && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                        {actions && <div className="flex items-center gap-2">{actions}</div>}
                    </div>
                )}
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

export default Card;