"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabaseClient"
import { apiClient } from "@/lib/apiClient"
import { DataTable } from "@/components/DataTable"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash, Image as ImageIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const ENABLE_IMAGES = process.env.NEXT_PUBLIC_ENABLE_MENU_IMAGES === 'true'

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    price: z.coerce.number().min(0),
    category_id: z.string().min(1, "Category is required"),
    is_available: z.boolean().default(true),
    image_url: z.string().optional(),
})

type MenuItem = {
    id: number
    name: string
    description?: string
    price: number
    category_id: number
    is_available: boolean
    image_url?: string
    categories?: { name: string }
}

export default function MenuItemsPage() {
    const [items, setItems] = useState<MenuItem[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
    const [deleteId, setDeleteId] = useState<number | null>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchItems()
        fetchCategories()
    }, [])

    const fetchItems = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('menu_items')
            .select('*, categories(name)')
            .order('created_at', { ascending: false })

        if (error) {
            console.error(error)
            toast.error("Failed to load menu items")
        } else {
            setItems(data || [])
        }
        setLoading(false)
    }

    const fetchCategories = async () => {
        const { data } = await supabase
            .from('categories')
            .select('id, name')
            .order('name')
        if (data) setCategories(data)
    }

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            price: 0,
            category_id: "",
            is_available: true,
            image_url: ""
        },
    })

    // Reset form when dialog opens/closes or edit changes
    useEffect(() => {
        if (!open) form.reset()
    }, [open, form])

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            // Handle placeholder upload if needed, here just taking string
            const payload = { ...values, category_id: parseInt(values.category_id) }

            if (editingItem) {
                await apiClient(`/api/menu-items/${editingItem.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                })
                toast.success("Item updated")
            } else {
                await apiClient('/api/menu-items', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                })
                toast.success("Item created")
            }
            setOpen(false)
            fetchItems()
        } catch (error: any) {
            toast.error(error.message || "Operation failed")
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            await apiClient(`/api/menu-items/${deleteId}`, {
                method: 'DELETE'
            })
            toast.success("Item deleted")
            fetchItems()
        } catch (error: any) {
            toast.error(error.message || "Failed to delete")
        } finally {
            setDeleteId(null)
        }
    }

    const startEdit = (item: MenuItem) => {
        setEditingItem(item)
        form.reset({
            name: item.name,
            description: item.description || "",
            price: item.price,
            category_id: item.category_id.toString(),
            is_available: item.is_available,
            image_url: item.image_url || ""
        })
        setOpen(true)
    }

    const startCreate = () => {
        setEditingItem(null)
        form.reset({
            name: "",
            description: "",
            price: 0,
            category_id: "", // Select needs string for value
            is_available: true,
            image_url: ""
        })
        setOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Menu Items</h2>
                    <p className="text-muted-foreground">Manage dishes and availability.</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={startCreate}><Plus className="mr-2 h-4 w-4" /> Add Item</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{editingItem ? "Edit Item" : "New Item"}</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Burger" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Price</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} value={field.value as number} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ingredients, details..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="category_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Category</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select category" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {categories.map((c) => (
                                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="is_available"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-auto">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Available</FormLabel>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {ENABLE_IMAGES && (
                                    <FormField
                                        control={form.control}
                                        name="image_url"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Image URL (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://..." {...field} />
                                                </FormControl>
                                                <FormDescription>Link to an image of the dish.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <DialogFooter>
                                    <Button type="submit">Save</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <DataTable
                columns={[
                    { header: "Name", accessorKey: "name" },
                    { header: "Category", accessorKey: (item) => item.categories?.name || 'Uncategorized' },
                    { header: "Price", accessorKey: (item) => `$${item.price.toFixed(2)}` },
                    {
                        header: "Status", accessorKey: (item) => (
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${item.is_available ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                                {item.is_available ? 'Available' : 'Unavailable'}
                            </span>
                        )
                    },
                ]}
                data={items}
                actions={(item) => (
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(item)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => setDeleteId(item.id)}>
                            <Trash className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will soft delete the item. It will no longer appear in the menu.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
