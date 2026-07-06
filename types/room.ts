export type RoomStatus = "ACTIVE" | "INACTIVE";

export type AncillaryRoom = {
  id: number;
  name: string;
  location: string;
  capacity: number;
  status: RoomStatus;
  description?: string;
};

export type CreateRoomDto = {
  name: string;
  location: string;
  capacity: number;
  description?: string;
};

export type UpdateRoomDto = Partial<CreateRoomDto>;
