import type {Route} from './+types/_index';
import {MainMenuLayout} from '~/components/home/MainMenuLayout';
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
    <MainMenuLayout>
      <MainMenu />
    </MainMenuLayout>
  );
}
