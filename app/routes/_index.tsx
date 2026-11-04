import type {Route} from './+types/_index';
import {HomeShell} from '~/components/home/HomeShell';
import Logo from '~/components/shared/Logo';
import {MainMenu} from '~/components/home/HomeMenu';

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: 'Wake n Swag',
    },
    {
      name: 'description',
      content: 'Wake n Swag merch, drumkits, and information.',
    },
  ];
};

export default function Homepage() {
  return (
    <HomeShell>
      <div
        className={[
          'flex min-h-dvh flex-col items-center justify-center',
          'gap-10 overflow-hidden pb-24',
          'lg:flex-row lg:gap-[clamp(3rem,8vw,10rem)]',
        ].join(' ')}
      >
        <div className="flex shrink-0 items-center justify-center">
          <Logo />
        </div>

        <div className="flex shrink-0 items-center justify-center">
          <MainMenu />
        </div>
      </div>
    </HomeShell>
  );
}
