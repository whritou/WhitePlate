import { AuthForm } from "@/components/auth/auth-form"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>
}) {
  const query = await searchParams

  return (
    <AuthForm
      mode="reset"
      resetToken={query.token}
      resetInvalid={Boolean(query.error) || !query.token}
      googleEnabled={false}
      microsoftEnabled={false}
    />
  )
}
