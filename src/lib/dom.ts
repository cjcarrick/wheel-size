export function getCssVar(key: string, el = document.body) {
  const style = window.getComputedStyle(el)
  const v = style.getPropertyValue('--' + key)
  return v
}
