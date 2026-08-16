export default defineEventHandler((event) => {
  const { backendUrl } = useRuntimeConfig(event)
  return proxyRequest(event, `${backendUrl}/v1/assets/${getRouterParam(event, 'id')}/raw`)
})
