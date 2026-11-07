export interface IEventPublisher {
  publish(event: object): Promise<void>;
}

export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');
