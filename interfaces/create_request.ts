export interface CSVRequest {
    isFirstRowHeaders: boolean
    data: string
}

export interface CreateRequest {
    width?: number
    theme?: string
    csv: CSVRequest
}