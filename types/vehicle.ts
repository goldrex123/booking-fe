export type VehicleStatus = "ACTIVE" | "INACTIVE";

export type Vehicle = {
  id: number;
  model: string;
  licensePlate: string;
  seats: number;
  status: VehicleStatus;
  note?: string;
};

export type CreateVehicleDto = {
  model: string;
  licensePlate: string;
  seats: number;
  note?: string;
};

// 백엔드 UpdateVehicleRequest는 licensePlate를 지원하지 않는다 (등록 후 변경 불가)
export type UpdateVehicleDto = {
  model?: string;
  seats?: number;
  note?: string;
};
