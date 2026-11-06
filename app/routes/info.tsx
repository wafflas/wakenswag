import type {Route} from './+types/info';
import {useOutlet} from 'react-router';
import {MainMenuLayout} from '~/components/home/MainMenuLayout';
import {MainMenu} from '~/components/home/HomeMenu';

const INFO_ITEMS = [
  {
    label: 'Instagram',
    to: 'https://www.instagram.com/wakenswag/',
    detail: '@wakenswag',
    external: true,
  },
  {
    label: 'Website Credits',
    to: 'https://wafflas.url',
    detail: 'wafflas.url',
    external: true,
  },
  {label: 'Privacy Policy', to: '/info/privacy-policy'},
  {label: 'Terms of Service', to: '/info/terms-of-service'},
  {label: 'Returns & Refunds', to: '/info/refund-policy'},
] as const;

export const meta: Route.MetaFunction = () => [
  {
    title: 'Wake n Swag | Info',
  },
  {
    name: 'description',
    content: 'Wake n Swag policies, returns, Instagram, and website credits.',
  },
  {
    tagName: 'link',
    rel: 'canonical',
    href: '/info',
  },
];

export default function Info() {
  const outlet = useOutlet();
  if (outlet) return outlet;

  return (
    <MainMenuLayout>
      <div className="flex flex-col items-start gap-7">
        <h1 className="text-ps2-outline w-full text-center text-3xl text-ps2-yellow md:text-[42px] ">
          Website Information
        </h1>
        <MainMenu items={INFO_ITEMS} ariaLabel="Information" variant="info" />
      </div>
    </MainMenuLayout>
  );
}
