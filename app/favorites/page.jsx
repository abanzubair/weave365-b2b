export const metadata = {
  title: 'My Saved Favorites | Weave 365',
  robots: {
    index: false,
    follow: false,
  },
};

import FavoritesClient from './FavoritesClient.jsx';

export default function FavoritesRoute() {
  return <FavoritesClient />;
}
