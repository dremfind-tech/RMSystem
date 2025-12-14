"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabaseClient"
import { DataTable } from "@/components/DataTable"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

interface OrderListProps {
    type: 'recent' | 'history'
}

export function OrderList({ type }: OrderListProps) {
    const [orders, setOrders] = useState<any[]>([])
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
    const [open, setOpen] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        fetchOrders()
    }, [type])

    const fetchOrders = async () => {
        let query = supabase
            .from('orders')
            // Fetch order items and connected menu item details
            // Note: This relies on Supabase foreign keys existing. 
            // specific syntax: order_items ( *, menu_items ( name ) )
            .select('*, order_items(*, menu_items(name))')
            .order('created_at', { ascending: false })

        if (type === 'recent') {
            // Recent = Not served or cancelled
            query = query.not('status', 'in', '("SERVED","CANCELLED")')
        }
        // For history, we show everything.

        const { data, error } = await query
        if (error) {
            console.error("Error fetching orders:", error)
        } else {
            setOrders(data || [])
        }
    }

    const getStatusColor = (status: string) => {
        const s = status?.toLowerCase() || '';
        switch (s) {
            case 'created': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'cooking': return 'bg-orange-100 text-orange-800 border-orange-200'
            case 'ready': return 'bg-green-100 text-green-800 border-green-200'
            case 'served': return 'bg-neutral-100 text-neutral-800 border-neutral-200'
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
            default: return 'bg-neutral-100 text-neutral-800 border-neutral-200'
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">
                    {type === 'recent' ? 'Recent Orders' : 'Order History'}
                </h2>
            </div>

            <DataTable
                columns={[
                    { header: "Order ID", accessorKey: (item) => `#${item.id}` },
                    { header: "Date", accessorKey: (item) => format(new Date(item.created_at), "MMM d, h:mm a") },
                    { header: "Total", accessorKey: (item) => `$${Number(item.total_amount).toFixed(2)}` },
                    {
                        header: "Status", accessorKey: (item) => (
                            <Badge className={getStatusColor(item.status)} variant="outline">
                                {item.status.toUpperCase()}
                            </Badge>
                        )
                    },
                ]}
                data={orders}
                actions={(item) => (
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedOrder(item); setOpen(true); }}>
                        <Eye className="h-4 w-4" />
                    </Button>
                )}
            />

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Order #{selectedOrder?.id}</DialogTitle>
                        <DialogDescription>
                            Placed on {selectedOrder && format(new Date(selectedOrder.created_at), "PPP p")}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold">Status:</span>
                            <Badge className={selectedOrder ? getStatusColor(selectedOrder.status) : ''}>
                                {selectedOrder?.status.toUpperCase()}
                            </Badge>
                        </div>

                        <Separator />

                        <ScrollArea className="h-[300px] w-full pr-4">
                            <div className="space-y-4">
                                <h3 className="font-semibold">Items</h3>
                                {selectedOrder?.order_items?.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{item.menu_items?.name || 'Unknown Item'}</span>
                                            <span className="text-muted-foreground">Qty: {item.quantity}</span>
                                        </div>
                                        {/* Assuming price is stored in order_items for snapshot, or we use current price from menu_items. 
                                Typically orders store the price at time of purchase. 
                                I'll try to use item.price if exists, else 0 */}
                                        <span className="font-mono">${((Number(item.price) || 0) * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <Separator />

                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span className="font-mono">${Number(selectedOrder?.total_amount).toFixed(2)}</span>
                        </div>

                        <div className="space-y-2 pt-4">
                            <h3 className="font-semibold text-sm">Order Timeline</h3>
                            {/* Creating a visual timeline from status */}
                            <div className="flex flex-col gap-2 ml-2 border-l-2 border-muted pl-4">
                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary" />
                                    <p className="text-sm font-medium">Order Placed</p>
                                    <p className="text-xs text-muted-foreground">{selectedOrder && format(new Date(selectedOrder.created_at), "h:mm a")}</p>
                                </div>
                                {/* We can't know the exact time of status changes without a history log table. 
                        Just showing Current Status. */}
                                {selectedOrder?.status !== 'CREATED' && (
                                    <div className="relative mt-2">
                                        <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full ${['cancelled'].includes(selectedOrder?.status) ? 'bg-destructive' : 'bg-primary'}`} />
                                        <p className="text-sm font-medium">Current Status: {selectedOrder?.status.toUpperCase()}</p>
                                        <p className="text-xs text-muted-foreground">Now</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
