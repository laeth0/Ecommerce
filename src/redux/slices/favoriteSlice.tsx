import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store.tsx'
import type {ProductType} from '../Type.tsx'

const initialState: {favorite: ProductType[] } = { favorite: [] };

const favoriteSlice = createSlice({
  name: "Favorite",
  initialState,
  reducers: {
    addFavorite: (state, action: PayloadAction<ProductType>) => {
      if (state.favorite.find((item: ProductType)=>item.title === action.payload.title))
        return;
      else 
        state.favorite.push(action.payload);
    },
    removeFavorite: (state, action: PayloadAction<ProductType>) => {
      if (state.favorite.findIndex((item: ProductType) => item.title === action.payload.title) === -1) 
        return;
      else {
        state.favorite = state.favorite.filter((item: ProductType) => item.title !== action.payload.title);
      }
    },
  },
});

export const { addFavorite, removeFavorite } =favoriteSlice.actions;

export const selectFavorite = (state: RootState) => state.Favorite.favorite

export default favoriteSlice.reducer;
