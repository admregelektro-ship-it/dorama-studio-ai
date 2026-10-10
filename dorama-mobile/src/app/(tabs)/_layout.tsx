import React from 'react';
import { Tabs } from 'expo-router';
export default function TabsLayout(){
 return <Tabs screenOptions={{headerStyle:{backgroundColor:'#0B0913'},headerTintColor:'#FFFFFF',tabBarStyle:{backgroundColor:'#191526',borderTopColor:'#292238'},tabBarActiveTintColor:'#C084FC',tabBarInactiveTintColor:'#B7B0C4'}}>
 <Tabs.Screen name="index" options={{title:'Início',tabBarIcon:()=>null}}/>
 <Tabs.Screen name="explorar" options={{title:'Explorar',tabBarIcon:()=>null}}/>
 <Tabs.Screen name="favoritos" options={{title:'Favoritos',tabBarIcon:()=>null}}/>
 </Tabs>;
}
