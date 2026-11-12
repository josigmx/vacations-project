export type VacationStatus = "ended" | "active" | "upcoming";

export type VacationFilter = "all" | "liked" | "active" | "upcoming";

export interface Vacation {
  _id: string;
  destination: string;
  description: string;
  startDate: string;      // ISO date from the server
  endDate: string;
  price: number;
  imageFileName: string;
  status: VacationStatus; // computed by the server from today's date
  likesCount: number;     // likes of all the users
  isLiked: boolean;       // did the logged-in user like it
}

// One page of vacations, as GET /vacations returns it
export interface VacationsPage {
  vacations: Vacation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// The add / edit form — every input holds a string ("YYYY-MM-DD" dates, the price as typed)
export interface VacationFormValues {
  destination: string;
  description: string;
  startDate: string;
  endDate: string;
  price: string;
}

// One row of the likes report
export interface LikesReportRow {
  destination: string;
  likes: number;
}

// What like / unlike returns
export interface LikeResult {
  vacationId: string;
  isLiked: boolean;
  likesCount: number;
}
