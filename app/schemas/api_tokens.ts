import { token_rules } from '#b/shared/rules/account'
import { getRules } from '#b/shared/rules/getRules'

const rules = getRules(token_rules)

// API tokens of one account. Only the description is entered; tokens can be added and deleted but not edited.
// path: /api/user/account/tokens (own tokens) or /api/admin/account/<id>/tokens (an admin revoking a user's tokens)
export default function (t: any, opts: { path: string, canCreate?: boolean, onCreated?: (res: any) => void }) {
    return {
        title: 'table.api_tokens.title',
        headers: [
            {
                title: 'table.api_tokens.description',
                key: 'description',
                get_type: 'string',
                set_type: 'string_line',
                rules: [
                    (v: string) => !!v?.trim() || 'table.api_tokens.rules.description.required',
                    rules.description,
                ],
            },
            { title: 'table.api_tokens.created_at', key: 'created_at', get_type: 'short_date' },
            { title: 'table.api_tokens.last_used_at', key: 'last_used_at', get_type: 'short_date' },
            { title: 'table.common.actions', key: 'actions', sortable: false },
        ],
        path_base: opts.path,
        features: opts.canCreate ? ['create', 'delete'] : ['delete'],
        readOnMount: true,
        onCreated: opts.onCreated,
    }
}
