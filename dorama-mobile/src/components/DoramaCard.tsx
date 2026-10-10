import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Dorama } from '../types/dorama';
import { useFavorites } from '../context/FavoritesContext';
import { theme } from '../constants/theme';
export function DoramaCard({dorama}:{dorama:Dorama}){
 const router=useRouter();const {favorites,toggle}=useFavorites();const selected=favorites.includes(dorama.id);
 return <View style={s.wrap}>
 <Pressable onPress={()=>router.push({pathname:'/dorama/[id]',params:{id:String(dorama.id)}})} accessibilityRole="button" accessibilityLabel={'Detalhes: '+dorama.titulo}>
 <Image source={{uri:dorama.imagem}} style={s.poster}/><Text style={s.title} numberOfLines={2}>{dorama.titulo}</Text><Text style={s.meta}>{dorama.ano} • ★ {dorama.nota.toFixed(1)}</Text>
 </Pressable>
 <Pressable accessibilityRole="button" onPress={()=>toggle(dorama.id)} style={s.fav}><Text style={s.favText}>{selected?'♥ Favoritado':'♡ Favoritar'}</Text></Pressable>
 </View>;
}
const s=StyleSheet.create({wrap:{width:148,marginRight:12},poster:{width:148,height:205,borderRadius:12,backgroundColor:theme.surface},title:{color:theme.text,fontWeight:'700',fontSize:14,marginTop:9,minHeight:35},meta:{color:theme.muted,fontSize:12,marginTop:4},fav:{borderColor:'#6B408A',borderWidth:1,borderRadius:9,alignItems:'center',paddingVertical:9,marginTop:10},favText:{color:'#E5C5FF',fontSize:12,fontWeight:'700'}});
