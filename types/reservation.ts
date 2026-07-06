export type ResourceType = "VEHICLE" | "ROOM";
export type ReservationStatus = "CONFIRMED" | "CANCELLED";

export type Reservation = {
  id: number;
  resourceType: ResourceType;
  resourceId: number;
  resourceName: string;
  userId: number;
  userName: string;
  userDepartment: string;
  startAt: string;
  endAt: string;
  purpose: string;
  destination?: string;
  status: ReservationStatus;
  createdAt: string;
};

export type CreateReservationDto = {
  resourceType: ResourceType;
  resourceId: number;
  startAt: string;
  endAt: string;
  purpose: string;
  destination?: string;
};

export type UpdateReservationDto = {
  startAt?: string;
  endAt?: string;
  purpose?: string;
  destination?: string;
};
