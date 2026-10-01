import { AuthForm } from "@/components/auth/auth-form"

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>
}) {
  const query = await searchParams
  return (
    <AuthForm
      mode="signUp"
      inviteToken={query.invite}
      googleEnabled={
        !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET
      }
      microsoftEnabled={
        !!process.env.MICROSOFT_CLIENT_ID &&
        !!process.env.MICROSOFT_CLIENT_SECRET
      }
    />
  )
}
