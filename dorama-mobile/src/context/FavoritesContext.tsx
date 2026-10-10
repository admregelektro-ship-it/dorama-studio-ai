import React, { createContext, useContext, useMemo, useState } from 'react';
const Context = createContext<{ favorites:number[]; toggle:(id:number)=>void } | null>(null);
export function FavoritesProvider({children}:{children:React.ReactNode}) {
 const [favorites,setFavorites]=useState<number[]>([]);
 const toggle=(id:number)=>setFavorites(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id]);
 const value=useMemo(()=>({favorites,toggle}),[favorites]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useFavorites(){const value=useContext(Context);if(!value)throw new Error('FavoritesProvider ausente');return value;}
