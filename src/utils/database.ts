// eslint-disable-next-line import/no-unresolved -- ESLint can't find the module
import { cert, initializeApp } from 'firebase-admin/app';
// eslint-disable-next-line import/no-unresolved -- ESLint can't find the module
import { getFirestore } from 'firebase-admin/firestore';

require('dotenv-safe').config();

const creadentialsVariable = process.env['GOOGLE_CREDENTIALS'];
if (!creadentialsVariable) {
  throw new Error(
    'The $GOOGLE_CREDENTIALS environment variable was not found!',
  );
}

const firestoreCredentials = JSON.parse(creadentialsVariable);

const firestoreClient = initializeApp({
  credential: cert(firestoreCredentials),
  projectId: firestoreCredentials.project_id,
});

const db = getFirestore(firestoreClient);

export async function getFamilyMemebers() {
  const snapshot = await db.collection('family-members').get();

  const familyMemebers = snapshot.docs.map((doc) => {
    return { id: doc.id, ...doc.data() };
  });

  return familyMemebers;
}

export function getSessionByValidToken() {
  // TODO: validate session token
}

export function createSession() {
  //  TODO: create session on database doc
}

export function validateCredentialsPassword() {
  //  TODO: validate credentials
}
