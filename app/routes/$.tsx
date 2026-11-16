import type {Route} from './+types/$';
import {NotFoundPage} from '~/components/shared/NotFoundPage';

export const meta: Route.MetaFunction = () => [
  {title: 'Wake N Swag | 404'},
  {name: 'robots', content: 'noindex'},
];

export async function loader({request}: Route.LoaderArgs) {
  throw new Response(`${new URL(request.url).pathname} not found`, {
    status: 404,
  });
}

/** Fallback UI if the thrown 404 is ever rendered without the error boundary. */
export default function CatchAllPage() {
  return <NotFoundPage />;
}
