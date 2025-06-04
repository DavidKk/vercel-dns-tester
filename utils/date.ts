export function isInvalidDate(date: Date) {
  return isNaN(date.getTime())
}
