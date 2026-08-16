import { router, type Href } from 'expo-router';

export const ReviewsHref = {
  rateTicket: (ticketId: string) => `/tickets/${ticketId}/rate` as Href,
  ownerList: '/(business)/reviews' as Href,
};

export function pushRateTicket(ticketId: string) {
  router.push(ReviewsHref.rateTicket(ticketId));
}

export function pushOwnerReviews() {
  router.push(ReviewsHref.ownerList);
}
