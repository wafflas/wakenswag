import * as serverBuild from 'virtual:react-router/server-build';
import {createRequestHandler} from 'react-router';
import {createHydrogenRouterContext} from '~/lib/context';

export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {
    try {
      const context = await createHydrogenRouterContext(
        request,
        env,
        executionContext,
      );
      return await createRequestHandler(serverBuild, process.env.NODE_ENV)(
        request,
        context,
      );
    } catch (error) {
      console.error(error);
      return new Response('An unexpected error occurred', {status: 500});
    }
  },
};
