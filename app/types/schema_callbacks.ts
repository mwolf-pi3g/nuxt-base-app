export interface SchemaCallbacks {
    [key: string]: ((item?: any) => void) | undefined
}
