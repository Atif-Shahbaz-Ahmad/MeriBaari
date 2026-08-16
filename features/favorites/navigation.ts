import { router, type Href } from 'expo-router';

export const FavoritesHref = {
  list: '/favorites' as Href,
};

export function pushFavorites() {
  router.push(FavoritesHref.list);
}
