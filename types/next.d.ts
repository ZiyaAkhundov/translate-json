import { IncomingForm } from 'formidable';

// Extending NextApiRequest to include the `file` property
declare module 'next' {
  interface NextApiRequest {
    file?: Express.Multer.File;
  }
}
