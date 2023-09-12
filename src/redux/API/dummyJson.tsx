import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { ProductType } from '../Type'


export const dummyJsonApi = createApi({
    reducerPath: "PlatziFakeStoreApi",
    baseQuery: fetchBaseQuery({ baseUrl: "https://dummyjson.com/" }),
    endpoints: (builder) => ({
        //all end points are hooks
        getAllProducts: builder.query({
            query: () => `products`,
        }),
        getProductById: builder.query<ProductType, number>({
            query: (id: number) => `products/${id}`
        }),
        getSearchProducts: builder.query<ProductType, string>({
            query: (title: string) => `products/search?q=${title}`
        }),
        getFilterProductsByCategory: builder.query<ProductType, number>({
            query: (categoryName: number) => `products/category/${categoryName}`
        }),
        getAllCategories: builder.query({
            query: () => `products/categories`,
        }),
    })
});

export const { useGetAllProductsQuery,useGetProductByIdQuery,useGetSearchProductsQuery,useGetFilterProductsByCategoryQuery,useGetAllCategoriesQuery } = dummyJsonApi;
