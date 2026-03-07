import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.ts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Utensils, CalendarCheck, ShoppingBag, Receipt, LogOut } from 'lucide-react'
import { toast } from 'sonner'

export default function StudentDashboard({ session }: { session: any }) {
    const [activeTab, setActiveTab] = useState('menu')
    const [menuItems, setMenuItems] = useState<any[]>([])
    const [cart, setCart] = useState<{ item: any, qty: number }[]>([])
    const [orders, setOrders] = useState<any[]>([])
    const [seats, setSeats] = useState<any[]>([])
    const [bookings, setBookings] = useState<any[]>([])
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0])
    const [bookingSlot, setBookingSlot] = useState('lunch')

    useEffect(() => {
        fetchMenu()
        fetchOrders()
        fetchSeatsAndBookings()

        // Real-time subscription for orders
        const orderSub = supabase
            .channel('public:orders')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${session.user.id}` }, payload => {
                fetchOrders()
                toast.info(`Order #${payload.new.id} status updated to: ${payload.new.status}`)
            })
            .subscribe()

        // Real-time subscription for seat bookings
        const bookingSub = supabase
            .channel('public:seat_bookings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'seat_bookings' }, () => {
                fetchSeatsAndBookings()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(orderSub)
            supabase.removeChannel(bookingSub)
        }
    }, [bookingDate, bookingSlot])

    const fetchMenu = async () => {
        const today = new Date().toISOString().split('T')[0]
        const { data } = await supabase.from('menu_items').select('*').eq('day', today).eq('is_available', true)
        if (data) setMenuItems(data)
    }

    const fetchOrders = async () => {
        const { data } = await supabase.from('orders').select('*, order_items(*, menu_items(*))').eq('user_id', session.user.id).order('created_at', { ascending: false })
        if (data) setOrders(data)
    }

    const fetchSeatsAndBookings = async () => {
        const { data: seatsData } = await supabase.from('seats').select('*').eq('is_active', true).order('seat_number', { ascending: true })
        if (seatsData) setSeats(seatsData)

        const { data: bookingsData } = await supabase.from('seat_bookings').select('*').eq('booking_date', bookingDate).eq('slot', bookingSlot).in('status', ['booked', 'completed'])
        if (bookingsData) setBookings(bookingsData)
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
    }

    const addToCart = (item: any) => {
        setCart(prev => {
            const existing = prev.find(p => p.item.id === item.id)
            if (existing) {
                return prev.map(p => p.item.id === item.id ? { ...p, qty: p.qty + 1 } : p)
            }
            return [...prev, { item, qty: 1 }]
        })
        toast.success(`Added ${item.name} to cart`)
    }

    const placeOrder = async () => {
        if (cart.length === 0) return
        const total = cart.reduce((acc, curr) => acc + (curr.item.price * curr.qty), 0)

        const { data: order, error } = await supabase.from('orders').insert({
            user_id: session.user.id,
            total
        }).select().single()

        if (error) {
            toast.error('Failed to place order')
            return
        }

        const orderItems = cart.map(c => ({
            order_id: order.id,
            menu_item_id: c.item.id,
            qty: c.qty,
            price_each: c.item.price
        }))

        await supabase.from('order_items').insert(orderItems)
        toast.success('Order placed successfully!')
        setCart([])
        fetchOrders()
        setActiveTab('orders')
    }

    const bookSeat = async (seatId: number) => {
        const isBooked = bookings.some(b => b.seat_id === seatId)
        if (isBooked) {
            toast.error('Seat is already booked.')
            return
        }

        // Check if user already has a booking for this slot
        const userBooking = bookings.find(b => b.user_id === session.user.id)
        if (userBooking) {
            toast.error('You already have a booking for this slot.')
            return
        }

        const { error } = await supabase.from('seat_bookings').insert({
            user_id: session.user.id,
            booking_date: bookingDate,
            slot: bookingSlot,
            seat_id: seatId
        })

        if (error) {
            toast.error('Failed to book seat: ' + error.message)
        } else {
            toast.success('Seat booked successfully!')
            fetchSeatsAndBookings()
        }
    }

    const cancelBooking = async (bookingId: number) => {
        const { error } = await supabase.from('seat_bookings').update({ status: 'cancelled' }).eq('id', bookingId)
        if (!error) {
            toast.success('Booking cancelled')
            fetchSeatsAndBookings()
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-card border-r border-border p-6 flex flex-col gap-4">
                <div className="flex items-center space-x-2 text-primary font-bold text-xl mb-8">
                    <Utensils className="h-6 w-6" />
                    <span>MealMate</span>
                </div>

                <nav className="flex-1 space-y-2">
                    <Button
                        variant={activeTab === 'menu' ? 'default' : 'ghost'}
                        className="w-full justify-start gap-3"
                        onClick={() => setActiveTab('menu')}
                    >
                        <Utensils className="h-5 w-5" /> Today's Menu
                    </Button>
                    <Button
                        variant={activeTab === 'seats' ? 'default' : 'ghost'}
                        className="w-full justify-start gap-3"
                        onClick={() => setActiveTab('seats')}
                    >
                        <CalendarCheck className="h-5 w-5" /> Book Seat
                    </Button>
                    <Button
                        variant={activeTab === 'cart' ? 'default' : 'ghost'}
                        className="w-full justify-start gap-3 relative"
                        onClick={() => setActiveTab('cart')}
                    >
                        <ShoppingBag className="h-5 w-5" />
                        Cart
                        {cart.length > 0 && (
                            <span className="absolute right-4 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {cart.length}
                            </span>
                        )}
                    </Button>
                    <Button
                        variant={activeTab === 'orders' ? 'default' : 'ghost'}
                        className="w-full justify-start gap-3"
                        onClick={() => setActiveTab('orders')}
                    >
                        <Receipt className="h-5 w-5" /> My Orders
                    </Button>
                </nav>

                <Button variant="outline" className="w-full justify-start gap-3 text-destructive hover:text-destructive" onClick={handleSignOut}>
                    <LogOut className="h-5 w-5" /> Sign Out
                </Button>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold capitalize text-foreground">
                        {activeTab.replace('-', ' ')}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Welcome back, let's get you sorted.
                    </p>
                </header>

                {activeTab === 'menu' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {menuItems.map(item => (
                            <Card key={item.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle>{item.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-2xl font-bold text-primary">₹{item.price}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" onClick={() => addToCart(item)}>
                                        Add to Cart
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                        {menuItems.length === 0 && <p className="text-muted-foreground">No items available today.</p>}
                    </div>
                )}

                {activeTab === 'seats' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Seat Booking</CardTitle>
                            <CardDescription>Select a date and slot, then pick an available seat.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 mb-8">
                                <input
                                    type="date"
                                    value={bookingDate}
                                    onChange={e => setBookingDate(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm max-w-[200px]"
                                />
                                <select
                                    value={bookingSlot}
                                    onChange={e => setBookingSlot(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm max-w-[150px]"
                                >
                                    <option value="break">Break</option>
                                    <option value="lunch">Lunch</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                                {seats.map(seat => {
                                    const booking = bookings.find(b => b.seat_id === seat.id)
                                    const isMyBooking = booking?.user_id === session.user.id

                                    return (
                                        <button
                                            key={seat.id}
                                            onClick={() => !booking ? bookSeat(seat.id) : (isMyBooking ? cancelBooking(booking.id) : null)}
                                            className={`h-12 w-full rounded-md border flex items-center justify-center text-sm font-medium transition-colors
                        ${!booking ? 'bg-card hover:bg-primary/10 hover:border-primary text-foreground' :
                                                    (isMyBooking ? 'bg-primary text-primary-foreground shadow-md hover:bg-destructive' : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50')
                                                }
                      `}
                                            disabled={booking && !isMyBooking}
                                            title={isMyBooking ? "Click to cancel" : ""}
                                        >
                                            {seat.seat_number}
                                        </button>
                                    )
                                })}
                            </div>

                            <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-card border"></div> Available</span>
                                <span className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-primary"></div> Your Booking</span>
                                <span className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-muted"></div> Booked</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'cart' && (
                    <div className="w-full max-w-3xl">
                        <Card>
                            <CardHeader>
                                <CardTitle>Your Cart</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {cart.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">Your cart is empty.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {cart.map((c, i) => (
                                            <div key={i} className="flex justify-between items-center border-b pb-4">
                                                <div>
                                                    <p className="font-medium">{c.item.name}</p>
                                                    <p className="text-sm text-muted-foreground">₹{c.item.price} x {c.qty}</p>
                                                </div>
                                                <p className="font-bold">₹{c.item.price * c.qty}</p>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center pt-4 text-xl font-bold">
                                            <span>Total</span>
                                            <span className="text-primary">₹{cart.reduce((a, b) => a + (b.item.price * b.qty), 0)}</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                            {cart.length > 0 && (
                                <CardFooter>
                                    <Button className="w-full h-12 text-lg" onClick={placeOrder}>Place Order</Button>
                                </CardFooter>
                            )}
                        </Card>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="space-y-4 max-w-4xl">
                        {orders.length === 0 ? (
                            <p className="text-muted-foreground">You haven't placed any orders yet.</p>
                        ) : (
                            orders.map(order => (
                                <Card key={order.id} className="overflow-hidden">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-muted/30 border-b">
                                        <div>
                                            <h3 className="font-bold text-lg">Order #{order.id}</h3>
                                            <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                                        </div>
                                        <div className="mt-4 md:mt-0 flex items-center gap-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider
                        ${order.status === 'placed' ? 'bg-blue-100 text-blue-700' :
                                                    order.status === 'preparing' ? 'bg-yellow-100 text-yellow-700' :
                                                        order.status === 'ready' ? 'bg-green-100 text-green-700' :
                                                            'bg-red-100 text-red-700'}
                      `}>
                                                {order.status}
                                            </span>
                                            <span className="font-bold text-xl">₹{order.total}</span>
                                        </div>
                                    </div>
                                    <CardContent className="p-6">
                                        <ul className="space-y-2">
                                            {order.order_items.map((item: any) => (
                                                <li key={item.id} className="flex justify-between text-sm">
                                                    <span>{item.qty}x {item.menu_items.name}</span>
                                                    <span className="text-muted-foreground">₹{item.price_each * item.qty}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        {order.status === 'placed' && (
                                            <div className="mt-6">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={async () => {
                                                        await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
                                                        fetchOrders()
                                                        toast.success('Order cancelled')
                                                    }}
                                                >
                                                    Cancel Order
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}

            </main>
        </div>
    )
}
