export interface ActivityEntry {
  _id: string;
  actorEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}
