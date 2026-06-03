export function calcHoursBetween(startTime: string, endTime: string): number {
  const parseTimeToMinutes = (value: string) => {
    const [hour, minute] = value.split(':').map(Number);
    return hour * 60 + minute;
  };
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (end <= start) {
    throw new Error('שעת סיום חייבת להיות אחרי שעת התחלה');
  }
  return Number(((end - start) / 60).toFixed(3));
}

export function calcFinalPrice(hourlyRate: number, hours: number): number {
  return Number((hourlyRate * hours).toFixed(3));
}
