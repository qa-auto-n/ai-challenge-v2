export type EventStatus = "upcoming" | "past";
export type RsvpStatus = "going" | "waitlist" | "checked-in";
export type Role = "host" | "checker" | "attendee";

export interface Host {
  id: string;
  name: string;
  logoUrl: string;
  bio: string;
  contactEmail: string;
}

export interface CommunityEvent {
  id: string;
  hostId: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  venue?: string;
  onlineLink?: string;
  capacity: number;
  coverImageUrl: string;
  visibility: "public" | "unlisted";
  state: "draft" | "published";
  isPaid: boolean;
  goingCount: number;
  waitlistCount: number;
  checkedInCount: number;
}

export interface Attendee {
  id: string;
  eventId: string;
  name: string;
  email: string;
  status: RsvpStatus;
  ticketCode: string;
}

export interface Ticket {
  id: string;
  eventId: string;
  status: "going" | "waitlist";
  ticketCode: string;
}

export interface PendingPhoto {
  id: string;
  eventId: string;
  url: string;
  uploaderName: string;
}

export interface Report {
  id: string;
  type: "event" | "photo";
  targetId: string;
  targetTitle: string;
  reason: string;
  reportedAt: string;
}

export const hosts: Host[] = [
  {
    id: "host-1",
    name: "Community Tech Hub",
    logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=communitytech",
    bio: "A grassroots collective bringing developers, designers, and curious minds together.",
    contactEmail: "hello@communitytechhub.org",
  },
];

export const events: CommunityEvent[] = [
  {
    id: "evt-1",
    hostId: "host-1",
    title: "Frontend Meetup 2026",
    description:
      "Join us for an evening of lightning talks, demos, and discussion about the latest in frontend development. Topics include React 19, signals, and edge rendering.",
    startsAt: "2026-06-12T18:30:00Z",
    endsAt: "2026-06-12T21:00:00Z",
    timezone: "Europe/Berlin",
    venue: "Tech Hub Loft, 12 Garden St, Berlin",
    capacity: 80,
    coverImageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80",
    visibility: "public",
    state: "published",
    isPaid: false,
    goingCount: 54,
    waitlistCount: 8,
    checkedInCount: 0,
  },
  {
    id: "evt-2",
    hostId: "host-1",
    title: "QA Community Night",
    description:
      "A retrospective evening with QA leads sharing testing strategies, automation tips, and community Q&A.",
    startsAt: "2025-11-04T18:00:00Z",
    endsAt: "2025-11-04T20:30:00Z",
    timezone: "Europe/Berlin",
    onlineLink: "https://meet.example.com/qa-night",
    capacity: 60,
    coverImageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&q=80",
    visibility: "public",
    state: "published",
    isPaid: false,
    goingCount: 47,
    waitlistCount: 0,
    checkedInCount: 41,
  },
];

export const attendees: Attendee[] = [
  {
    id: "a1",
    eventId: "evt-1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    status: "going",
    ticketCode: "CP-AAA-111",
  },
  {
    id: "a2",
    eventId: "evt-1",
    name: "Linus Torvalds",
    email: "linus@example.com",
    status: "going",
    ticketCode: "CP-AAA-112",
  },
  {
    id: "a3",
    eventId: "evt-1",
    name: "Grace Hopper",
    email: "grace@example.com",
    status: "waitlist",
    ticketCode: "CP-AAA-113",
  },
  {
    id: "a4",
    eventId: "evt-2",
    name: "Alan Turing",
    email: "alan@example.com",
    status: "checked-in",
    ticketCode: "CP-BBB-221",
  },
  {
    id: "a5",
    eventId: "evt-2",
    name: "Margaret Hamilton",
    email: "margaret@example.com",
    status: "checked-in",
    ticketCode: "CP-BBB-222",
  },
];

export const myTickets: Ticket[] = [
  { id: "t1", eventId: "evt-1", status: "going", ticketCode: "CP-AAA-111" },
];

export const pendingPhotos: PendingPhoto[] = [
  {
    id: "p1",
    eventId: "evt-2",
    url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80",
    uploaderName: "Ada Lovelace",
  },
  {
    id: "p2",
    eventId: "evt-2",
    url: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&q=80",
    uploaderName: "Linus Torvalds",
  },
];

export const reports: Report[] = [
  {
    id: "r1",
    type: "event",
    targetId: "evt-2",
    targetTitle: "QA Community Night",
    reason: "Spam content reported by attendee.",
    reportedAt: "2025-11-05T09:14:00Z",
  },
  {
    id: "r2",
    type: "photo",
    targetId: "p1",
    targetTitle: "Photo from QA Community Night",
    reason: "Inappropriate content.",
    reportedAt: "2025-11-06T11:02:00Z",
  },
];

export const currentUserRoles: Role[] = ["host", "checker", "attendee"];

export function getHost(id: string) {
  return hosts.find((h) => h.id === id);
}
export function getEvent(id: string) {
  return events.find((e) => e.id === id);
}
export function isPast(event: CommunityEvent) {
  return new Date(event.endsAt).getTime() < Date.now();
}
export function eventStatus(event: CommunityEvent): EventStatus {
  return isPast(event) ? "past" : "upcoming";
}
export function formatDateTime(iso: string, tz?: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: tz,
  });
}
