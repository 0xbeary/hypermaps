import { useHypergraphAuth } from '@graphprotocol/hypergraph-react';
import { createRootRoute, Link, Outlet, useLayoutEffect, useRouter } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Logout } from '../components/logout';

const Root = () => {
  const { authenticated } = useHypergraphAuth();
  const router = useRouter();

  useLayoutEffect(() => {
    if (
      router.state.location.href.startsWith('/login') ||
      router.state.location.href.startsWith('/authenticate-success')
    ) {
      return;
    }

    if (!authenticated) {
      router.navigate({
        to: '/login',
      });
    }
  }, [authenticated, router]);

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold mb-4">My Hypergraph App</h1>
          <Link to="/">Home</Link>
          <Logout />
        </div>
        <Outlet />
      </div>
      <TanStackRouterDevtools />
    </>
  );
};

export const Route = createRootRoute({
  component: Root,
});
