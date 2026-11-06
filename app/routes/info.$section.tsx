import {Link, useLoaderData, useRevalidator} from 'react-router';
import sanitizeHtml from 'sanitize-html';
import type {Route} from './+types/info.$section';
import {HomeShell} from '~/components/home/HomeShell';

const SECTIONS = {
  'privacy-policy': {title: 'Privacy Policy', field: 'privacyPolicy'},
  'terms-of-service': {title: 'Terms of Service', field: 'termsOfService'},
  'refund-policy': {title: 'Returns & Refunds', field: 'refundPolicy'},
} as const;

export const meta: Route.MetaFunction = ({data}) => [
  {title: `Wake n Swag | ${data?.title ?? 'Information'}`},
  {
    name: 'description',
    content: `Wake n Swag ${data?.title ?? 'information'}.`,
  },
  {tagName: 'link', rel: 'canonical', href: `/info/${data?.section ?? ''}`},
];

export async function loader({context, params}: Route.LoaderArgs) {
  const section = params.section;
  if (!Object.prototype.hasOwnProperty.call(SECTIONS, section)) {
    throw new Response('Page not found', {status: 404});
  }
  const {title, field} = SECTIONS[section as keyof typeof SECTIONS];

  try {
    const {shop} = await context.storefront.query(INFO_POLICIES_QUERY);
    const policy = shop[field];
    // Allow ordinary policy formatting, removing scripts and unsafe URLs.
    const body = policy?.body ? sanitizeHtml(policy.body) : null;
    return {section, title, body, failed: false};
  } catch {
    return {section, title, body: null, failed: true};
  }
}

export default function InfoSection() {
  const {title, body, failed} = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();

  return (
    <HomeShell>
      <article className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-10 px-6 pt-12 pb-28 sm:px-10 lg:pt-[10vh]">
        <h1 className="text-ps2-outline text-center text-3xl text-ps2-yellow sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {failed ? (
          <div className="flex flex-col items-start gap-4 text-lg text-ps2-muted">
            <p role="alert">
              This policy couldn’t be loaded. Please try again.
            </p>
            <button
              type="button"
              className="ps2-cta min-h-11 cursor-pointer"
              disabled={revalidator.state !== 'idle'}
              onClick={() => void revalidator.revalidate()}
            >
              {revalidator.state !== 'idle' ? 'Loading…' : 'Try again'}
            </button>
          </div>
        ) : body ? (
          <div
            className={[
              'text-base leading-relaxed text-ps2-muted [overflow-wrap:anywhere] sm:text-lg',
              '[&>*+*]:mt-4 [&_:is(h2,h3,h4)]:text-[1.2em] [&_:is(h2,h3,h4)]:text-ps2-white',
              '[&_:is(ul,ol)]:pl-6 [&_ul]:list-disc [&_ol]:list-decimal',
              '[&_a]:text-ps2-cyan [&_a]:underline [&_a]:underline-offset-[0.2em]',
            ].join(' ')}
            dangerouslySetInnerHTML={{__html: body}}
          />
        ) : (
          <p className="text-lg text-ps2-muted">
            This policy hasn’t been published yet.
          </p>
        )}
        <Link
          className="ps2-cta mt-2 flex min-h-11 w-fit items-center text-lg"
          to="/info"
        >
          Back to Information
        </Link>
      </article>
    </HomeShell>
  );
}

const INFO_POLICIES_QUERY = `#graphql
  query InfoPolicies {
    shop {
      privacyPolicy { body }
      termsOfService { body }
      refundPolicy { body }
    }
  }
` as const;
