import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link } from "react-router-dom"

const LoginPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm bg-white/90 backdrop-blur-sm border border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Login to LivestockIQ</CardTitle>
          <CardDescription>
            Enter your credentials below to access your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="farmer@example.com" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button className="w-full bg-green-600 hover:bg-green-700">Sign in</Button>
          <p className="mt-4 text-xs text-center text-gray-700">
            Don't have an account?{" "}
            <Link to="/register" className="text-green-600 underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default LoginPage