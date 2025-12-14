"use client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface DataTableProps<T> {
    columns: { header: string; accessorKey: keyof T | ((item: T) => React.ReactNode); className?: string }[];
    data: T[];
    actions?: (item: T) => React.ReactNode;
}

export function DataTable<T extends { id: string | number }>({ columns, data, actions }: DataTableProps<T>) {
    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((col, i) => (
                            <TableHead key={i} className={col.className}>{col.header}</TableHead>
                        ))}
                        {actions && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data && data.length > 0 ? (
                        data.map((item) => (
                            <TableRow key={item.id}>
                                {columns.map((col, i) => (
                                    <TableCell key={i} className={col.className}>
                                        {typeof col.accessorKey === 'function' ? col.accessorKey(item) : (item[col.accessorKey] as any)}
                                    </TableCell>
                                ))}
                                {actions && <TableCell className="text-right">{actions(item)}</TableCell>}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                                No results found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
