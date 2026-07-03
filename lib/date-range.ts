export type DateRangeKey = "today" | "yesterday" | "7d" | "30d" | "this_month" | "last_month" | "custom";

export type DateRangeResult = {
  range: DateRangeKey;
  label: string;
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
  fromInput: string;
  toInput: string;
};

const indiaOffsetMinutes = 330;
const dayMs = 24 * 60 * 60 * 1000;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function partsInIndia(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return { year, month, day };
}

function indiaStartUtc(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day) - indiaOffsetMinutes * 60 * 1000);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * dayMs);
}

function inputDate(date: Date) {
  const indiaTime = new Date(date.getTime() + indiaOffsetMinutes * 60 * 1000);
  return `${indiaTime.getUTCFullYear()}-${pad(indiaTime.getUTCMonth() + 1)}-${pad(indiaTime.getUTCDate())}`;
}

function parseInputDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return indiaStartUtc(year, month, day);
}

function monthStart(year: number, month: number) {
  return indiaStartUtc(year, month, 1);
}

function nextMonthStart(year: number, month: number) {
  const next = new Date(Date.UTC(year, month - 1, 1));
  next.setUTCMonth(next.getUTCMonth() + 1);
  return indiaStartUtc(next.getUTCFullYear(), next.getUTCMonth() + 1, 1);
}

function previousMonthStart(year: number, month: number) {
  const previous = new Date(Date.UTC(year, month - 1, 1));
  previous.setUTCMonth(previous.getUTCMonth() - 1);
  return indiaStartUtc(previous.getUTCFullYear(), previous.getUTCMonth() + 1, 1);
}

export function resolveDateRange(url: URL | string): DateRangeResult {
  const parsedUrl = typeof url === "string" ? new URL(url) : url;
  const requestedRange = parsedUrl.searchParams.get("range") as DateRangeKey | null;
  const { year, month, day } = partsInIndia();
  const todayStart = indiaStartUtc(year, month, day);
  const tomorrowStart = addDays(todayStart, 1);
  let range: DateRangeKey = requestedRange || "7d";
  let label = "Last 7 days";
  let from = addDays(todayStart, -6);
  let to = tomorrowStart;

  if (requestedRange === "today") {
    label = "Today";
    from = todayStart;
    to = tomorrowStart;
  } else if (requestedRange === "yesterday") {
    label = "Yesterday";
    from = addDays(todayStart, -1);
    to = todayStart;
  } else if (requestedRange === "30d") {
    label = "Last 30 days";
    from = addDays(todayStart, -29);
    to = tomorrowStart;
  } else if (requestedRange === "this_month") {
    label = "This month";
    from = monthStart(year, month);
    to = nextMonthStart(year, month);
  } else if (requestedRange === "last_month") {
    label = "Last month";
    from = previousMonthStart(year, month);
    to = monthStart(year, month);
  } else if (parsedUrl.searchParams.get("from") || parsedUrl.searchParams.get("to")) {
    const customFrom = parseInputDate(parsedUrl.searchParams.get("from"));
    const customTo = parseInputDate(parsedUrl.searchParams.get("to"));
    range = "custom";
    label = "Custom range";
    from = customFrom || from;
    to = customTo ? addDays(customTo, 1) : to;
    if (to <= from) to = addDays(from, 1);
  } else {
    range = "7d";
  }

  const duration = to.getTime() - from.getTime();
  const previousFrom = new Date(from.getTime() - duration);
  const previousTo = from;

  return {
    range,
    label,
    from,
    to,
    previousFrom,
    previousTo,
    fromInput: inputDate(from),
    toInput: inputDate(addDays(to, -1))
  };
}

export function dateRangeSearchParams(searchParams: URLSearchParams) {
  const range = searchParams.get("range");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const params = new URLSearchParams();

  if (range) params.set("range", range);
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  if (!params.toString()) params.set("range", "7d");
  return params;
}
