import type {Route} from './+types/socials';
import {ContentPageShell} from '~/components/content/ContentPageShell';

export const meta: Route.MetaFunction = () => [
  {
    title: 'Wake n Swag | Socials',
  },
  {
    name: 'description',
    content: 'Wake n Swag on social media.',
  },
  {
    tagName: 'link',
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
