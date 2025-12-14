"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabaseClient"
import { apiClient } from "@/lib/apiClient"
import { DataTable } from "@/components/DataTable"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
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

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    sort_order: z.coerce.number().default(0),
})

type Category = {
    id: number
    name: string
    sort_order: number
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [deleteId, setDeleteId] = useState<number | null>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('sort_order', { ascending: true })

        if (error) {
            console.error(error)
            toast.error("Failed to load categories")
        } else {
            setCategories(data || [])
        }
        setLoading(false)
    }

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            sort_order: 0,
        },
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            if (editingCategory) {
                // Feature flagged as missing in backend
                toast.error("Update Category API not available in backend contract.")

                // Code preserved for future integration:
                /* 
                await apiClient(`/api/menu/category/${editingCategory.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(values)
                })
                toast.success("Category updated")
                */
            } else {
                await apiClient('/api/menu/category', {
                    method: 'POST',
                    body: JSON.stringify(values)
                })
                toast.success("Category created")
            }
            setOpen(false)
            fetchCategories()
        } catch (error: any) {
            toast.error(error.message || "Operation failed")
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return

        // Feature flagged as missing in backend
        toast.error("Delete Category API not available in backend contract.")
        setDeleteId(null)

        // Code preserved for future integration:
        /*
        try {
            await apiClient(`/api/menu/category/${deleteId}`, {
                method: 'DELETE'
            })
            toast.success("Category deleted")
            fetchCategories()
        } catch (error: any) {
            toast.error(error.message || "Failed to delete")
        } finally {
            setDeleteId(null)
        }
        */
    }

    const startEdit = (cat: Category) => {
        setEditingCategory(cat)
        form.reset({
            name: cat.name,
            sort_order: cat.sort_order
        })
        setOpen(true)
    }

    const startCreate = () => {
        setEditingCategory(null)
        form.reset({
            name: "",
            sort_order: 0
        })
        setOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
                    <p className="text-muted-foreground">Manage your menu categories.</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={startCreate}><Plus className="mr-2 h-4 w-4" /> Add Category</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
                            <DialogDescription>
                                {editingCategory ? "Make changes to the category details here." : "Add a new category to your menu."}
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Appetizers" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="sort_order"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sort Order</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} value={field.value as number} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
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
                    { header: "Sort Order", accessorKey: "sort_order" },
                ]}
                data={categories}
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
                            This will soft delete the category. Items in this category might be hidden.
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
