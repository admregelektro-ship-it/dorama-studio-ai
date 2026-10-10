// Consulta opcional ao catálogo TMDB. Use uma chave de API apropriada ao seu licenciamento.
// Nunca use uma chave secreta de backend aqui.
const API='https://api.themoviedb.org/3';
const key=process.env.EXPO_PUBLIC_TMDB_API_KEY;
type TMDBShow = {id:number;name:string;overview:string;first_air_date?:string;poster_path?:string;vote_average:number};
export async function pesquisarSeries(query:string,language='pt-BR'){
 if(!key)throw new Error('Configure EXPO_PUBLIC_TMDB_API_KEY em .env');
 const params=new URLSearchParams({api_key:key,language,query,include_adult:'false'});
 const response=await fetch(API+'/search/tv?'+params.toString());
 if(!response.ok)throw new Error('Falha ao consultar TMDB: '+response.status);
 const body=await response.json() as {results:TMDBShow[]};
 return body.results.map(show=>({id:show.id,titulo:show.name,ano:Number(show.first_air_date?.slice(0,4))||0,genero:'Série',nota:show.vote_average,imagem:show.poster_path?'https://image.tmdb.org/t/p/w500'+show.poster_path:'',sinopse:show.overview}));
}
