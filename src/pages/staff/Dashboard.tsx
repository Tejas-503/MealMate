import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.ts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { ChefHat, TrendingUp, CalendarCheck, Receipt, BookOpen, LogOut, CheckCircle, Trash } from 'lucide-react'
import { toast } from 'sonner'

export default function StaffDashboard({ session: _session }: { session: any }) {
    const [activeTab, setActiveTab] = useState('metrics')
    const [orders, setOrders] = useState<any[]>([])
    const [bookings, setBookings] = useState<any[]>([])
    const [menu, setMenu] = useState<any[]>([])

    // Dashboard Metrics
    const [todayRevenue, setTodayRevenue] = useState(0)
    const [todayOrdersCount, setTodayOrdersCount] = useState(0)
    const [todayBookingsCount, setTodayBookingsCount] = useState(0)

    // Sub-state for views
    const [menuDate, setMenuDate] = useState(new Date().toISOString().split('T')[0])
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0])

    // New Menu Item
    const [newItemParams, setNewItemParams] = useState({ name: '', price: '' })

    useEffect(() => {
        fetchOrders()
        fetchBookings()
        fetchMenu()
        fetchMetrics()

        // Real-time subscriptions
        const orderSub = supabase
            .channel('public:orders_staff')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                fetchOrders()
                fetchMetrics()
                toast.info('New order update received.')
            })
            .subscribe()

        const bookingSub = supabase
            .channel('public:bookings_staff')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'seat_bookings' }, () => {
                fetchBookings()
                fetchMetrics()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(orderSub)
            supabase.removeChannel(bookingSub)
        }
    }, [menuDate, bookingDate])

    const fetchMetrics = async () => {
        const today = new Date().toISOString().split('T')[0]

        // Revenue & Orders
        const { data: todayOrders } = await supabase
            .from('orders')
            .select('total, status')
            .gte('created_at', today)
            .neq('status', 'cancelled')

        if (todayOrders) {
            setTodayOrdersCount(todayOrders.length)
            setTodayRevenue(todayOrders.reduce((a, b) => a + Number(b.total), 0))
        }

        // Bookings
        const { data: todBooks } = await supabase
            .from('seat_bookings')
            .select('id')
            .eq('booking_date', today)
            .in('status', ['booked', 'completed'])

        if (todBooks) {
            setTodayBookingsCount(todBooks.length)
        }
    }

    const fetchOrders = async () => {
        const { data } = await supabase.from('orders').select('*, order_items(*, menu_items(*)), profiles(full_name)').order('created_at', { ascending: false })
        if (data) setOrders(data)
    }

    const fetchBookings = async () => {
        const { data } = await supabase.from('seat_bookings').select('*, profiles(full_name), seats(seat_number)').eq('booking_date', bookingDate).in('status', ['booked', 'completed']).order('created_at', { ascending: true })
        if (data) setBookings(data)
    }

    const fetchMenu = async () => {
        const { data } = await supabase.from('menu_items').select('*').eq('day', menuDate).order('created_at', { ascending: true })
        if (data) setMenu(data)
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
    }

    const updateOrderStatus = async (orderId: number, status: string) => {
        const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
        if (error) {
            toast.error('Failed to update status')
        } else {
            toast.success('Order status updated')
            fetchOrders()
        }
    }

    const toggleMenuAvailability = async (id: number, is_available: boolean) => {
        await supabase.from('menu_items').update({ is_available }).eq('id', id)
        fetchMenu()
    }

    const addMenuItem = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newItemParams.name || !newItemParams.price) return
        const { error } = await supabase.from('menu_items').insert({
            day: menuDate,
            name: newItemParams.name,
            price: parseFloat(newItemParams.price)
        })

        if (!error) {
            toast.success('Item added')
            setNewItemParams({ name: '', price: '' })
            fetchMenu()
        } else {
            toast.error(error.message)
        }
    }

    const deleteMenuItem = async (id: number) => {
        await supabase.from('menu_items').delete().eq('id', id)
        fetchMenu()
        toast.success('Item deleted')
    }

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-card border-r border-border p-6 flex flex-col gap-4">
                <div className="flex items-center space-x-2 text-secondary font-bold text-xl mb-8">
                    <ChefHat className="h-6 w-6" />
                    <span>Staff Portal</span>
                </div>

                <nav className="flex-1 space-y-2">
                    <Button
                        variant={activeTab === 'metrics' ? 'secondary' : 'ghost'}
                        className="w-full justify-start gap-3"
                        onClick={() => setActiveTab('metrics')}
                    >
                        <TrendingUp className="h-5 w-5" /> Dashboard
                    </Button>
                    <Button
                        variant={activeTab === 'orders' ? 'secondary' : 'ghost'}
                        className="w-full justify-start gap-3"
                        onClick={() => setActiveTab('orders')}
                    >
                        <Receipt className="h-5 w-5" /> Live Orders
                    </Button>
                    <Button
                        variant={activeTab === 'bookings' ? 'secondary' : 'ghost'}
                        className="w-full justify-start gap-3"
                        onClick={() => setActiveTab('bookings')}
                    >
                        <CalendarCheck className="h-5 w-5" /> Seat Bookings
                    </Button>
                    <Button
                        variant={activeTab === 'menu' ? 'secondary' : 'ghost'}
                        className="w-full justify-start gap-3"
                        onClick={() => setActiveTab('menu')}
                    >
                        <BookOpen className="h-5 w-5" /> Menu Manager
                    </Button>
                </nav>

                <Button variant="outline" className="w-full justify-start gap-3 text-destructive hover:text-destructive" onClick={handleSignOut}>
                    <LogOut className="h-5 w-5" /> Sign Out
                </Button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold capitalize text-foreground">
                        {activeTab.replace('-', ' ')}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage canteen operations effectively.
                    </p>
                </header>

                {activeTab === 'metrics' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-secondary/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-secondary">₹{todayRevenue}</div>
                                <p className="text-xs text-muted-foreground mt-1">Calculated from successful orders today.</p>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
                                <Receipt className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-primary">{todayOrdersCount}</div>
                                <p className="text-xs text-muted-foreground mt-1">Total active orders today.</p>
                            </CardContent>
                        </Card>

                        <Card className="border-purple-500/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Seats Booked Today</CardTitle>
                                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-purple-600">{todayBookingsCount}</div>
                                <p className="text-xs text-muted-foreground mt-1">Total capacity usage across slots.</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="space-y-4">
                        {orders.length === 0 ? (
                            <p className="text-muted-foreground">No orders in the system.</p>
                        ) : (
                            orders.map(order => (
                                <Card key={order.id} className="overflow-hidden border-secondary/10 hover:border-secondary/30 transition-all">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-muted/20 border-b">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-bold text-lg">Order #{order.id}</h3>
                                                <span className="text-sm px-2 py-0.5 bg-card border rounded-md font-medium">{order.profiles?.full_name || 'Student'}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">{new Date(order.created_at).toLocaleString()}</p>
                                        </div>
                                        <div className="mt-4 md:mt-0 flex flex-col md:items-end gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider self-start md:self-auto
                          ${order.status === 'placed' ? 'bg-blue-100 text-blue-700' :
                                                    order.status === 'preparing' ? 'bg-yellow-100 text-yellow-700' :
                                                        order.status === 'ready' ? 'bg-green-100 text-green-700' :
                                                            'bg-red-100 text-red-700'}
                        `}>
                                                {order.status}
                                            </span>
                                            <span className="font-bold text-xl text-secondary">₹{order.total}</span>
                                        </div>
                                    </div>
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row md:justify-between gap-6">
                                            <ul className="space-y-2 flex-1">
                                                {order.order_items.map((item: any) => (
                                                    <li key={item.id} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0">
                                                        <span><span className="font-bold text-foreground mr-2">{item.qty}x</span>{item.menu_items?.name || 'Unknown Item'}</span>
                                                        <span className="text-muted-foreground">₹{item.price_each * item.qty}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="flex flex-col gap-2 min-w-[200px]">
                                                {order.status === 'placed' && (
                                                    <Button onClick={() => updateOrderStatus(order.id, 'preparing')} className="w-full gap-2">
                                                        <ChefHat className="h-4 w-4" /> Start Preparing
                                                    </Button>
                                                )}
                                                {order.status === 'preparing' && (
                                                    <Button variant="secondary" onClick={() => updateOrderStatus(order.id, 'ready')} className="w-full gap-2">
                                                        <CheckCircle className="h-4 w-4" /> Mark as Ready
                                                    </Button>
                                                )}
                                                {(order.status === 'placed' || order.status === 'preparing' || order.status === 'ready') && (
                                                    <Button variant="destructive" onClick={() => updateOrderStatus(order.id, 'cancelled')} className="w-full gap-2 mt-auto">
                                                        Cancel Order
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'bookings' && (
                    <div className="space-y-6">
                        <div className="flex gap-4 items-center">
                            <label className="font-medium">Filter Date:</label>
                            <input
                                type="date"
                                value={bookingDate}
                                onChange={e => setBookingDate(e.target.value)}
                                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm max-w-[200px]"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {['break', 'lunch'].map(slot => (
                                <Card key={slot}>
                                    <CardHeader>
                                        <CardTitle className="capitalize">{slot} Slot</CardTitle>
                                        <CardDescription>{bookings.filter(b => b.slot === slot).length} seats booked</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-3">
                                            {bookings.filter(b => b.slot === slot).map(booking => (
                                                <li key={booking.id} className="flex justify-between items-center p-3 border rounded-lg bg-card shadow-sm">
                                                    <div>
                                                        <span className="font-semibold text-secondary block">Seat #{booking.seats?.seat_number}</span>
                                                        <span className="text-sm text-muted-foreground">{booking.profiles?.full_name || 'Unknown User'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full capitalize">{booking.status}</span>
                                                    </div>
                                                </li>
                                            ))}
                                            {bookings.filter(b => b.slot === slot).length === 0 && (
                                                <p className="text-muted-foreground text-sm">No bookings for this slot.</p>
                                            )}
                                        </ul>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'menu' && (
                    <div className="space-y-6">
                        <div className="flex gap-4 items-center">
                            <label className="font-medium">Select Date:</label>
                            <input
                                type="date"
                                value={menuDate}
                                onChange={e => setMenuDate(e.target.value)}
                                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm max-w-[200px]"
                            />
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Add New Item to {menuDate}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={addMenuItem} className="flex flex-col sm:flex-row gap-4">
                                    <Input
                                        placeholder="Item Name (e.g. Masala Dosa)"
                                        value={newItemParams.name}
                                        onChange={e => setNewItemParams({ ...newItemParams, name: e.target.value })}
                                        className="flex-1"
                                        required
                                    />
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="Price (₹)"
                                        value={newItemParams.price}
                                        onChange={e => setNewItemParams({ ...newItemParams, price: e.target.value })}
                                        className="w-full sm:w-32"
                                        required
                                    />
                                    <Button type="submit" variant="secondary">Add Item</Button>
                                </form>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {menu.map(item => (
                                <Card key={item.id} className={`transition-all ${!item.is_available ? 'opacity-60 grayscale' : ''}`}>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-lg">{item.name}</CardTitle>
                                        <span className="font-bold text-secondary">₹{item.price}</span>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between items-center mt-4">
                                            <Button
                                                variant={item.is_available ? 'outline' : 'secondary'}
                                                size="sm"
                                                onClick={() => toggleMenuAvailability(item.id, !item.is_available)}
                                            >
                                                {item.is_available ? 'Mark Unavailable' : 'Mark Available'}
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => deleteMenuItem(item.id)}>
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {menu.length === 0 && <p className="text-muted-foreground col-span-full">No menu items created for this date.</p>}
                        </div>
                    </div>
                )}

            </main>
        </div>
    )
}
