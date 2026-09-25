import { readFileSync } from 'fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, getDocs, collection, setDoc, updateDoc } from 'firebase/firestore';

// Run with: npm run test:rules (starts the Firestore emulator).
let env: RulesTestEnvironment;

const validEvent = { name: 'Відпустка', date: '2026-10-05', time: '', location: '', category: 'travel', notes: '', repetition: 'none' };

beforeAll(async () => {
    env = await initializeTestEnvironment({
        projectId: 'demo-pendly',
        firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
    });
});
afterAll(() => env.cleanup());
beforeEach(() => env.clearFirestore());

describe('firestore.rules', () => {
    it('lets a user manage their own events', async () => {
        const db = env.authenticatedContext('alice').firestore();
        const ref = doc(db, 'users/alice/events/e1');
        await assertSucceeds(setDoc(ref, validEvent));
        await assertSucceeds(getDoc(ref));
        await assertSucceeds(getDocs(collection(db, 'users/alice/events')));
        await assertSucceeds(updateDoc(ref, { name: 'Інша назва' }));
        await assertSucceeds(deleteDoc(ref));
    });

    it('blocks access to other users and anonymous visitors', async () => {
        await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(), 'users/alice/events/e1'), validEvent));
        const bob = env.authenticatedContext('bob').firestore();
        await assertFails(getDoc(doc(bob, 'users/alice/events/e1')));
        await assertFails(getDocs(collection(bob, 'users/alice/events')));
        await assertFails(setDoc(doc(bob, 'users/alice/events/e2'), validEvent));
        await assertFails(deleteDoc(doc(bob, 'users/alice/events/e1')));
        const anon = env.unauthenticatedContext().firestore();
        await assertFails(getDoc(doc(anon, 'users/alice/events/e1')));
    });

    it('rejects malformed events', async () => {
        const db = env.authenticatedContext('alice').firestore();
        const ref = doc(db, 'users/alice/events/e1');
        await assertFails(setDoc(ref, { ...validEvent, name: '' }));
        await assertFails(setDoc(ref, { ...validEvent, date: '5 жовтня' }));
        await assertFails(setDoc(ref, { ...validEvent, category: 'party' }));
        await assertFails(setDoc(ref, { ...validEvent, repetition: 'daily' }));
        await assertFails(setDoc(ref, { ...validEvent, isAdmin: true }));
        await assertSucceeds(setDoc(ref, { ...validEvent, time: '09:30', source: 'ics', sourceEventId: 'ics:abc' }));
    });
});
