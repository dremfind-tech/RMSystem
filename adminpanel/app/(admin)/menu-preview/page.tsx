"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"

export default function MenuPreviewPage() {
    const [menu, setMenu] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchMenu()
    }, [])

    const fetchMenu = async () => {
        setLoading(true)
        // Fetch categories with their items
        const { data: categories, error } = await supabase
            .from('categories')
            .select('*, menu_items(*)')
            .order('sort_order', { ascending: true })

        // Note: We need to filter only active items maybe? 
        // "Reflects DB data exactly" -> Show what is there.
        // Usually preview shows everything or just available?
        // "Read-only live menu preview". 
        // I'll show everything but gray out unavailable.

        if (categories) {
            setMenu(categories)
        }
        setLoading(false)
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">Menu Preview</h1>
                <p className="text-muted-foreground">Live view of your current menu.</p>
            </div>

            {menu.map((category) => (
                <div key={category.id} className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b pb-2">{category.name}</h2>
                    <div className="grid gap-6 md:grid-cols-2">
                        {category.menu_items?.length > 0 ? category.menu_items.map((item: any) => (
                            <Card key={item.id} className={`overflow-hidden transition-all hover:shadow-md ${!item.is_available ? 'opacity-60 grayscale' : ''}`}>
                                {item.image_url && (
                                    <div className="aspect-video w-full overflow-hidden">
                                        <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                                    </div>
                                )}
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex justify-between items-start gap-2">
                                        <CardTitle className="text-lg">{item.name}</CardTitle>
                                        <span className="font-semibold text-primary">${item.price.toFixed(2)}</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                                    {!item.is_available && <Badge variant="destructive" className="mt-1">Unavailable</Badge>}
                                </CardContent>
                            </Card>
                        )) : (
                            <p className="text-muted-foreground italic">No items in this category.</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
