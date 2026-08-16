export interface BackendAsset {
  id: string
  title: string
  tags: string[]
  filename: string
  contentType: string
  size: number
  createdAt: string
}

export interface UiAsset {
  id: string
  title: string
  tags: string[]
  filename: string
  size: number
  url: string
}
