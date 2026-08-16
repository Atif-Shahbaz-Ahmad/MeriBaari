import { router, type Href } from 'expo-router';

export const SubscriptionHref = {
  welcome: '/(business)/subscription/welcome' as Href,
  pay: '/(business)/subscription' as Href,
  submitted: '/(business)/subscription/submitted' as Href,
} as const;

export function pushSubscriptionWelcome() {
  router.push(SubscriptionHref.welcome);
}

export function replaceSubscriptionWelcome() {
  router.replace(SubscriptionHref.welcome);
}

export function pushSubscriptionPay() {
  router.push(SubscriptionHref.pay);
}

export function replaceSubscriptionPay() {
  router.replace(SubscriptionHref.pay);
}

export function replaceSubscriptionSubmitted() {
  router.replace(SubscriptionHref.submitted);
}
