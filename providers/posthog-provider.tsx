'use client';

// PostHog temporarily disabled
// import { useUser } from '@/hooks/use-user';
// import { env } from '@/lib/env';
// import { usePathname, useSearchParams } from 'next/navigation';
// import posthog from 'posthog-js';
// import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react';
import { type ReactNode } from 'react';

type PostHogProviderProps = {
  children: ReactNode;
};

export const PostHogProvider = ({ children }: PostHogProviderProps) => {
  // PostHog temporarily disabled
  return <>{children}</>;
};

// PostHog temporarily disabled
// const PostHogPageView = () => {
//   const pathname = usePathname();
//   const searchParams = useSearchParams();
//   const posthog = usePostHog();
//
//   useEffect(() => {
//     if (pathname && posthog) {
//       let url = window.origin + pathname;
//       const search = searchParams.toString();
//       if (search) {
//         url += `?${search}`;
//       }
//       posthog.capture('$pageview', { $current_url: url });
//     }
//   }, [pathname, searchParams, posthog]);
//
//   return null;
// };
//
// const SuspendedPostHogPageView = () => {
//   return (
//     <Suspense fallback={null}>
//       <PostHogPageView />
//     </Suspense>
//   );
// };

export const PostHogIdentifyProvider = ({ children }: PostHogProviderProps) => {
  // PostHog temporarily disabled
  return <>{children}</>;
};
