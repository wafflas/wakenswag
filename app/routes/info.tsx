import type {Route} from './+types/info';
import {ContentPageShell} from '~/components/content/ContentPageShell';

export const meta: Route.MetaFunction = () => [
  {
    title: 'Info | Wake n Swag',
  },
  {
    name: 'description',
    content: 'About Wake n Swag.',
  },
  {
    rel: 'canonical',
    href: '/info',
  },
];

export default function Info() {
  return (
    <ContentPageShell title="Info">
      <p>Coming soon.</p>
    </ContentPageShell>
  );
}
