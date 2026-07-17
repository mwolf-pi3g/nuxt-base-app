export const handleApiAlert = (data: any, statusCode: number) => {
  try {
    const { $bus } = useNuxtApp()

    // Check if the response matches our standard JSON structure
    const testI18N = data?.statusMessage?.split(" ");
    const typeMap = ["info", "success", "warning", "error", "critical"]
    if (testI18N && testI18N.length === 2 && typeMap.includes(testI18N[0])) {
      $bus.emit('alert:show', {
        message: data.statusMessage
      })
      return
    }

    // Fallback: Use response message or hardcoded fallback, mapping status codes
    const message = data?.message || (statusCode >= 400 ? 'Request failed' : 'Request successful')
    let type = 'info'

    if (statusCode >= 200 && statusCode < 300) {
      type = 'success'
    } else if (statusCode >= 300 && statusCode < 500) {
      type = 'warning'
    } else if (statusCode >= 500) {
      type = 'error'
    }

    $bus.emit('alert:show', {
      message
    })
  } catch (err) {
    console.error('Failed to dispatch alert:', err)
  }
}
