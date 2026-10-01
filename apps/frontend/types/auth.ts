export type AuthMode = "signIn" | "signUp" | "forgot" | "reset"

export type AuthFormProps = {
  mode: AuthMode
  googleEnabled: boolean
  microsoftEnabled: boolean
  inviteToken?: string
  resetToken?: string
  resetInvalid?: boolean
}
