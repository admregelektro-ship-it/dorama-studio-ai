import React from 'react';
import { FlatList, Text, View, StyleSheet } from 'react-native';
import { DoramaCard } from './DoramaCard';
import type { Dorama } from '../types/dorama';
import { theme } from '../constants/theme';
export function DoramaRow({title,items}:{title:string;items:Dorama[]}){
 return <View style={s.row}><Text style={s.heading}>{title}</Text>
 {items.length ? <FlatList data={items} horizontal keyExtractor={item=>String(item.id)} showsHorizontalScrollIndicator={false} contentContainerStyle={s.list} renderItem={({item})=><DoramaCard dorama={item}/>} /> : <Text style={s.empty}>Seus doramas favoritos aparecerão aqui.</Text>}
 </View>;
}
const s=StyleSheet.create({row:{marginBottom:28},heading:{fontWeight:'800',fontSize:21,color:theme.text,marginLeft:20,marginBottom:14},list:{paddingHorizontal:20},empty:{color:theme.muted,paddingHorizontal:20,paddingVertical:15}});
