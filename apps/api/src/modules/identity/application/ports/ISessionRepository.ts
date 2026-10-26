import { Session } from '../../domain/entities/Session';

export interface ISessionRepository {
  save(session: Session): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  findByUserId(userId: string): Promise<Session | null>;
  delete(id: string): Promise<void>;
}