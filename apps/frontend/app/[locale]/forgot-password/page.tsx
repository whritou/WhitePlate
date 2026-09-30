import { AuthForm } from "@/components/auth/auth-form"

export default function ForgotPasswordPage() {
  return <AuthForm mode="forgot" googleEnabled={false} microsoftEnabled={false} />
}
