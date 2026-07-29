const CONTINENTS=[
 {id:'k-dollar',region:true,name:'THE DOLLAR MAINLAND',kicker:'THE DOLLAR MAINLAND',dyn:true,a0start:2.9,
  cx:1400,cy:-480,rx:840,ry:330,rot:.02,seed:11,rug:.22,junction:[1400,-480],
  label:{x:1400,y:-500,w:300,size:30},trees:false,mountains:false,
  palette:{low:'#b3bfa6',up:'#d2cbaa',high:'#b2a07f'},
  countries:[{id:'stablecoins',big:true},{id:'exchangetokens',big:true},{id:'brokerchains'},
   {id:'predictionmarkets'},{id:'rwa',big:true},{id:'xrparmy',big:true}]},
 {id:'k-wc',region:true,name:'THE WORLD COMPUTER',kicker:'THE WORLD COMPUTER',dyn:true,a0start:1.4,
  cx:1300,cy:700,rx:780,ry:420,rot:-.04,seed:23,rug:.24,junction:[1300,700],
  label:{x:1300,y:690,w:300,size:30},mountains:false,
  palette:{low:'#b7c795',up:'#dcc99a',high:'#b89064'},
  countries:[{id:'ethereum',big:true},{id:'linkmarines'},{id:'zkpurists'},
   {id:'restakers'},{id:'defi',big:true},{id:'l2s'},{id:'base'}]},
 {id:'k-commons',region:true,name:'THE COMMONS',kicker:'THE COMMONS',dyn:true,a0start:0.6,
  cx:500,cy:2050,rx:600,ry:360,rot:.06,seed:83,rug:.26,junction:[500,2050],
  label:{x:500,y:2040,w:240,size:26},trees:true,mountains:false,
  palette:{low:'#a8c98c',up:'#ccc794',high:'#a98e5e'},
  countries:[{id:'nft',big:true},{id:'artists'},{id:'regens',big:true},
   {id:'daos'},{id:'memedaos'},{id:'desci'}]},
 {id:'k-sound',region:true,name:'SOUND MONEY HIGHLANDS',kicker:'SOUND MONEY HIGHLANDS',dyn:true,a0start:2.2,
  cx:3050,cy:1000,rx:600,ry:500,rot:.03,seed:53,rug:.23,junction:[3050,1000],
  label:{x:3050,y:990,w:280,size:24},mountains:false,
  palette:{low:'#d9c795',up:'#e2cf9e',high:'#bc9468'},
  countries:[{id:'btcmaxis',big:true},{id:'oldguard',big:true},{id:'ghostchains'},{id:'privacy'}]},
 {id:'k-fast',region:true,name:'THE SHIP-FAST FRONTIER',kicker:'THE SHIP-FAST FRONTIER',dyn:true,a0start:0.9,
  cx:-950,cy:150,rx:640,ry:460,rot:-.05,seed:113,rug:.27,junction:[-950,150],
  label:{x:-950,y:140,w:260,size:24},mountains:false,
  palette:{low:'#b3c892',up:'#d9c795',high:'#bc9468'},
  countries:[{id:'solana',big:true},{id:'newl1s',big:true},
   {id:'aicoins',big:true},{id:'depin'},{id:'airdropfarmers'}]},
 {id:'k-trench',region:true,name:'THE TRENCHES',kicker:'THE TRENCHES',dyn:true,a0start:3.9,
  cx:-800,cy:1350,rx:620,ry:320,rot:.04,seed:149,rug:.3,junction:[-800,1350],
  label:{x:-800,y:1340,w:240,size:26},mountains:false,
  palette:{low:'#b0b18d',up:'#c9bc90',high:'#9d7f58'},
  countries:[{id:'memecoins',big:true},{id:'degenperps'},{id:'hyperliquid',big:true},{id:'mevsearchers'}]}
];

/* rivers: how the resources flow — width follows the receiving tribe's market cap */
const FLOWS=[
 ['btcmaxis','ethereum'],
 ['exchangetokens','btcmaxis'],['exchangetokens','ethereum'],['stablecoins','ethereum'],
 ['stablecoins','defi'],['ethereum','l2s'],['ethereum','restakers'],
 ['ethereum','regens'],['regens','artists'],['daos','regens'],
 ['solana','memecoins'],['defi','degenperps'],['brokerchains','predictionmarkets']
];

/* the waters: fiat is not a coin but the sea every coin floats in.
   Its labels are hover targets. */
const OCEANS=[
 {id:'fiat',t:'THE FIAT OCEAN',x:2950,y:-880,w:170,size:16,arc:1600},
 {id:'fiat',t:'THE FIAT OCEAN',x:-1400,y:2650,w:170,size:16,arc:-1600},
 {t:'THE EFFICAX VALLEY',x:760,y:1420,w:150,size:15,arc:1400},
 {t:'THE ONRAMP PASS',x:1350,y:-30,w:130,size:13,arc:-1400}
];

/* bespoke villages: rare ontologies, visible at deep zoom */
const BESPOKE=[
 {id:'ordinals',parent:'btcmaxis',dx:90,dy:110}
];

/* per-vertical runtime config (read by the cine paths + flyover3d.js) */
window.__vert={
 name:'crypto',
 POP:['btcmaxis','stablecoins','ethereum','base','exchangetokens','xrparmy','rwa','brokerchains','solana'],
 NICHE:['linkmarines','regens','memedaos','desci','airdropfarmers','mevsearchers','artists','ghostchains'],
 sub:'THE CRYPTOTWITTER MAP',
 cineKick:'THE CRYPTOTWITTER ONTOLOGY MAP',
 cineLine:'the coingecko top 100, drawn as a world — market cap is the terrain, and the ocean is fiat',
 cardTitle:'CryptoTwitter Ontology Map'
};
