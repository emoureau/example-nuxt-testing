import { buildUpstreamQuery, normalizeAsset } from '../utils/assets'

export default defineEventHandler(async (event) => {
  const { backendUrl } = useRuntimeConfig(event)
  const res = await $fetch<{ items: BackendAsset[], total: number }>('/v1/assets', {
    baseURL: backendUrl,
    query: buildUpstreamQuery(getQuery(event)),
  })
  return { items: res.items.map(normalizeAsset), total: res.total }
})
