import cookie, { FastifyCookieOptions } from '@fastify/cookie';
import fastify from 'fastify';
import { getFamilyMemebers } from './utils/database';

const app = fastify();

/*
 * Fastify configuration to use cookies.
 * https://github.com/fastify/fastify-cookie#example
 */
await app.register(cookie, {
  secret: process.env.COOKIE_SECRET,
  parseOptions: {},
} as FastifyCookieOptions);

app.addHook('onRequest', async (request, reply) => {
  // TODO: update this with propper session AUTH once login is implemented
  if (request.cookies.sessionToken !== process.env.PROVISIONAL_TOKEN) {
    await reply.code(400).send({ error: 'Unauthorized' });
  }
});

app.get('/', (request) => {
  return {
    family: `${
      process.env.NODE_ENV === 'production' ? 'https' : request.protocol
    }://${request.hostname}/family-members`,
  };
});

app.get('/family-members', async () => {
  return await getFamilyMemebers();
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
