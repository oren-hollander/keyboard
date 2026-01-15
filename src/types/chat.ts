export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: number;
}

export interface DisplayLine {
  id: string;
  username: string;
  text: string;
  color: string;
}
