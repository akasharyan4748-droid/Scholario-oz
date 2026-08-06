/**
 * SCHOLARIO-OS — Enterprise Domain Event Bus
 * Strongly-typed publish/subscribe messaging backbone for decoupled inter-module events.
 */

export type DomainEventType =
  | 'ADMISSION_APPROVED'
  | 'ADMISSION_REJECTED'
  | 'FEE_COLLECTED'
  | 'FEE_OVERDUE'
  | 'STUDENT_ENROLLED'
  | 'ATTENDANCE_MARKED'
  | 'EXAM_RESULT_PUBLISHED'
  | 'CIRCULAR_ISSUED'
  | 'TEACHER_APPOINTED'
  | 'AUDIT_LOG_CREATED';

export interface DomainEvent<T = unknown> {
  id: string;
  type: DomainEventType;
  tenantId: string;
  timestamp: string;
  actorId?: string;
  payload: T;
}

export type EventHandler<T = unknown> = (event: DomainEvent<T>) => void | Promise<void>;

class EventBus {
  private handlers: Map<DomainEventType, Set<EventHandler>> = new Map();

  public subscribe<T = unknown>(type: DomainEventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    const handlerSet = this.handlers.get(type)!;
    handlerSet.add(handler as EventHandler);

    return () => {
      handlerSet.delete(handler as EventHandler);
    };
  }

  public publish<T = unknown>(event: Omit<DomainEvent<T>, 'id' | 'timestamp'>): DomainEvent<T> {
    const fullEvent: DomainEvent<T> = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    const handlerSet = this.handlers.get(event.type);
    if (handlerSet) {
      handlerSet.forEach((handler) => {
        try {
          handler(fullEvent);
        } catch (err) {
          console.error(`[EVENT_BUS_ERROR] Error handling event ${event.type}:`, err);
        }
      });
    }

    return fullEvent;
  }
}

export const eventBus = new EventBus();
