import React from 'react';
import { ScrollView, View, Text, ImageBackground, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doramas,lancamentos } from '../../data/doramas';
import { DoramaRow } from '../../components/DoramaRow';
import { useFavorites } from '../../context/FavoritesContext';
import { theme } from '../../constants/theme';
export default function HomeScreen(){
 const router=useRouter();const {favorites,toggle}=useFavorites();const hero=doramas[0];
 return <ScrollView style={s.screen} contentContainerStyle={{paddingBottom:42}}>
 <View style={s.header}><Text style={s.logo}>DORAMA STUDIO</Text><Text style={s.sub}>Seu universo de doramas</Text></View>
 <ImageBackground source={{uri:hero.imagem}} style={s.banner} imageStyle={{borderRadius:18}}>
 <LinearGradient colors={['transparent','rgba(11,9,19,0.55)',theme.background]} style={s.gradient}>
 <Text style={s.label}>✦ DESTAQUE DA SEMANA</Text><Text style={s.title}>{hero.titulo}</Text><Text style={s.meta}>★ {hero.nota.toFixed(1)} • {hero.ano} • {hero.genero}</Text>
 <Text style={s.synopsis} numberOfLines={2}>{hero.sinopse}</Text>
 <View style={s.actions}><Pressable style={s.mainButton} onPress={()=>router.push({pathname:'/dorama/[id]',params:{id:String(hero.id)}})}><Text style={s.mainButtonText}>▶ Ver detalhes</Text></Pressable><Pressable style={s.otherButton} onPress={()=>toggle(hero.id)}><Text style={s.mainButtonText}>{favorites.includes(hero.id)?'♥ Salvo':'♡ Minha lista'}</Text></Pressable></View>
 </LinearGradient></ImageBackground>
 <DoramaRow title="Mais Populares" items={doramas}/><DoramaRow title="Lançamentos" items={lancamentos}/><DoramaRow title="Meus Favoritos" items={doramas.filter(x=>favorites.includes(x.id))}/>
 </ScrollView>;
}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:theme.background},header:{paddingHorizontal:20,paddingVertical:20},logo:{fontSize:25,fontWeight:'900',letterSpacing:1.2,color:'#C084FC'},sub:{fontSize:13,color:theme.muted,marginTop:5},banner:{height:445,marginHorizontal:14,borderRadius:18,overflow:'hidden',marginBottom:30},gradient:{flex:1,justifyContent:'flex-end',paddingHorizontal:18,paddingBottom:24},label:{fontSize:11,color:'#E9C5FF',fontWeight:'900',marginBottom:8},title:{color:'white',fontWeight:'900',fontSize:29},meta:{color:'#E2DCEB',marginTop:8,fontSize:12},synopsis:{color:'#EEE9F2',marginTop:12,lineHeight:19,fontSize:13},actions:{flexDirection:'row',gap:10,marginTop:18},mainButton:{paddingHorizontal:16,paddingVertical:13,borderRadius:10,backgroundColor:theme.purple},otherButton:{paddingHorizontal:16,paddingVertical:13,borderRadius:10,backgroundColor:'rgba(255,255,255,0.2)'},mainButtonText:{color:'white',fontWeight:'800',fontSize:13}});
