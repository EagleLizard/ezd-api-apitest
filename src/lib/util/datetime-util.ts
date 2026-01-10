
export const datetimeUtil = {
  alphaNumericDateTime: alphaNumericDateTime,
} as const;

function alphaNumericDateTime(date = new Date()): string {
  let y = date.getFullYear();
  let m = date.getMonth() + 1;
  let d = date.getDate();
  // console.log(date.toISOString());
  let dateStr = `${y}${m < 10 ? `0${m}` : m}${d > 10 ? d : `0${d}`}`;
  // console.log(dateStr);
  let h = date.getUTCHours();
  let mins = date.getUTCMinutes();
  let s = date.getUTCSeconds();
  let ms = date.getUTCMilliseconds();
  let timeStr = `${
    h < 10 ? `0${h}` : h
  }${
    mins < 10 ? `0${mins}` : mins
  }${
    s < 10 ? `0${s}` : s
  }_${
    ms < 10
      ? `00${ms}`
      : ms < 100
        ? `0${ms}`
        : ms
  }`;
  // console.log(timeStr);
  return `${dateStr}T${timeStr}Z`;
}
