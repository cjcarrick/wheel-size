export default function tr(
  tds: (
    | string
    | number
    | { data: string | number; onclick: (ev: MouseEvent) => void }
  )[]
): HTMLTableRowElement {
  // Create row
  const tr = document.createElement('tr')

  // Create and append data entries
  for (let i = 0; i < tds.length; i++) {
    const td = tds[i]
    const d = document.createElement('td')
    if (typeof td == 'object') {
      d.innerHTML = `${td.data}`
      d.addEventListener('click', (ev: MouseEvent) => td.onclick(ev))
    } else {
      d.innerHTML = `${td}`
    }
    tr.appendChild(d)
  }

  // Return row
  return tr
}
