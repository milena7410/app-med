export type Medication = {
  id: string
  name: string
  times: string[]
  unitsPerDose: number
  unit: string
  stock: number
  refillAlertDays: number
}

export type DoseLog = {
  key: string
  medicationId: string
  date: string
  time: string
  takenAt: string
}

export function estimateSupplyDays(medication: Medication): number | null {
  const dailyUse = medication.unitsPerDose * medication.times.length
  if (!Number.isFinite(dailyUse) || dailyUse <= 0 || medication.stock < 0) return null
  return Math.floor(medication.stock / dailyUse)
}

export function doseLogKey(medicationId: string, date: string, time: string): string {
  return `${date}:${medicationId}:${time}`
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingEmptyDays = firstDay.getDay()
  const cells: (Date | null)[] = Array.from({ length: leadingEmptyDays }, () => null)

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day))
  }

  return cells
}