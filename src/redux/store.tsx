import storage from "redux-persist/lib/storage";
import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import {dummyJsonApi} from './API/dummyJson'
import cartSlice from "./slices/cartSlice";
import favoriteSlice from "./slices/favoriteSlice";

const persistCartConfig = { key: "Cart-persist", storage };

const persistFavoriteConfig = { key: "Favorite-persist", storage };

const persistedCartReducer = persistReducer(persistCartConfig, cartSlice);
const persistedfavoriteReducer = persistReducer(persistFavoriteConfig, favoriteSlice);

export const store = configureStore({
  reducer: {
      Cart: persistedCartReducer,
      Facorite: persistedfavoriteReducer,
      dummyJsonApi : dummyJsonApi.reducer
  },
  middleware : (getDefaultMiddleware)=> getDefaultMiddleware({serializableCheck : false}).concat([dummyJsonApi.middleware])
});

export const persistor = persistStore(store);
// TYPES
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;



