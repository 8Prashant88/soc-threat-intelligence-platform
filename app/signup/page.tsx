/**
 * SecureLogTI - Signup Page
 * Registration page for new users
 */

import { SignupForm } from "@/components/auth/signup-form"
import { ShieldAlert } from "lucide-react"

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4">
              <ShieldAlert className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">SecureLogTI</h1>
          <p className="mt-2 text-muted-foreground">Create your account to get started</p>
        </div>

        {/* Signup Form */}
        <SignupForm />

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          © 2025 SecureLogTI. Final Year Cybersecurity Project.
        </p>
      </div>
    </div>
  )
}
