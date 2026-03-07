import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card.tsx'
import { Button } from '../components/ui/Button.tsx'
import { Utensils, Users, ChefHat, CalendarCheck, TrendingUp } from 'lucide-react'

export default function Landing() {
    return (
        <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">

            {/* Navbar Pattern / Blur */}
            <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-primary/10 to-transparent -z-10" />

            {/* Header */}
            <header className="py-6 px-8 flex justify-between items-center max-w-7xl mx-auto w-full">
                <div className="flex items-center space-x-2 text-primary font-bold text-2xl tracking-tight">
                    <Utensils className="h-8 w-8 text-primary" />
                    <span>MealMate</span>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center mt-12 px-6 text-center z-10">
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-8">
                    🚀 Smart Campus Dining
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-foreground max-w-4xl leading-tight">
                    Food, Seats & <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Management</span><br /> in one place.
                </h1>
                <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
                    Order your favorite meals, book your canteen seats, and let the campus dining run flawlessly with MealMate.
                </p>

                {/* Action Cards */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
                    <Card className="hover:shadow-lg transition-all border-primary/20 hover:border-primary/50 relative group bg-white/80 backdrop-blur-md">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                        <CardHeader className="text-left">
                            <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
                                <Users className="h-6 w-6" />
                            </div>
                            <CardTitle>I am a Student</CardTitle>
                            <CardDescription className="text-base mt-2">
                                Browse today's menu, make orders, and reserve a seat for lunch or break.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-left mt-4">
                            <Link to="/login/student">
                                <Button className="w-full text-lg h-12 gap-2 group-hover:bg-primary/90">
                                    Continue as Student
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-all border-secondary/20 hover:border-secondary/50 relative group bg-white/80 backdrop-blur-md">
                        <div className="absolute inset-0 bg-gradient-to-bl from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                        <CardHeader className="text-left">
                            <div className="h-12 w-12 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center mb-4">
                                <ChefHat className="h-6 w-6" />
                            </div>
                            <CardTitle>I am Staff</CardTitle>
                            <CardDescription className="text-base mt-2">
                                Manage menus, track incoming orders, and oversee seating capacities.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-left mt-4">
                            <Link to="/login/staff">
                                <Button variant="secondary" className="w-full text-lg h-12 gap-2 group-hover:bg-secondary/90">
                                    Continue as Staff
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Features Highlights */}
                <div className="mt-32 w-full max-w-6xl py-12 border-t border-border/50 text-left grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
                    <div className="flex flex-col items-start space-y-3">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <Utensils className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-lg">Real-time Menus</h3>
                        <p className="text-muted-foreground">Always see what's fresh and available today, updated instantly by the staff.</p>
                    </div>
                    <div className="flex flex-col items-start space-y-3">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                            <CalendarCheck className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-lg">Easy Seat Booking</h3>
                        <p className="text-muted-foreground">Save time by reserving a table grid before you even arrive at the canteen.</p>
                    </div>
                    <div className="flex flex-col items-start space-y-3">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-lg">Order Analytics</h3>
                        <p className="text-muted-foreground">For staff: track revenue, popular items, and manage influx efficiently.</p>
                    </div>
                </div>

            </main>

            {/* Footer */}
            <footer className="py-8 text-center text-sm text-muted-foreground">
                <p>© 2026 MealMate by Canteen Management System. All rights reserved.</p>
            </footer>
        </div>
    )
}
