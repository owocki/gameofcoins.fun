const CONTINENTS=[
 {id:'k-citadels',region:true,name:'THE CLOSED CITADELS',kicker:'THE CLOSED CITADELS',dyn:true,a0start:2.9,
  cx:1400,cy:-480,rx:840,ry:330,rot:.02,seed:11,rug:.22,junction:[1400,-480],
  label:{x:1400,y:-500,w:300,size:30},trees:false,mountains:false,
  palette:{low:'#b3bba6',up:'#d0ccb0',high:'#a8a08a'},
  countries:[{id:'openai',big:true},{id:'anthropic',big:true},{id:'deepmind',big:true},{id:'xai',big:true}]},
 {id:'k-bazaar',region:true,name:'THE TOOLING BAZAAR',kicker:'THE TOOLING BAZAAR',dyn:true,a0start:1.4,
  cx:1300,cy:700,rx:780,ry:420,rot:-.04,seed:23,rug:.24,junction:[1300,700],
  label:{x:1300,y:690,w:300,size:30},mountains:false,
  palette:{low:'#b7c795',up:'#dcc99a',high:'#b89064'},
  countries:[{id:'vibecoding',big:true},{id:'agents',big:true},{id:'venice'}]},
 {id:'k-marches',region:true,name:'THE ALIGNMENT MARCHES',kicker:'THE ALIGNMENT MARCHES',dyn:true,a0start:0.6,
  cx:500,cy:2050,rx:600,ry:360,rot:.06,seed:83,rug:.26,junction:[500,2050],
  label:{x:500,y:2040,w:280,size:26},trees:true,mountains:false,
  palette:{low:'#a8b99c',up:'#c4c0a0',high:'#98876a'},
  countries:[{id:'aisafety',big:true},{id:'eacc',big:true}]},
 {id:'k-dynasties',region:true,name:'THE EASTERN DYNASTIES',kicker:'THE EASTERN DYNASTIES',dyn:true,a0start:2.2,
  cx:3050,cy:1000,rx:600,ry:500,rot:.03,seed:53,rug:.23,junction:[3050,1000],
  label:{x:3050,y:990,w:280,size:24},mountains:false,
  palette:{low:'#d9c795',up:'#e2cf9e',high:'#bc9468'},
  countries:[{id:'deepseek',big:true},{id:'qwen',big:true},{id:'kimi',big:true}]},
 {id:'k-plains',region:true,name:'THE OPEN-WEIGHTS PLAINS',kicker:'THE OPEN-WEIGHTS PLAINS',dyn:true,a0start:0.9,
  cx:-950,cy:150,rx:640,ry:460,rot:-.05,seed:113,rug:.27,junction:[-950,150],
  label:{x:-950,y:140,w:280,size:24},mountains:false,
  palette:{low:'#b3c892',up:'#d9c795',high:'#bc9468'},
  countries:[{id:'metallama',big:true},{id:'mistral',big:true},{id:'localllama',big:true}]},
 {id:'k-forges',region:true,name:'THE DREAM FORGES',kicker:'THE DREAM FORGES',dyn:true,a0start:3.9,
  cx:-800,cy:1350,rx:620,ry:320,rot:.04,seed:149,rug:.3,junction:[-800,1350],
  label:{x:-800,y:1340,w:240,size:26},mountains:false,
  palette:{low:'#b0a8a0',up:'#c9bc9e',high:'#9d7f6a'},
  countries:[{id:'genmedia',big:true},{id:'robotics',big:true}]}
];

/* rivers: how the intelligence flows — weights, protocols, talent */
const FLOWS=[
 ['deepmind','openai'],
 ['openai','vibecoding'],['anthropic','vibecoding'],['anthropic','agents'],
 ['openai','agents'],['metallama','localllama'],['deepseek','localllama'],
 ['qwen','localllama'],['kimi','localllama'],['deepmind','genmedia'],
 ['xai','eacc'],['anthropic','aisafety'],['mistral','venice']
];

/* the waters: compute is not a lab but the sea every lab floats on */
const OCEANS=[
 {id:'compute',t:'THE COMPUTE OCEAN',x:2950,y:-880,w:190,size:16,arc:1600},
 {id:'compute',t:'THE COMPUTE OCEAN',x:-1400,y:2650,w:190,size:16,arc:-1600},
 {t:'THE SCALING PASS',x:760,y:1420,w:150,size:15,arc:1400},
 {t:'THE BENCHMARK STRAIT',x:1350,y:-30,w:160,size:13,arc:-1400}
];

/* bespoke villages: rare ontologies, visible at deep zoom */
const BESPOKE=[];

/* per-vertical runtime config (read by the cine paths + flyover3d.js) */
window.__vert={
 edition:'THE AI EDITION',
 name:'ai',
 POP:['openai','anthropic','deepmind','xai','metallama','mistral','qwen','deepseek','kimi'],
 NICHE:['localllama','vibecoding','agents','venice','genmedia','robotics','aisafety','eacc'],
 sub:'THE AI MAP',
 cineKick:'THE AI ONTOLOGY MAP',
 cineLine:'the world of AI, drawn as a world — valuation is the terrain, and the ocean is compute',
 cardTitle:'The AI Ontology Map',
 LOOK:{
  openai:      { walls:[0xe8e8e0,0xdcdcd2,0xcfcfc4,0xf2f2ea], roof:0x2f2f2f, keep:0x10a37f, style:'dome',    name:'The Spiral Temple' },
  anthropic:   { walls:[0xe8ddd0,0xdccfbe,0xd0c2ae,0xf0e8dc], roof:0xb4552d, keep:0xd97757, style:'dome',    name:'The Constitution Hall' },
  deepmind:    { walls:[0xd8e2e8,0xc6d4de,0xb2c4d2,0xe8f0f4], roof:0x1a73e8, keep:0x34a853, style:'crystal', name:'The Bitter Lesson Archive' },
  xai:         { walls:[0x4a4a4e,0x5a5a60,0x3a3a3e,0x6a6a70], roof:0x151517, keep:0xe8e8e8, style:'tower',   name:'The Truth Engine' },
  metallama:   { walls:[0xc8d4e8,0xb6c6e0,0xa2b6d8,0xd8e2f0], roof:0x0866ff, keep:0x0866ff, style:'fort',    name:'The Superintelligence Tents' },
  mistral:     { walls:[0xf0e0c8,0xe8d4b6,0xdcc6a2,0xf6ecd8], roof:0xfa5211, keep:0xffaf00, style:'cone',    name:'Le Comptoir des Poids' },
  deepseek:    { walls:[0xd0dcf0,0xbecfe8,0xaabede,0xe0e8f6], roof:0x4d6bfe, keep:0x4d6bfe, style:'tower',   name:'The Whale Fountain' },
  qwen:        { walls:[0xe8dcf0,0xdccce8,0xd0bce0,0xf2eaf6], roof:0x6236ff, keep:0x6236ff, style:'cone', name:'The Cloud Pavilion' },
  kimi:        { walls:[0x3a3f4e,0x4a5060,0x2e323e,0x5a6070], roof:0x16b8a6, keep:0x16b8a6, style:'tower',   name:'The Moonshot Gate' },
  venice:      { walls:[0xe0d4c0,0xd4c6ae,0xc8b89c,0xece2d2], roof:0x8a4a2e, keep:0xc0563e, style:'dome',    name:'The Masquerade' },
  localllama:  { walls:[0xb5a878,0xa89868,0x988a5c,0xc0b088], roof:0x5c8a3c, keep:0x4f8136, style:'cone',    name:'The Weights Commons' },
  vibecoding:  { walls:[0xd8e8e0,0xc6dcd2,0xb2d0c2,0xe8f2ec], roof:0x7d5aa0, keep:0xb05ae8, style:'flat',    name:'The Vibe Foundry' },
  agents:      { walls:[0xc8c8d8,0xb6b6cc,0xa2a2c0,0xd8d8e4], roof:0x2a2a3e, keep:0xffe25c, style:'tower',   name:'The Protocol Exchange' },
  genmedia:    { walls:[0xe8c8d8,0xc8d8e8,0xd8e8c8,0xe8e0c0], roof:0x7d5aa0, keep:0xc0563e, style:'cone',    name:'The Dream Projector' },
  robotics:    { walls:[0xc0c4c8,0xb0b6bc,0x9ea6ae,0xd2d6da], roof:0x3a4046, keep:0xff6a00, style:'fort',    name:'The Actuator Works' },
  aisafety:    { walls:[0x9aa89a,0x8a988a,0x7a887a,0xaab8aa], roof:0x3a4a3a, keep:0xd8b13a, style:'dome',    name:'The Containment Vault' },
  eacc:        { walls:[0xe8a05a,0xe0904a,0xd8803a,0xf0b06a], roof:0x151218, keep:0xffe25c, style:'tower',   name:'The Entropy Forge' }
 }
};
