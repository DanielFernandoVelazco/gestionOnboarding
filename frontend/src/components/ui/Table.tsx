import clsx from 'clsx';
import React from 'react';

interface Column<T> {
    key: string;
    header: string;
    render?: (item: T) => React.ReactNode;
    className?: string;
}

interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    emptyMessage?: string;
    onRowClick?: (item: T) => void;
}

const Table = <T extends Record<string, any>>({
    columns,
    data,
    loading = false,
    emptyMessage = 'No hay datos disponibles',
    onRowClick,
}: TableProps<T>) => {
    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                <p>{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900/50">
                    {data.map((item, index) => (
                        <tr
                            key={index}
                            onClick={() => onRowClick?.(item)}
                            className={clsx(
                                'hover:bg-gray-50 dark:hover:bg-gray-800/20',
                                onRowClick && 'cursor-pointer'
                            )}
                        >
                            {columns.map((column) => (
                                <td
                                    key={`${index}-${column.key}`}
                                    className={clsx(
                                        'px-3 py-4 text-sm text-gray-500 dark:text-gray-400',
                                        column.className
                                    )}
                                >
                                    {column.render
                                        ? column.render(item)
                                        : item[column.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Table;