import { getService as getAccountService } from '#bs/services/core/account';
import { isRegistrationEnabled } from '#bs/utils/registration';

defineRouteMeta({
  openAPI: {
    tags: ['Base Auth'],
    description: 'Register a new account.',
    responses: {
      200: {
        description: 'Success response'
      },
      403: {
        description: 'Registration disabled'
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  if (!isRegistrationEnabled()) {
    throw createError({
      statusCode: 403,
      statusMessage: 'error auth.register.disabled',
    });
  }

  const body = await readBody(event)
  const service = await getAccountService()


  const record = await service.create({
    user: body.user,
    password: body.password,
  })

  return {
    status: 'success',
    statusMessage: 'success account.create.success'
  }
})