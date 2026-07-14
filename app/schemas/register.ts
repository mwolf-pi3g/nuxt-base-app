import { zod_rules } from "#shared/rules/account"

export default (t: any) => {
  return {
    headers: [
      {
        key: 'user',
        title: t('frontend.auth.email'),
        set_type: 'string_line',
        type: 'email',
        rules: [
            (v: string) => !!v || t('rules.invalid_field'),
            (v: string) => zod_rules.user.safeParse(v).success || t('account.user.invalid_email')
        ]
      },
      {
        key: 'password',
        title: t('frontend.auth.password'),
        set_type: 'password_confirm',
        rules: [
            (v: string) => !!v || t('rules.password.required'),
            (v: string) => zod_rules.password.safeParse(v).success || t('account.password.too_short')
        ]
      }
    ]
  }
}
