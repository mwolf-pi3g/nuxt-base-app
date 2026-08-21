export const handleApiAlert = (data: any, statusCode: number) => {
  try {
    const { $bus } = useNuxtApp()

    const rawMessage = data?.statusMessage || data?.message
    const typeMap = ["info", "success", "warning", "error", "critical"]

    let messageToEmit = ''

    if (rawMessage && typeof rawMessage === 'string') {
      const parts = rawMessage.trim().split(" ")
      if (parts.length === 2 && typeMap.includes(parts[0])) {
        messageToEmit = rawMessage
      } else {
        let level = 'info'
        if (statusCode >= 200 && statusCode < 300) level = 'success'
        else if (statusCode >= 300 && statusCode < 500) level = 'warning'
        else if (statusCode >= 500) level = 'error'

        messageToEmit = `${level} ${rawMessage}`
      }
    } else {
      const level = statusCode >= 400 ? 'error' : 'success'
      const key = statusCode >= 400 ? 'request.failed' : 'request.success'
      messageToEmit = `${level} ${key}`
    }

    $bus.emit('alert:show', {
      message: messageToEmit
    })
  } catch (err) {
    console.error('Failed to dispatch alert:', err)
  }
}
