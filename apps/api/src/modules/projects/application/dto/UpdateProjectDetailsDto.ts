export interface UpdateProjectDetailsDto {
  projectId: string;
  actorId: string;
  name?: string;
  description?: string | null;
}
