import React from 'react';
import { View,Text,FlatList,StyleSheet } from 'react-native';
import { doramas } from '../../data/doramas';
import { DoramaCard } from '../../components/DoramaCard';
import { useFavorites } from '../../context/FavoritesContext';
import { theme } from '../../constants/theme';
export default function FavoritesScreen(){const {favorites}=useFavorites();const items=doramas.filter(x=>favorites.includes(x.id));return <View style={s.screen}><Text style={s.title}>Meus Favoritos</Text><FlatList key="favorite-two-columns" data={items} numColumns={2} keyExtractor={item=>String(item.id)} columnWrapperStyle={{justifyContent:'space-around',marginBottom:24}} renderItem={({item})=><DoramaCard dorama={item}/>} ListEmptyComponent={<Text style={s.empty}>Escolha um dorama e toque em ♡ Favoritar.</Text>}/></View>}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:theme.background,padding:18},title:{fontSize:23,fontWeight:'900',color:theme.text,marginBottom:22},empty:{color:theme.muted}});
