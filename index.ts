import fastify from 'fastify';

const app = fastify();

app.get('/', async (req) => {
  return await { family: `${req.protocol}://${req.hostname}/family-members` };
});

app.get('/family-members', () => {
  return [{ person1: 'john' }];
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
