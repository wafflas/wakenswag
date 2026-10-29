import type {Route} from './+types/socials';
import {ContentPageShell} from '~/components/content/ContentPageShell';

export const meta: Route.MetaFunction = () => [
  {
    title: 'Socials | Wake n Swag',
  },
  {
    name: 'description',
    content: 'Wake n Swag on social media.',
  },
  {
    rel: 'canonical',
    href: '/socials',
  },
];

export default function Socials() {
  return (
    <ContentPageShell title="Socials">
      <p>Coming soon.</p>
    </ContentPageShell>
  );
}
