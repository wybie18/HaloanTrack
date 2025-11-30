export const getPhTimeAsLocal = (timeStr: string, dayOffset: number | null = null) => {
  const now = new Date();
  
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const isoString = `${year}-${month}-${day}T${timeStr}+08:00`;

  let localDate = new Date(isoString);

  if (dayOffset !== null) {
    const targetJsDay = dayOffset % 7; 

    const currentPhDay = new Date(isoString).getDay(); 
    let daysToAdd = targetJsDay - currentPhDay;
    if (daysToAdd < 0) daysToAdd += 7;

    localDate.setDate(localDate.getDate() + daysToAdd);
  }

  return localDate;
};