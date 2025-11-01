import { IncomingMessage, ServerResponse } from "http";
import serverless from "serverless-http";
import { createServer } from "../server/index";

const app = createServer();
const handler = serverless(app);

export default async (req: IncomingMessage, res: ServerResponse) => {
  return handler(req, res);
};
