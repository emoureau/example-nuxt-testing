export function debounce<A extends unknown[]>(fn: (...args: A) => void, wait = 300) {
  let timer: ReturnType<typeof setTimeout> | undefined
  const run = (...args: A) => {
    if (timer)
      clearTimeout(timer)
    timer = setTimeout(fn, wait, ...args)
  }
  run.cancel = () => {
    if (timer)
      clearTimeout(timer)
  }
  return run
}
