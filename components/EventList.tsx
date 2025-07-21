
import React from 'react';
import type { PendlyEvent } from '../types';
import EventItem from './EventItem';
import EmptyState from './EmptyState';
import EventItemSkeleton from './EventItemSkeleton';

interface EventListProps {
    events: PendlyEvent[];
    isArchive: boolean;
    onDelete: (id: string) => void;
    loading: boolean;
}

const EventList: React.FC<EventListProps> = ({ events, isArchive, onDelete, loading }) => {
    if (loading) {
        return (
            <div className="p-2 sm:p-4 space-y-3">
                {[...Array(3)].map((_, i) => <EventItemSkeleton key={i} />)}
            </div>
        );
    }

    if (events.length === 0) {
        return <EmptyState isArchive={isArchive} />;
    }

    return (
        <div className="p-2 sm:p-4 space-y-3">
            {events.map(event => (
                <EventItem key={event.id} event={event} isArchive={isArchive} onDelete={onDelete} />
            ))}
        </div>
    );
};

export default EventList;