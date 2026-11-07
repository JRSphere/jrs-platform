export interface CreateProjectDto {
  name: string;
  ownerId: string;
  description?: string | null;
}
