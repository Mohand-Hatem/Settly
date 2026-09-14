export interface UserRegisteredEvent {
  userId: string;
  email: string;
  timestamp: string;
}

export interface UserBannedEvent {
  userId: string;
  reason: string;
  timestamp: string;
}
