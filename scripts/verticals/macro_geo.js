const CONTINENTS=[
 {id:'accel',name:'TECH OPTIMISTS',cx:500,cy:420,rx:305,ry:232,rot:-.2,seed:11,rug:.30,
  junction:[520,435],mountains:true,palette:{low:'#b3c892',up:'#d9c795',high:'#bc9468'},
  label:{x:500,y:412,w:250,size:32},
  countries:[
   {id:'eacc',a0:-0.38,a1:1.8},
   {id:'progress',a0:3.34,a1:5.9},
   {id:'hardtech',a0:1.8,a1:3.34}]},
 {id:'epist',name:'AI SAFETY & RATIONALITY',cx:2150,cy:350,rx:245,ry:205,rot:.15,seed:23,rug:.27,
  junction:[2140,345],mountains:true,palette:{low:'#b7c795',up:'#dcc99a',high:'#b8placeholder'},
  label:{x:2150,y:345,w:200,size:22},
  countries:[
   {id:'doomers',a0:2.25,a1:4.35},
   {id:'rationalists',a0:4.35,a1:6.85},
   {id:'ea',a0:0.57,a1:2.25}]},
 {id:'vital',name:'HEALTH & LONGEVITY',cx:1400,cy:250,rx:215,ry:152,rot:-.1,seed:37,rug:.26,
  junction:[1395,245],mountains:false,palette:{low:'#bfcb93',up:'#ddca97',high:'#bc9468'},
  label:{x:1400,y:245,w:170,size:24},
  countries:[
   {id:'longevity',a0:1.62,a1:5.03},
   {id:'maha',a0:-1.25,a1:1.62}]},
 {id:'sover',name:'THE ONLINE RIGHT',cx:1600,cy:1380,rx:238,ry:108,rot:.05,seed:41,rug:.28,
  junction:null,mountains:false,trees:true,palette:{low:'#9db183',up:'#c2bd8d',high:'#a68a62'},
  label:{x:1600,y:1372,w:210,size:24,ls:.3},
  countries:[{id:'nrx',a0:0,a1:6.283}]},
 {id:'interior',name:'POST-RATIONALITY',cx:1300,cy:900,rx:182,ry:158,rot:.3,seed:53,rug:.29,
  junction:[1295,905],mountains:true,palette:{low:'#b9c490',up:'#dbc99b',high:'#b28f66'},
  label:{x:1300,y:901,w:160,size:22},
  countries:[
   {id:'tpot',a0:-2.45,a1:0.82},
   {id:'nondual',a0:0.82,a1:3.83}]},
 {id:'chain',name:'CRYPTO',cx:550,cy:1300,rx:322,ry:232,rot:.1,seed:67,rug:.31,
  junction:[540,1295],mountains:true,palette:{low:'#c2be8b',up:'#dcc795',high:'#b18a5e'},
  label:{x:550,y:1292,w:260,size:40},
  countries:[
   {id:'btc',a0:2.62,a1:4.42},
   {id:'eth',a0:-0.72,a1:1.22},
   {id:'defi',a0:1.22,a1:2.62}]},
 {id:'degrowthland',name:'',cx:2380,cy:1050,rx:200,ry:160,rot:-.15,seed:79,rug:.28,
  junction:null,mountains:false,trees:true,palette:{low:'#a8c687',up:'#cdc48e',high:'#ab8c60'},
  countries:[{id:'degrowth',a0:0,a1:6.283}]},
 {id:'regenisle',name:'',cx:140,cy:960,rx:150,ry:105,rot:-.1,seed:83,rug:.3,
  junction:null,mountains:false,trees:true,palette:{low:'#a4cd8a',up:'#cbc98e',high:'#a98e5e'},
  islets:[{dx:190,dy:40,r:20}],
  countries:[{id:'regens',a0:0,a1:6.283}]},
 {id:'exit',name:'',cx:900,cy:1750,rx:96,ry:62,rot:.35,seed:97,rug:.34,
  junction:null,mountains:false,palette:{low:'#b8c491',up:'#d8c795',high:'#bc9468'},
  islets:[{dx:-130,dy:52,r:26},{dx:118,dy:-38,r:20},{dx:24,dy:96,r:15}],
  countries:[{id:'netstate',a0:0,a1:6.283}]},
 {id:'degen',name:'',cx:-80,cy:1650,rx:84,ry:58,rot:-.25,seed:101,rug:.36,
  junction:null,mountains:true,palette:{low:'#a8a186',up:'#bfae87',high:'#8d6b4c'},
  islets:[{dx:126,dy:-30,r:22},{dx:-108,dy:44,r:17}],
  countries:[{id:'degens',a0:0,a1:6.283}]},
 {id:'indie',name:'',cx:450,cy:850,rx:74,ry:47,rot:.15,seed:113,rug:.33,
  junction:null,mountains:false,palette:{low:'#b6c893',up:'#d6c493',high:'#bc9468'},
  islets:[{dx:104,dy:30,r:18},{dx:-96,dy:-26,r:14}],
  countries:[{id:'indie',a0:0,a1:6.283}]},
 /* mainstream tier: big settled continents at the edges of the world */
 {id:'m-maga',name:'',kicker:'MAINSTREAM',big:true,cx:1550,cy:1880,rx:430,ry:270,rot:.06,seed:131,rug:.2,
  junction:null,mountains:true,palette:{low:'#b7bd9c',up:'#d6c9a2',high:'#b59a74'},
  countries:[{id:'maga',a0:0,a1:6.283}]},
 {id:'m-progleft',name:'',kicker:'MAINSTREAM',big:true,cx:2900,cy:180,rx:320,ry:310,rot:-.08,seed:137,rug:.25,
  junction:null,mountains:false,trees:true,palette:{low:'#aec2a2',up:'#cfc7a0',high:'#ab9070'},
  countries:[{id:'progleft',a0:0,a1:6.283}]},
 {id:'m-estab',name:'',kicker:'MAINSTREAM',big:true,cx:650,cy:-300,rx:430,ry:210,rot:.03,seed:139,rug:.22,
  junction:null,mountains:false,palette:{low:'#b3bfa6',up:'#d2cbaa',high:'#b2a07f'},
  countries:[{id:'establishment',a0:0,a1:6.283}]},
 {id:'m-finance',name:'',kicker:'MAINSTREAM',big:true,cx:-400,cy:-120,rx:380,ry:300,rot:-.05,seed:149,rug:.23,
  junction:null,mountains:true,palette:{low:'#b9bfa4',up:'#d8cca6',high:'#b49b76'},
  countries:[{id:'finance',a0:0,a1:6.283}]},
 {id:'m-christian',name:'',kicker:'MAINSTREAM',big:true,cx:3060,cy:1350,rx:230,ry:640,rot:.02,seed:151,rug:.2,
  junction:null,mountains:false,trees:true,palette:{low:'#b2c19e',up:'#d3c8a2',high:'#ae9572'},
  countries:[{id:'christian',a0:0,a1:6.283}]},
 {id:'m-stan',name:'',kicker:'MAINSTREAM',big:true,cx:2620,cy:-330,rx:370,ry:240,rot:-.04,seed:157,rug:.26,
  junction:null,mountains:false,palette:{low:'#bcc0a0',up:'#dbcda8',high:'#b79d78'},
  countries:[{id:'stan',a0:0,a1:6.283}]},
 {id:'m-sports',name:'',kicker:'MAINSTREAM',big:true,cx:1700,cy:-330,rx:340,ry:230,rot:.07,seed:163,rug:.25,
  junction:null,mountains:false,palette:{low:'#b5c2a0',up:'#d5caa4',high:'#b09873'},
  countries:[{id:'sports',a0:0,a1:6.283}]},
 /* the wider world: the giant ontologies the discourse map forgets, at the far edges */
 {id:'w-china',name:'',kicker:'THE WIDER WORLD',big:true,cx:-700,cy:-820,rx:380,ry:240,rot:.04,seed:167,rug:.21,
  junction:null,mountains:false,palette:{low:'#b2bd97',up:'#d3c79d',high:'#af9670'},
  countries:[{id:'china',a0:0,a1:6.283}]},
 {id:'w-catholic',name:'',kicker:'THE WIDER WORLD',big:true,cx:1050,cy:-880,rx:300,ry:210,rot:-.05,seed:173,rug:.22,
  junction:null,mountains:false,trees:true,palette:{low:'#aec1a0',up:'#cfc7a2',high:'#ac9271'},
  countries:[{id:'catholic',a0:0,a1:6.283}]},
 {id:'w-islam',name:'',kicker:'THE WIDER WORLD',big:true,cx:2450,cy:-950,rx:420,ry:220,rot:.03,seed:179,rug:.2,
  junction:null,mountains:false,palette:{low:'#bcc09b',up:'#dccda6',high:'#b59b74'},
  countries:[{id:'islam',a0:0,a1:6.283}]},
 {id:'w-socialist',name:'',kicker:'THE WIDER WORLD',cx:3600,cy:-550,rx:150,ry:110,rot:-.1,seed:181,rug:.27,
  junction:null,mountains:false,palette:{low:'#adc09b',up:'#cec59c',high:'#aa8f6a'},
  countries:[{id:'socialist',a0:0,a1:6.283}]},
 {id:'w-india',name:'',kicker:'THE WIDER WORLD',big:true,cx:3900,cy:300,rx:330,ry:260,rot:.08,seed:191,rug:.23,
  junction:null,mountains:false,trees:true,palette:{low:'#b8c295',up:'#d8caa0',high:'#b29671'},
  countries:[{id:'india',a0:0,a1:6.283}]},
 {id:'w-postliberal',name:'',kicker:'THE WIDER WORLD',cx:3800,cy:950,rx:140,ry:100,rot:.12,seed:193,rug:.28,
  junction:null,mountains:false,trees:true,palette:{low:'#b0c19d',up:'#d0c6a0',high:'#ad9370'},
  countries:[{id:'postliberal',a0:0,a1:6.283}]},
 {id:'w-indigenous',name:'',kicker:'THE WIDER WORLD',big:true,cx:3850,cy:2300,rx:290,ry:210,rot:-.06,seed:197,rug:.24,
  junction:null,mountains:false,trees:true,palette:{low:'#a6c48c',up:'#ccc593',high:'#a98d61'},
  countries:[{id:'indigenous',a0:0,a1:6.283}]},
 {id:'w-refusal',name:'',kicker:'THE WIDER WORLD',cx:3300,cy:2700,rx:150,ry:100,rot:.1,seed:199,rug:.29,
  junction:null,mountains:false,trees:true,palette:{low:'#aac795',up:'#cdc79c',high:'#ab9068'},
  countries:[{id:'refusal',a0:0,a1:6.283}]},
 {id:'w-pentecostal',name:'',kicker:'THE WIDER WORLD',big:true,cx:2750,cy:2600,rx:240,ry:165,rot:-.04,seed:211,rug:.23,
  junction:null,mountains:false,palette:{low:'#b6c497',up:'#d6c9a0',high:'#b19772'},
  countries:[{id:'pentecostal',a0:0,a1:6.283}]},
 {id:'w-manosphere',name:'',kicker:'THE WIDER WORLD',big:true,cx:2150,cy:2500,rx:160,ry:105,rot:.14,seed:223,rug:.3,
  junction:null,mountains:false,palette:{low:'#b0b18d',up:'#c9bc90',high:'#9d7f58'},
  countries:[{id:'manosphere',a0:0,a1:6.283}]},
 {id:'w-witchtok',name:'',kicker:'THE WIDER WORLD',cx:1650,cy:2680,rx:110,ry:80,rot:-.2,seed:227,rug:.32,
  junction:null,mountains:false,trees:true,palette:{low:'#a3bb90',up:'#c3bd93',high:'#9f8663'},
  countries:[{id:'witchtok',a0:0,a1:6.283}]},
 {id:'w-manifestation',name:'',kicker:'THE WIDER WORLD',big:true,cx:1050,cy:2600,rx:230,ry:150,rot:.06,seed:229,rug:.26,
  junction:null,mountains:false,palette:{low:'#bcc39a',up:'#dccaa5',high:'#b39872'},
  countries:[{id:'manifestation',a0:0,a1:6.283}]},
 {id:'w-conspiracy',name:'',kicker:'THE WIDER WORLD',big:true,cx:250,cy:2550,rx:240,ry:160,rot:-.08,seed:233,rug:.31,
  junction:null,mountains:false,palette:{low:'#aaa98a',up:'#c2b68c',high:'#8f7354'},
  countries:[{id:'conspiracy',a0:0,a1:6.283}]},
 {id:'w-hustle',name:'',kicker:'THE WIDER WORLD',big:true,cx:-800,cy:2100,rx:240,ry:160,rot:.09,seed:239,rug:.27,
  junction:null,mountains:false,palette:{low:'#bdc192',up:'#dcc79b',high:'#b2926a'},
  countries:[{id:'hustle',a0:0,a1:6.283}]},
 {id:'w-dacc',name:'',kicker:'THE WIDER WORLD',cx:-1000,cy:900,rx:160,ry:110,rot:-.12,seed:241,rug:.28,
  junction:null,mountains:false,trees:true,palette:{low:'#a9c78f',up:'#cdc697',high:'#a98e62'},
  countries:[{id:'dacc',a0:0,a1:6.283}]},
 {id:'w-liminal',name:'',kicker:'THE WIDER WORLD',cx:2620,cy:1760,rx:95,ry:70,rot:.18,seed:251,rug:.3,
  junction:null,mountains:false,trees:true,palette:{low:'#b1c496',up:'#d2c79d',high:'#ae9370'},
  countries:[{id:'liminal',a0:0,a1:6.283}]}
];
/* fix a typo-safe palette value */
CONTINENTS[1].palette.high='#b89064';

/* the waters: ontologies that are not land. Labels drawn on the sea; each label
   point is a hover target. The neoliberalism ocean IS the ocean; the nihilist
   trench is a dark deep, named but not steelmanned. */
const OCEANS=[
 {id:'ocean',t:'THE NEOLIBERALISM OCEAN',x:1600,y:-700,w:300,size:30,arc:1800},
 {id:'ocean',t:'THE NEOLIBERALISM OCEAN',x:-1100,y:350,w:240,size:20,arc:-1600},
 {id:'ocean',t:'THE NEOLIBERALISM OCEAN',x:3600,y:1650,w:240,size:20,arc:1600},
 {id:'nihilists',t:'THE NIHILIST TRENCH',x:1450,y:2880,w:200,size:22,arc:2200}
];

/* rivers: none — the discourse flows through quote-tweets, not rivers */
const FLOWS=[];

const BESPOKE=[
 {id:'georgists',parent:'progress',dx:-30,dy:55},
 {id:'girardians',parent:'nrx',dx:95,dy:28},
 {id:'landian',parent:'eacc',dx:60,dy:-45},
 {id:'metamodern',parent:'tpot',dx:42,dy:-32},
 {id:'forecasters',parent:'rationalists',dx:72,dy:-22},
 {id:'cryonics',parent:'longevity',dx:52,dy:42},
 {id:'pronatalists',parent:'maha',dx:-42,dy:52},
 {id:'doomeroptimists',parent:'degrowth',dx:42,dy:62},
 {id:'remilia',parent:'degens',dx:-18,dy:22},
 {id:'cozyweb',parent:'indie',dx:-14,dy:26},
 {id:'tradcaths',parent:'christian',dx:-90,dy:-42},
 {id:'wsb',parent:'finance',dx:-62,dy:85},
 {id:'astrology',x:1150,y:1180,islet:20},
 {id:'ufo',x:-430,y:1180,islet:22}
];

/* per-vertical runtime config (read by the cine paths + flyover3d.js) */
window.__vert={
 name:'macro',
 noMainland:true,
 weight:{sports:1600000000000,christian:1280000000000,astrology:1024000000000,stan:819200000000,maga:655360000000,progleft:524288000000,establishment:419430400000,finance:335544320000,maha:268435456000,ufo:214748364800,tradcaths:171798691840,btc:137438953472,wsb:109951162777,degrowth:87960930222,longevity:70368744177,nondual:56294995342,eth:45035996273,defi:36028797018,degens:28823037615,indie:23058430092,ea:18446744073,rationalists:14757395258,doomers:11805916207,progress:9444732965,hardtech:7555786372,eacc:6044629098,tpot:4835703278,regens:3868562622,pronatalists:3094850098,nrx:2475880078,netstate:1980704062,forecasters:1584563250,georgists:1267650600,metamodern:1014120480,doomeroptimists:811296384,cryonics:649037107,girardians:519229685,cozyweb:415383748,landian:332306998,remilia:265845599},
 paperKick:true,
 POP:["sports", "christian", "stan", "maga", "progleft", "establishment", "finance", "btc", "eth"],
 NICHE:["eacc", "doomers", "rationalists", "tpot", "nrx", "regens", "nondual", "degens"],
 sub:'THE FIELD MAP OF THE FEED',
 cineKick:'THE TRIBES OF X',
 cineLine:'a field map of the feed — here be discourse, surveyed day by day',
 cardTitle:'The Tribes of X',
 LOOK:{
  sports:       { walls:[0xb8d8a8,0xa8cc96,0x96c084,0xc8e4b8], roof:0x2a8a3c, keep:0xe8e8e8, style:'flat', name:'The Stadium' },
  christian:    { walls:[0xf2eee0,0xe8e2cf,0xdcd5bd,0xf7f4ea], roof:0x8a6a2a, keep:0xd8b13a, style:'dome', name:'The Cathedral' },
  stan:         { walls:[0xe0d0ec,0xd4c0e4,0xc8b0dc,0xece0f4], roof:0x7d3ac8, keep:0xb05ae8, style:'cone', name:'The Idol Shrine' },
  maga:         { walls:[0xe8dcd0,0xdccfbe,0xd0c2ae,0xf0e8dc], roof:0xb03030, keep:0x2a4a8a, style:'fort', name:'The Rally Grounds' },
  progleft:     { walls:[0xe4c8c0,0xdcb8ae,0xd0a89c,0xecd8d2], roof:0xa02828, keep:0xc84040, style:'cone', name:'The Commune Hall' },
  establishment:{ walls:[0xd8d8d0,0xccccc2,0xc0c0b4,0xe4e4dc], roof:0x4a4a44, keep:0x8a8a80, style:'dome', name:'The Editorial Board' },
  finance:      { walls:[0xc8d0dc,0xb8c2d2,0xa8b4c8,0xd8dee8], roof:0x1a3a5c, keep:0x2a5db0, style:'tower', name:'The Terminal' },
  btc:          { walls:[0xe0b36a,0xd9a24f,0xc9963f,0xb3823a], roof:0x3a3630, keep:0xf7931a, style:'fort', name:'The Citadel' },
  eth:          { walls:[0xb7c3e8,0x9fb0e0,0x8a9cd8,0xcdd6f0], roof:0x4a5aa8, keep:0x627eea, style:'crystal', name:'The World Computer' },
  nondual:      { walls:[0xd8cce8,0xccbce0,0xc0acd8,0xe4daf0], roof:0x6a4a8a, keep:0xb05ae8, style:'dome', name:'The Integration Dome' },
  eacc:         { walls:[0xe8a05a,0xe0904a,0xd8803a,0xf0b06a], roof:0x151218, keep:0xffe25c, style:'tower', name:'The Entropy Forge' },
  doomers:      { walls:[0x9aa89a,0x8a988a,0x7a887a,0xaab8aa], roof:0x3a4a3a, keep:0xd8b13a, style:'dome', name:'The Containment Vault' },
  rationalists: { walls:[0xa8d8d0,0x90c8c0,0x78b8b0,0xc0e8e0], roof:0x3a8a80, keep:0x63b8a8, style:'dome', name:'The Sequence Library' },
  tpot:         { walls:[0xe8d8c8,0xdcc8b6,0xd0bca2,0xf0e4d8], roof:0xc08858, keep:0xe8a05a, style:'cone', name:'The Group House' },
  nrx:          { walls:[0x4a4438,0x5a523f,0x3a352c,0x6a6049], roof:0x151218, keep:0x8a8a80, style:'tower', name:'The Dark Castle' },
  regens:       { walls:[0xb5a878,0xa89868,0x988a5c,0xc0b088], roof:0x5c8a3c, keep:0x4f8136, style:'cone', name:'The Greenhouse' },
  astrology:    { walls:[0xd0c8e8,0xc2b8e0,0xb4a8d8,0xe0d8f0], roof:0x3a2a6a, keep:0xffe25c, style:'dome', name:'The Observatory' },
  degens:       { walls:[0xe8c8d8,0xc8d8e8,0xd8e8c8,0xe8e0c0], roof:0xe84a90, keep:0xffd400, style:'cone', name:'The Degen Pit' }
 }
};

/* only surveyed tribes get land; unsurveyed isles stay beneath the sea */
{
  const __ACTIVE=new Set(["eacc", "progress", "hardtech", "rationalists", "doomers", "ea", "tpot", "nondual", "btc", "eth", "defi", "degens", "regens", "degrowth", "longevity", "maha", "nrx", "netstate", "indie", "maga", "progleft", "establishment", "finance", "christian", "stan", "sports", "georgists", "girardians", "landian", "metamodern", "forecasters", "cryonics", "pronatalists", "doomeroptimists", "remilia", "cozyweb", "tradcaths", "wsb", "astrology", "ufo"]);
  for(let i=CONTINENTS.length-1;i>=0;i--){
    const C=CONTINENTS[i];
    C.countries=C.countries.filter(cc=>__ACTIVE.has(cc.id));
    if(!C.countries.length){CONTINENTS.splice(i,1);continue}
    if(C.countries.length===1){C.countries[0].a0=0;C.countries[0].a1=6.283}
  }
  for(let i=BESPOKE.length-1;i>=0;i--)
    if(!__ACTIVE.has(BESPOKE[i].id)||!__ACTIVE.has(BESPOKE[i].parent))BESPOKE.splice(i,1);
  window.__vert.ISLES=CONTINENTS.map(C=>[C.cx,C.cy,C.rx,C.ry]);
}
