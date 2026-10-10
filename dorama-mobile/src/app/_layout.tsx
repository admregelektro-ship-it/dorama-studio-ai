import React from 'react';
import { Stack } from 'expo-router';
import { FavoritesProvider } from '../context/FavoritesContext';
export default function RootLayout(){
 return <FavoritesProvider><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:'#0B0913'}}}><Stack.Screen name="(tabs)"/><Stack.Screen name="dorama/[id]"/></Stack></FavoritesProvider>;
}
