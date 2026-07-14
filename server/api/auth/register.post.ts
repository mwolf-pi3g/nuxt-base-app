import { getService as getAccountService } from "#bs/services/core/account"
``
export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const service = getAccountService()


    console.log(body)
    const record = await service.create({
        user: body.user,
        password: body.password,
    })

    return {
        status: 'success',
        statusMessage: 'success account.create.success'
    }
})