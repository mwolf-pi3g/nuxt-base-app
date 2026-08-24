import mitt from 'mitt'

type ApplicationEvents = {
  'alert:show': { message: string, isI18n?: boolean, type?: string }
  'loading:start'?: void
  'loading:stop'?: void
}

export default defineNuxtPlugin(() => {
  const emitter = mitt<ApplicationEvents>()
  return {
    provide: {
      bus: {
        emit: emitter.emit,
        on: emitter.on,
        off: emitter.off
      }
    }
  }
})
