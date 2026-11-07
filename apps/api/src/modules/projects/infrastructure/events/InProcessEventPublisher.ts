import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IEventPublisher } from '../../application/ports/IEventPublisher';

@Injectable()
export class InProcessEventPublisher implements IEventPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async publish(event: object): Promise<void> {
    this.eventEmitter.emit(event.constructor.name, event);
  }
}
