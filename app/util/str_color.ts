export function strColor(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  const hue = Math.abs(hash) % 360

  return {
    backgroundColor: `hsl(${hue}, 75%, 90%)`,
    color: `hsl(${hue}, 85%, 25%)`,
    borderColor: `hsl(${hue}, 75%, 80%)`,
    borderWidth: '1px',
    borderStyle: 'solid',
  }
}

export default strColor
