import type { EventInput, PendlyEvent } from '../types';

export interface SyncPlan {
    toAdd: EventInput[];
    toUpdate: { id: string; data: EventInput }[];
}

const SYNCED_FIELDS = ['name', 'date', 'time', 'location', 'notes', 'repetition'] as const;

/**
 * Decides which calendar events are new and which already-imported ones changed.
 * The category the user picked in Pendly is kept when an event is updated.
 */
export const planGoogleSync = (existing: PendlyEvent[], incoming: EventInput[]): SyncPlan => {
    const bySourceId = new Map<string, PendlyEvent>();
    for (const event of existing) {
        if (event.source === 'google' && event.sourceEventId) bySourceId.set(event.sourceEventId, event);
    }

    const plan: SyncPlan = { toAdd: [], toUpdate: [] };
    const seen = new Set<string>();
    for (const item of incoming) {
        if (!item.sourceEventId || seen.has(item.sourceEventId)) continue;
        seen.add(item.sourceEventId);

        const current = bySourceId.get(item.sourceEventId);
        if (!current) {
            plan.toAdd.push(item);
            continue;
        }
        const changed = SYNCED_FIELDS.some(field => (current[field] ?? '') !== (item[field] ?? ''));
        if (changed) {
            const { displayDate: _displayDate, id: _id, ...currentData } = current;
            plan.toUpdate.push({ id: current.id, data: { ...currentData, ...item, category: current.category } });
        }
    }
    return plan;
};
