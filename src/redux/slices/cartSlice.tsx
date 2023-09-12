import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store.tsx'
import type { ProductType } from '../Type.tsx'

const initialState: { cartList: ProductType[] } = { cartList: [] };

const cartSlice = createSlice({
  name: "Cart",
  initialState,
  reducers: {
    addTocart: (state, action: PayloadAction<ProductType>) => {
      const index: number = state.cartList.findIndex((cartItem) => cartItem.id === action.payload.id);
      if (index !== -1)
        state.cartList[index].quantity += 1;
      else
        state.cartList.push(action.payload);
    },
    removeCartItem: (state, action: PayloadAction<ProductType>) => {
      const index: number = state.cartList.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        if (state.cartList[index].quantity > 1)
          state.cartList[index].quantity -= 1;
        else
          state.cartList.splice(index, 1)
      }
    },
    clearCart: (state) => {
      state.cartList.length = 0;
    }
  },
});

export const { addTocart, removeCartItem, clearCart } = cartSlice.actions;

export const selectCart = (state: RootState) => state.Cart.cartList


export default cartSlice.reducer;
