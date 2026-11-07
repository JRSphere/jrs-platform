export interface UpdateProjectDetailsDto {
  projectId: string;
  name?: string;
  description?: string | null;
}
