/* eslint-disable import/no-unresolved -- necessary for firebase-admin  */
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cert, initializeApp } from 'firebase-admin/app';
import {
  DocumentSnapshot,
  getFirestore,
  QuerySnapshot,
} from 'firebase-admin/firestore';

require('dotenv-safe').config();

/*
 * Heroku need the env Variable without single quotes ('').
 */
const credentialsVariable = process.env.GOOGLE_CREDENTIALS;
if (!credentialsVariable) {
  throw new Error(
    'The $GOOGLE_CREDENTIALS environment variable was not found!',
  );
}

const firebaseCredentials = JSON.parse(credentialsVariable);

const firebaseClient = initializeApp({
  credential: cert(firebaseCredentials),
  projectId: firebaseCredentials.project_id,
});

const db = getFirestore(firebaseClient);

type FamilyMember = { name: string; age: number };

export async function getFamilyMembers() {
  const snapshot = (await db
    .collection('family-members')
    .get()) as QuerySnapshot<FamilyMember>;

  const familyMembers = snapshot.docs.map((doc) => {
    return { id: doc.id, ...doc.data() };
  });

  return familyMembers;
}

export async function createSession() {
  const sessionToken = crypto.randomBytes(100).toString('base64');
  const docRef = db.collection('sessions').doc('admin');

  const newSession = {
    token: sessionToken,
    // set 6 hours long session token
    expiryTimestamp: Date.now() + 21600000,
  };

  await docRef.set(newSession);

  return newSession;
}

export async function deleteSession() {
  const docRef = db.collection('sessions').doc('admin');
  const deletedSession = (await docRef.get()).data();

  const newSession = {
    token: '',
    // set 6 hours long session token
    expiryTimestamp: Date.now(),
  };

  await docRef.set(newSession);

  return deletedSession;
}

export async function isTokenValid(token?: string) {
  if (!token) return false;

  const snapshot = (await db.collection('sessions').get()) as QuerySnapshot<{
    expiryTimestamp: number;
    token: string;
  }>;

  return snapshot.docs.some((doc) => {
    return (
      token === doc.data().token && Date.now() < doc.data().expiryTimestamp
    );
  });
}

export async function isPasswordValid(password: string) {
  if (!password) return false;

  const docRef = (await db
    .collection('credentials')
    .doc(process.env.CREDENTIALS_DOC_ID!)
    .get()) as DocumentSnapshot<{ passwordHash: string }>;

  return await bcrypt.compare(password, docRef.data()!.passwordHash);
}
