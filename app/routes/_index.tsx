import type {Route} from './+types/_index';
import {MainMenuLayout} from '~/components/home/MainMenuLayout';
import {MainMenu} from '~/components/home/HomeMenu';

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: 'Wake N Swag | Home',
    },
    {
      name: 'description',
      content: 'Wake N Swag clothing, drumkits, and information.',
    },
  ];
};

export default function Homepage() {
  return (
    <MainMenuLayout>
      <h1 className="sr-only">Wake N Swag</h1>
      <MainMenu />
    </MainMenuLayout>
  );
}
