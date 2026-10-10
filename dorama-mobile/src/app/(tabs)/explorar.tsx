import React,{useState} from 'react';
import { View,Text,TextInput,FlatList,StyleSheet } from 'react-native';
import { doramas } from '../../data/doramas';
import { DoramaCard } from '../../components/DoramaCard';
import { theme } from '../../constants/theme';
export default function ExploreScreen(){const [search,setSearch]=useState('');const items=doramas.filter(x=>x.titulo.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
return <View style={s.container}><Text style={s.title}>Explorar doramas</Text><TextInput value={search} onChangeText={setSearch} placeholder="Buscar por título..." placeholderTextColor={theme.muted} style={s.input}/><FlatList key="explore-two-columns" data={items} numColumns={2} keyExtractor={item=>String(item.id)} columnWrapperStyle={{justifyContent:'space-around',marginBottom:24}} renderItem={({item})=><DoramaCard dorama={item}/>} ListEmptyComponent={<Text style={{color:theme.muted}}>Nenhum dorama encontrado.</Text>}/></View>}
const s=StyleSheet.create({container:{flex:1,backgroundColor:theme.background,padding:18},title:{fontSize:23,color:theme.text,fontWeight:'900',marginBottom:20},input:{backgroundColor:theme.surface,borderRadius:12,padding:15,color:theme.text,marginBottom:25}});
