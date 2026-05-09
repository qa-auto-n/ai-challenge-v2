// Generate and download an .ics calendar file for an event.
function pad(n: number) { return String(n).padStart(2, "0"); }
function toICSDate(iso: string) {
  const d = new Date(iso);
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) + "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) + "Z"
  );
}
function escape(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export interface ICSInput {
  uid: string;
  title: string;
  description?: string | null;
  startISO: string;
  endISO: string;
  location?: string | null;
  url?: string | null;
}

export function buildICS(e: ICSInput) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CommunityPass//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${e.uid}@communitypass`,
    `DTSTAMP:${toICSDate(new Date().toISOString())}`,
    `DTSTART:${toICSDate(e.startISO)}`,
    `DTEND:${toICSDate(e.endISO)}`,
    `SUMMARY:${escape(e.title)}`,
    e.description ? `DESCRIPTION:${escape(e.description)}` : "",
    e.location ? `LOCATION:${escape(e.location)}` : "",
    e.url ? `URL:${escape(e.url)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

export function downloadICS(filename: string, ics: string) {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
