// SDKs are downloaded after the first screen, never on the critical render path.
let cloudModule, authModule, currentUser = null;
const cloud = () => cloudModule ||= import('./firestoreSyncService');
const session = () => authModule ||= import('./cloudSession');
const invoke = (name, strict = false) => (...args) => cloud().then((m) => m[name](...args)).catch((error) => {
  if (strict) throw error;
  window.dispatchEvent(new CustomEvent('alacena-sync-error')); return false;
});
const subscribe = (load, name) => (...args) => {
  let disposed = false, unsubscribe;
  load().then((m) => { if (!disposed) unsubscribe = m[name](...args); }).catch((e) => args.at(-1)?.(e));
  return () => { disposed = true; unsubscribe?.(); };
};
export const observeCloudUser = (callback) => {
  let disposed = false, unsubscribe;
  session().then((m) => {if(!disposed)unsubscribe=m.observeUser((user) => {currentUser=user;callback(user);});}).catch(() => {if(!disposed){callback(null);window.dispatchEvent(new CustomEvent('alacena-auth-error'));}});
  return () => {disposed=true;unsubscribe?.();};
};
export const getCloudUser = () => currentUser;
export const getUserAccess = (...args) => session().then((m) => m.getUserAccess(...args));
export const connectGoogle = (...args) => session().then((m) => m.connectGoogle(...args));
export const disconnectGoogle = () => session().then((m) => m.disconnectGoogle());
export const connectReviewUser = () => session().then((m) => m.connectReviewUser());
export const subscribeToProducts = subscribe(cloud, 'subscribeToProducts');
export const subscribeToShoppingList = subscribe(cloud, 'subscribeToShoppingList');
export const subscribeToRecipes = subscribe(cloud, 'subscribeToRecipes');
export const subscribeToAuditLogs = subscribe(cloud, 'subscribeToAuditLogs');
export const subscribeToPurchaseHistory = subscribe(cloud, 'subscribeToPurchaseHistory');
export const saveProductToCloud = invoke('saveProductToCloud');
export const savePurchaseTransaction = invoke('savePurchaseTransaction');
export const deleteProductFromCloud = invoke('deleteProductFromCloud');
export const saveShoppingItemToCloud = invoke('saveShoppingItemToCloud');
export const deleteShoppingItemFromCloud = invoke('deleteShoppingItemFromCloud');
export const saveRecipeToCloud = invoke('saveRecipeToCloud');
export const deleteRecipeFromCloud = invoke('deleteRecipeFromCloud');
export const logAuditEventToCloud = invoke('logAuditEventToCloud');
export const fetchPurchaseHistoryPage = invoke('fetchPurchaseHistoryPage', true);
export const seedCloudIfEmpty = invoke('seedCloudIfEmpty', true);
export const restoreCloudSnapshot = invoke('restoreCloudSnapshot', true);
let paused = false;
export const setCloudWritesPaused = (value) => { paused = value; };
export const cloudWritesPaused = () => paused;
