import path from 'node:path';
import cookie, { FastifyCookieOptions } from '@fastify/cookie';
import staticServer from '@fastify/static';
import { serialize } from 'cookie';
import fastify, { FastifyRequest } from 'fastify';
import { createSerializedSessionTokenCookie } from './utils/cookies';
import {
  createSession,
  deleteSession,
  getFamilyMembers,
  isPasswordValid,
  isTokenValid,
} from './utils/database';

const app = fastify();

await app.register(cookie, {
  secret: process.env.COOKIE_SECRET,
  parseOptions: {},
} as FastifyCookieOptions);

await app.register(staticServer, {
  root: path.join(__dirname, 'public'),
  prefix: '/public/',
});

app.addHook('onRequest', async (request, reply) => {
  if (
    request.routerPath !== '/login' &&
    request.routerPath !== '/logout' &&
    !(await isTokenValid(request.cookies.sessionToken))
  ) {
    await reply.code(400).send({ error: 'Unauthorized' });
  }
});

app.get('/', (request) => {
  return {
    'family-members': `${
      process.env.NODE_ENV === 'production' ? 'https' : request.protocol
    }://${request.hostname}/family-members`,
  };
});

app.get('/family-members', async () => {
  return await getFamilyMembers();
});

app.get('/login', (x_req, response) => {
  return response
    .header('Content-Type', 'text/html')
    .status(200)
    .sendFile('index.html');
});

app.get('/logout', async (x_req, response) => {
  await deleteSession();
  return response
    .header(
      'Set-Cookie',
      serialize('sessionToken', '', {
        maxAge: -1,
        path: '/',
      }),
    )
    .status(200)
    .send({ message: 'Logged out' });
});

type LoginRequest = FastifyRequest<{ Body: { password: string } }>;

app.post('/login', async (request: LoginRequest, response) => {
  if (await isPasswordValid(request.body.password)) {
    const newSession = await createSession();
    const sessionCookie = createSerializedSessionTokenCookie(newSession.token);
    return await response
      .status(200)
      .header('Set-Cookie', sessionCookie)
      .send();
  }

  return await response.status(401).send({ error: 'Invalid password' });
});

app.listen(
  {
    port: Number(process.env.PORT) || 8080,
    host: process.env.HOST || '0.0.0.0',
  },
  (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  },
);
