"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabaseClient"
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from "date-fns"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResponsiveContainer, XAxis, YAxis, Tooltip, Line, LineChart, CartesianGrid, Legend, BarChart, Bar } from "recharts"
import { DollarSign, ShoppingBag, Activity, Utensils } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Premium color palette for charts (using CSS variables or specific hexes)
const COLORS = [
    "hsl(var(--primary))",
    "#3b82f6",
    "#10b981",
    "#f59e0b"
];

export default function DashboardPage() {
    const [range, setRange] = useState("week")
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        revenue: 0,
        ordersCount: 0,
        avgOrderValue: 0
    })
    const [salesData, setSalesData] = useState<any[]>([])

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [range])

    const fetchData = async () => {
        setLoading(true)

        let start, end;
        const now = new Date();

        if (range === 'today') {
            start = startOfDay(now).toISOString();
            end = endOfDay(now).toISOString();
        } else if (range === 'week') {
            start = subDays(now, 7).toISOString();
            end = now.toISOString();
        } else if (range === 'month') {
            start = subDays(now, 30).toISOString();
            end = now.toISOString();
        }

        // Fetch Orders
        // Assuming table 'orders' with columns: total_amount, created_at, status
        const { data: orders, error } = await supabase
            .from('orders')
            .select('total_amount, created_at, status')
            .gte('created_at', start!)
            .lte('created_at', end!);

        if (error) {
            console.error("Error fetching orders", error)
            setLoading(false)
            return
        }

        if (!orders) {
            setStats({ revenue: 0, ordersCount: 0, avgOrderValue: 0 })
            setSalesData([])
            setLoading(false)
            return
        }

        // Aggregations
        const totalRev = orders.reduce((acc, order) => acc + (Number(order.total_amount) || 0), 0)
        const count = orders.length

        setStats({
            revenue: totalRev,
            ordersCount: count,
            avgOrderValue: count > 0 ? totalRev / count : 0
        })

        // Prepare Chart Data
        // Group by day
        const groupedData: Record<string, { date: string, revenue: number, orders: number }> = {};

        // Initialize days
        const days = eachDayOfInterval({
            start: new Date(start!),
            end: new Date(end!)
        });

        days.forEach(day => {
            const dateStr = format(day, "MMM dd");
            groupedData[dateStr] = { date: dateStr, revenue: 0, orders: 0 };
        });

        orders.forEach(order => {
            const dateStr = format(new Date(order.created_at), "MMM dd");
            if (groupedData[dateStr]) {
                groupedData[dateStr].revenue += Number(order.total_amount) || 0;
                groupedData[dateStr].orders += 1;
            }
        });

        setSalesData(Object.values(groupedData));
        setLoading(false)
    }

    const StatCard = ({ title, value, icon: Icon, subtext }: any) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-24" /> : value}</div>
                <p className="text-xs text-muted-foreground">{subtext}</p>
            </CardContent>
        </Card>
    )

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center gap-2">
                    <Select value={range} onValueChange={setRange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">Last 7 Days</SelectItem>
                            <SelectItem value="month">Last 30 Days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Revenue" value={`$${stats.revenue.toFixed(2)}`} icon={DollarSign} subtext={`In selected range`} />
                <StatCard title="Orders" value={stats.ordersCount} icon={ShoppingBag} subtext="Total orders" />
                <StatCard title="Avg. Order Value" value={`$${stats.avgOrderValue.toFixed(2)}`} icon={Activity} subtext="Per order" />
                {/* Mocking Active Menu Items logic since it needs separate query */}
                <StatCard title="Live Status" value="Online" icon={Activity} subtext="System operational" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                        <CardDescription>Revenue over time</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {loading ? <Skeleton className="h-[350px] w-full" /> : (
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={salesData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `$${value}`}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar
                                            dataKey="revenue"
                                            fill="currentColor"
                                            className="fill-primary"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Orders Trend</CardTitle>
                        <CardDescription>Number of orders</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-[350px] w-full" /> : (
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={salesData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis dataKey="date" hide />
                                        <YAxis hide />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="orders"
                                            stroke="hsl(var(--primary))"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: "hsl(var(--primary))" }}
                                            activeDot={{ r: 8 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
