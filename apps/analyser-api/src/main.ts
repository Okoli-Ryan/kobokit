import { createApiServer } from './server';

const port = Number(process.env.PORT) || 3001;

createApiServer().listen(port, () => {
  console.log(`analyser-api listening on port ${port}`);
});
