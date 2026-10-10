import React from 'react';
import { View,Text,ImageBackground,ScrollView,Pressable,StyleSheet,Linking,Alert } from 'react-native';
import { useLocalSearchParams,useRouter,Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { doramas } from '../../data/doramas';
import { theme } from '../../constants/theme';
import { useFavorites } from '../../context/FavoritesContext';
export default function DetailScreen(){
 const {id}=useLocalSearchParams<{id:string}>();const router=useRouter();const d=doramas.find(x=>String(x.id)===id);
 const {favorites,toggle}=useFavorites();if(!d)return <View style={s.screen}><Stack.Screen options={{headerShown:false}}/><Text style={s.title}>Dorama não encontrado</Text><Pressable onPress={()=>router.back()}><Text style={s.link}>Voltar</Text></Pressable></View>;
 const rating=Math.max(0,Math.min(5,Math.round(d.nota/2)));
 async function trailer(){const url=d?.trailer || 'https://www.youtube.com/results?search_query='+encodeURIComponent(d!.titulo+' '+d!.ano+' trailer oficial');try{await Linking.openURL(url)}catch{Alert.alert('Não foi possível abrir o trailer')}}
 return <ScrollView style={s.screen} contentContainerStyle={{paddingBottom:40}}><Stack.Screen options={{headerShown:false}}/>
 <ImageBackground source={{uri:d.imagem}} style={s.poster}><LinearGradient colors={['rgba(0,0,0,0.45)','transparent',theme.background]} style={s.gradient}>
 <Pressable onPress={()=>router.back()} style={s.back}><Text style={{color:'white',fontSize:26}}>←</Text></Pressable>
 <View><Text style={s.label}>DORAMA STUDIO</Text><Text style={s.title}>{d.titulo}</Text><Text style={s.meta}>{d.ano} • {d.genero}</Text><Text style={s.stars}>{'★'.repeat(rating)}{'☆'.repeat(5-rating)} <Text style={s.meta}> {d.nota.toFixed(1)}/10</Text></Text></View>
 </LinearGradient></ImageBackground>
 <View style={s.details}><Text style={s.heading}>Sinopse</Text><Text style={s.synopsis}>{d.sinopse}</Text>
 <Pressable style={s.trailer} onPress={trailer}><Text style={s.trailerText}>▶ Assistir Trailer</Text></Pressable>
 <Pressable onPress={()=>toggle(d.id)} style={s.favorite}><Text style={s.trailerText}>{favorites.includes(d.id)?'♥ Remover dos favoritos':'♡ Adicionar aos favoritos'}</Text></Pressable>
 <Text style={s.note}>O botão abre uma busca pelo trailer oficial enquanto a integração TMDB não estiver ativa.</Text></View>
 </ScrollView>;
}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:theme.background},poster:{height:540},gradient:{flex:1,justifyContent:'space-between',padding:22},back:{width:44,height:44,borderRadius:24,backgroundColor:'rgba(0,0,0,0.5)',alignItems:'center',justifyContent:'center',marginTop:24},label:{color:'#DBB9FB',fontSize:11,fontWeight:'900',letterSpacing:2},title:{fontSize:34,color:theme.text,fontWeight:'900',marginTop:10},meta:{color:'#DDD3EA',marginTop:10,fontSize:13},stars:{color:theme.yellow,fontSize:24,marginTop:14},details:{padding:24},heading:{color:theme.text,fontSize:22,fontWeight:'900',marginBottom:15},synopsis:{color:'#CBC4D5',fontSize:15,lineHeight:25,marginBottom:25},trailer:{backgroundColor:theme.purple,borderRadius:13,padding:17,alignItems:'center'},trailerText:{color:'white',fontWeight:'800',fontSize:16},favorite:{borderColor:'#704399',borderWidth:1,padding:16,alignItems:'center',borderRadius:13,marginTop:12},note:{color:theme.muted,fontSize:12,marginTop:22},link:{color:theme.purple,margin:24}});
