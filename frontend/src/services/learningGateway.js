const load = () => import('./learningService');
export const learnProduct = (...args) => load().then((m) => m.learnProduct(...args));
export const trackConsumption = (...args) => load().then((m) => m.trackConsumption(...args));
export const findLearnedProduct = (...args) => load().then((m) => m.findLearnedProduct(...args));
