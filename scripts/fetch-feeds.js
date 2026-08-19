/* ══════════════════════════════════════════════════════════════
   Génère feeds.json à partir des 66 flux RSS, sans passer par rss2json.
   Exécuté automatiquement 1x/jour par GitHub Actions (voir .github/workflows/veille.yml)
   Peut aussi être lancé manuellement en local : node scripts/fetch-feeds.js
   ══════════════════════════════════════════════════════════════ */
const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' }
});
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/* ══════ LISTE DES FLUX (identique à l'ancien RSS_FEEDS d'index.html) ══════ */
const RSS_FEEDS = [
  /* VÉTÉRINAIRE */
  {url:"https://devenir-asv.com/feed/",name:"Devenir ASV",peri:"vet"},
  {url:"https://www.veterinaire.fr/rss.xml",name:"Ordre des Vétérinaires",peri:"vet"},
  {url:"https://soutienveterinaire.fr/feed/",name:"Soutien Vétérinaire",peri:"vet"},
  {url:"https://www.clubasv.fr/feed/",name:"Club ASV",peri:"vet"},
  {url:"https://www.temavet.fr/rss.xml",name:"TémaVet",peri:"vet"},
  {url:"https://supveto.com/feed/",name:"SupVéto",peri:"vet"},
  {url:"https://www.la-nurserie.com/feed/",name:"La Nurserie",peri:"vet"},
  {url:"https://agriculture.gouv.fr/rss.xml",name:"Min. Agriculture",peri:"vet"},
  {url:"https://agriculture.gouv.fr/rss_presse.xml",name:"Min. Agriculture Presse",peri:"vet"},
  {url:"https://agriculture.gouv.fr/rss_publications.xml",name:"Min. Agriculture Publications",peri:"vet"},
  {url:"https://www.cnr-bea.fr/feed/",name:"CNR Bien-être animal",peri:"vet"},
  {url:"https://www.veterinaireliberal.fr/actualites/",name:"SNVEL",peri:"vet",type:"html-snvel"},
  {url:"https://legifrss.org/latest?q=v%C3%A9t%C3%A9rinaire",name:"Légifrance — Vétérinaire",peri:"vet"},
  {url:"https://legifrss.org/latest?q=sant%C3%A9%20animale",name:"Légifrance — Santé animale",peri:"vet"},
  {url:"https://legifrss.org/latest?q=m%C3%A9decine%20v%C3%A9t%C3%A9rinaire",name:"Légifrance — Médecine vétérinaire",peri:"vet"},
  {url:"https://legifrss.org/latest?q=pharmacovigilance%20v%C3%A9t%C3%A9rinaire",name:"Légifrance — Pharmacovigilance",peri:"vet"},
  {url:"https://legifrss.org/latest?q=m%C3%A9dicament%20v%C3%A9t%C3%A9rinaire",name:"Légifrance — Médicament vétérinaire",peri:"vet"},
  {url:"https://legifrss.org/latest?q=bien-%C3%AAtre%20animal",name:"Légifrance — Bien-être animal",peri:"vet"},
  {url:"https://legifrss.org/latest?q=protection%20animale",name:"Légifrance — Protection animale",peri:"vet"},
  {url:"https://legifrss.org/latest?q=%C3%A9levage",name:"Légifrance — Élevage",peri:"vet"},
  {url:"https://legifrss.org/latest?q=alimentation%20animale",name:"Légifrance — Alimentation animale",peri:"vet"},
  /* RÉGLEMENTATION / QUALIOPI */
  {url:"https://www.francecompetences.fr/feed",name:"France Compétences",peri:"reg"},
  {url:"https://www.francecompetences.fr/rss",name:"France Compétences RSS",peri:"reg"},
  {url:"https://travail-emploi.gouv.fr/rss.xml",name:"Min. Travail",peri:"reg"},
  {url:"https://www.centre-inffo.fr/feed",name:"Centre Inffo",peri:"reg"},
  {url:"https://www.centre-inffo.fr/category/site-centre-inffo/actualites-centre-inffo/le-quotidien-de-la-formation-actualite-formation-professionnelle-apprentissage/feed",name:"Centre Inffo — Quotidien",peri:"reg"},
  {url:"https://www.centre-inffo.fr/category/site-reforme/feed",name:"Centre Inffo — Réforme",peri:"reg"},
  {url:"https://www.centre-inffo.fr/category/site-droit-formation/actualites-droit/feed",name:"Centre Inffo — Droit formation",peri:"reg"},
  {url:"https://www.centre-inffo.fr/category/actualites-regions/feed",name:"Centre Inffo — Régions",peri:"reg"},
  {url:"https://www.centre-inffo.fr/category/actualites-europe/feed",name:"Centre Inffo — Europe",peri:"reg"},
  {url:"https://www.centre-inffo.fr/category/innovation-formation/feed",name:"Centre Inffo — Innovation",peri:"reg"},
  {url:"https://lesacteursdelacompetence.fr/feed/",name:"Les Acteurs Compétence",peri:"reg"},
  {url:"https://www.veilleformation.com/feed",name:"Veille Formation",peri:"reg"},
  {url:"https://www.opcoep.fr/actualites",name:"OPCO EP",peri:"reg",type:"html-opcoep"},
  /* PÉDAGOGIE */
  {url:"https://portaileduc.net/website/feed/",name:"PortailEduc",peri:"ped"},
  {url:"https://sydologie.com/feed",name:"Sydologie",peri:"ped"},
  {url:"https://latelierduformateur.fr/feed/",name:"L'Atelier du Formateur",peri:"ped"},
  {url:"https://outilstice.com/feed/",name:"Les Outils Tice",peri:"ped"},
  {url:"https://www.istf-formation.fr/feed/",name:"ISTF",peri:"ped"},
  {url:"https://feeds.feedburner.com/elearningindustry",name:"eLearning Industry",peri:"ped"},
  {url:"https://www.letudiant.fr/educpros/rss.xml",name:"Educpros",peri:"ped"},
  {url:"https://journals.openedition.org/dms/backend?format=rssdocuments",name:"Distances & Médiations",peri:"ped"},
  {url:"https://lepodcastdelaformation.fr/feed/",name:"Podcast de la Formation",peri:"ped"},
  {url:"https://feeds.podcastics.com/podcastics/podcasts/rss/6628_a9c72191f50b205a6ebe0276fb677e8f.rss",name:"Véto Actu (Podcast)",peri:"vet"},
  {url:"https://blogs.articulate.com/les-essentiels-du-elearning/feed/",name:"Blog Articulate",peri:"ped"},
  {url:"https://feed.ausha.co/o9DGRcY6dPkl",name:"RDV en terre digitale",peri:"ped"},
  {url:"https://www.digiformag.com/feed/",name:"Digiformag",peri:"ped"},
  {url:"https://legifrss.org/latest?q=accessibilit%C3%A9%20num%C3%A9rique",name:"Légifrance — Accessibilité numérique",peri:"ped"},
  {url:"https://www.blog-formation-entreprise.fr/feed/",name:"C-Campus — Blog Formation Entreprise",peri:"ped"},
  /* INTELLIGENCE ARTIFICIELLE */
  {url:"https://feeds.feedburner.com/elearningindustry",name:"eLearning Industry",peri:"ia"}, // doublon volontaire : article pertinent pour les deux périmètres
  {url:"https://blog.google/rss",name:"Google Blog",peri:"ia"},
  {url:"https://openai.com/news/rss.xml",name:"OpenAI Blog",peri:"ia"},
  {url:"https://towardsdatascience.com/feed/",name:"Towards Data Science",peri:"ia"},
  {url:"https://www.upmynt.com/rss/",name:"Upmynt",peri:"ia"},
  {url:"https://intelligence-artificielle.com/feed/",name:"Intelligence-Artificielle.com",peri:"ia"},
  {url:"https://www.blogdumoderateur.com/feed/",name:"Blog du Modérateur",peri:"ia"},
  {url:"https://techcrunch.com/category/artificial-intelligence/feed/",name:"TechCrunch — IA",peri:"ia"},
  {url:"https://legifrss.org/latest?q=intelligence%20artificielle",name:"Légifrance — IA",peri:"ia"},
  {url:"https://www.youtube.com/feeds/videos.xml?channel_id=UCLKx4-_XO5sR0AO0j8ye7zQ",name:"Shubham Sharma (YouTube)",peri:"ia"},
  /* RÉGLEMENTATION / QUALIOPI — compléments Légifrance */
  {url:"https://legifrss.org/latest?q=qualiopi",name:"Légifrance — Qualiopi",peri:"reg"},
  {url:"https://legifrss.org/latest?q=tra%C3%A7abilit%C3%A9%20des%20actions%20de%20formation",name:"Légifrance — Traçabilité formation",peri:"reg"},
  {url:"https://legifrss.org/latest?q=formation%20%C3%A0%20distance",name:"Légifrance — FOAD",peri:"reg"},
  {url:"https://legifrss.org/latest?q=protection%20des%20donn%C3%A9es",name:"Légifrance — RGPD formation",peri:"reg"},
  {url:"https://www.certif-avenir.fr/blog-feed.xml",name:"Certif Avenir",peri:"reg"},
];

/* ══════ PRIORITÉ SUGGÉRÉE — modèle à points cumulables ══════ */
const PRIORITY_HIGH=["délégation d'acte","délégation d'actes","actes délégués","acte délégué","gipsa","titre asv",
  "asv gipsa","qualiopi","rncp","certification professionnelle","loi d'orientation agricole",
  "échelon 5","opco ep","cqp","apprentissage vétérinaire","alternance vétérinaire","délégués du snvel","habilitation",
  "centre de formation habilité","jury national","manuel de formation aux actes","n'ayant pas la qualité de vétérinaire",
  "qualité de vétérinaire","actes de médecine ou de chirurgie des animaux","arrêté du 5 octobre 2011",
  "convention collective des cabinets et cliniques vétérinaires","convention collective nationale des vétérinaires",
  "convention collective vétérinaire","idcc 1875"];
const PRIORITY_MED=["france compétences","vademecum","centre inffo","vae ","validation des acquis",
  "formation continue","ingénierie pédagogique","référentiel","évaluation certificative","mentorat vétérinaire",
  "bien-être animal","santé publique vétérinaire","droit de la formation","réforme de la formation","apprentissage",
  "apprenti","apprentis","contrat d'apprentissage","premier équipement","financement formation","financement des apprentis",
  "traçabilité des actions de formation","accessibilité numérique","rgaa","intelligence artificielle","ia générative"];
const PRIORITY_LOW=["canicule","sécheresse","engrais","haie","pfas","eau potable","phytosanitaire","safer",
  "label rouge","crevette","nématode"];

/* Sources dont la seule provenance justifie un bonus de priorité, propre à chaque périmètre */
const SOURCE_PRIORITY={
  vet:["SNVEL","Ordre des Vétérinaires"],
  reg:["OPCO EP","France Compétences","France Compétences RSS","Centre Inffo","Centre Inffo — Quotidien",
    "Centre Inffo — Réforme","Centre Inffo — Droit formation","Centre Inffo — Régions","Centre Inffo — Europe",
    "Centre Inffo — Innovation"],
  ped:["Sydologie","Podcast de la Formation","L'Atelier du Formateur"],
  ia:["OpenAI Blog"]
};

function countMatches(text,list){
  return list.reduce((n,k)=>text.includes(k)?n+1:n,0);
}

function suggestPriority(text,sourceName,peri){
  const low=text.toLowerCase();
  const keywordScore=countMatches(low,PRIORITY_HIGH)*3+countMatches(low,PRIORITY_MED)*1;
  let score=keywordScore;
  // Le bonus de source ne s'applique que s'il y a déjà un signal de contenu :
  // une source prioritaire ne doit jamais, à elle seule, créer une priorité.
  if(keywordScore>0&&SOURCE_PRIORITY[peri]&&SOURCE_PRIORITY[peri].includes(sourceName))score+=2;
  if(score>=3)return{urg:'Haute',impact:'Fort'};
  if(score>=1)return{urg:'Moyenne',impact:'Moyen'};
  return{urg:'Basse',impact:'Faible'};
}

/* ══════ FILTRE HORS-SUJET ══════ */
const EXCLUDE_KEYWORDS=["patron de couture","couture","slow fashion","habillement","textile","recette de cuisine",
  "jardinage","bricolage","loisirs créatifs","décoration intérieure","tricot","macramé"];

function isOffTopic(text){
  const low=text.toLowerCase();
  return EXCLUDE_KEYWORDS.some(k=>low.includes(k));
}

/* Sources génériques/grand public dont le contenu n'est pas fiablement filtré à la source
   (moteur de recherche trop large, périmètre ministériel trop vaste, média généraliste...).
   Pour celles-ci, on inverse la logique : un article n'est gardé QUE s'il contient vraiment
   un terme du champ concerné. Chaque source est associée au groupe de mots-clés pertinent. */
const VET_TERMS=["vétérinaire","vétérinaires","animal","animaux","animale","élevage","éleveur","élevages",
  "sanitaire","zoosanitaire","épizootie","épizootique","bien-être animal","abattage","abattoir","cheptel",
  "santé animale","médicament vétérinaire","pharmacovigilance vétérinaire","asv","auxiliaire spécialisé",
  "clinique vétérinaire","chirurgie des animaux","médecine des animaux","protection animale","faune",
  "espèce animale","biosécurité","maladie animale","pathologie animale"];

const FORMATION_TERMS=["formation professionnelle","organisme de formation","apprenant","apprenants","qualiopi",
  "certification","référentiel","action de formation","actions de formation","stagiaire","prestataire de formation",
  "apprentissage","alternance","centre de formation","formation continue","formation à distance","foad",
  // Vocabulaire juridique réel employé par les textes de loi (Légifrance), distinct du vocabulaire
  // commercial/usuel : un décret Qualiopi ne contient quasiment jamais le mot "Qualiopi" lui-même.
  "référentiel national qualité","actions concourant au développement des compétences",
  "prestataires d'actions concourant au développement des compétences","organismes certificateurs",
  "organisme certificateur","formation ouverte ou à distance","formations ouvertes ou à distance",
  "rgaa","référentiel général d'amélioration de l'accessibilité","accessibilité aux personnes handicapées",
  "services de communication au public en ligne","protection des données","données personnelles","rgpd"];

const IA_TERMS=["intelligence artificielle","ia générative","chatgpt","machine learning","modèle de langage",
  "llm","openai","deepmind","algorithme d'ia","système d'ia","systèmes d'ia","ia à haut risque","règlement ia"];

const WHITELIST_SOURCES={
  "Légifrance — Vétérinaire":VET_TERMS,"Légifrance — Santé animale":VET_TERMS,
  "Légifrance — Médecine vétérinaire":VET_TERMS,"Légifrance — Pharmacovigilance":VET_TERMS,
  "Légifrance — Médicament vétérinaire":VET_TERMS,"Légifrance — Bien-être animal":VET_TERMS,
  "Légifrance — Protection animale":VET_TERMS,"Légifrance — Élevage":VET_TERMS,
  "Légifrance — Alimentation animale":VET_TERMS,
  "Min. Agriculture":VET_TERMS,"Min. Agriculture Presse":VET_TERMS,"Min. Agriculture Publications":VET_TERMS,
  "Légifrance — Qualiopi":FORMATION_TERMS,"Légifrance — Traçabilité formation":FORMATION_TERMS,
  "Légifrance — FOAD":FORMATION_TERMS,"Légifrance — RGPD formation":FORMATION_TERMS,
  "Légifrance — Accessibilité numérique":FORMATION_TERMS,
  "Légifrance — IA":IA_TERMS,"Blog du Modérateur":IA_TERMS,
};

function passesWhitelist(sourceName,text){
  const terms=WHITELIST_SOURCES[sourceName];
  if(!terms)return true; // pas concerné : pas de filtre supplémentaire
  const low=text.toLowerCase();
  return terms.some(k=>low.includes(k));
}

/* Certaines sources mélangent des articles de blog avec des pages de catalogue/offres de
   formation dans leur flux RSS. On exclut ces pages-là par motif d'URL, source par source. */
const SKIP_LINK_PATTERNS={
  ISTF:["/formation/","/catalogue/","/atelier/","/cursus-certifiants/","/cpf/","/ia/","/deployez-vos-formations-et-animez-vos-dispositifs/"]
};

/* Ces liens ne doivent être bloqués que s'ils correspondent EXACTEMENT à la page indiquée, pas à
   leurs sous-pages : ce sont les tags/catégories du widget SNVEL (voir fetchSnvelListing), dont
   les sous-pages sont de vrais articles à conserver (/communication/ = tag à exclure, mais
   /communication/mon-article/ = vrai article à garder — d'où la distinction avec SKIP_LINK_PATTERNS
   ci-dessus, qui bloque par sous-chaîne donc toute une arborescence). */
const EXACT_SKIP_LINKS={
  SNVEL:["enseignement-cursus","protection-sociale-et-juridique","medicament-veterinaire",
    "qui-sommes-nous","communiques-de-presse","conseil-expertise","collaboration-liberale",
    "gestion-management","communication","autres","bien-etre-animal","biodiversite",
    "contentieux","covid-19","e-reputation","fiscalite","formation","juridique",
    "maillage","one-health","sanitaire","social","ressources","se-connecter","actualites"]
};

function isSkippedLink(sourceName,link){
  const patterns=SKIP_LINK_PATTERNS[sourceName];
  if(patterns&&patterns.some(p=>link.includes(p)))return true;
  const exact=EXACT_SKIP_LINKS[sourceName];
  if(exact){
    const m=link.match(/^https?:\/\/[^/]+\/([a-z0-9-]+)\/?$/i);
    if(m&&exact.includes(m[1].toLowerCase()))return true;
  }
  return false;
}

/* Filtre complémentaire, indépendant de l'URL : une page qui affiche un prix/tarif de stage
   est presque toujours une fiche produit, jamais un article éditorial — quel que soit son chemin. */
function looksLikeTrainingOffer(text){
  return /(\d+\s?€\s?ht|inter-entreprises?\s*:|intra-entreprises?\s*:|tarifs?\s+sur\s+demande)/i.test(text);
}

function stripHtml(html){
  return (html||'').replace(/<[^>]+>/g,'').trim();
}

function decodeEntities(s){
  return (s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')
    .replace(/&#39;/g,"'").replace(/&apos;/g,"'").replace(/&amp;/g,'&');
}

function extractItemsWithRegex(text){
  const items=[];
  const blocks=text.match(/<item\b[\s\S]*?<\/item>/gi)||[];
  for(const block of blocks){
    const g=(tag)=>{const m=block.match(new RegExp('<'+tag+'[^>]*>([\\s\\S]*?)<\\/'+tag+'>','i'));return m?decodeEntities(m[1]).trim():'';};
    items.push({title:g('title'),link:g('link'),pubDate:g('pubDate'),content:g('description')});
  }
  return{items};
}

async function fetchWithFallback(url){
  try{
    return await parser.parseURL(url);
  }catch(e1){
    // Repli niveau 1 : "&" isolés non échappés, cause fréquente sur les flux WordPress.
    try{
      const res=await fetch(url,{headers:{'User-Agent':BROWSER_UA}});
      if(!res.ok)throw e1;
      let text=await res.text();
      const fixedAmp=text.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g,'&amp;');
      return await parser.parseString(fixedAmp);
    }catch(e2){
      // Repli niveau 2 : XML structurellement cassé (balises mal fermées, imbrication invalide...).
      // On extrait les articles à la main par motif texte, sans passer par un parseur XML strict.
      const res=await fetch(url,{headers:{'User-Agent':BROWSER_UA}});
      if(!res.ok)throw e1;
      const text=await res.text();
      const manual=extractItemsWithRegex(text);
      if(!manual.items.length)throw e1;
      return manual;
    }
  }
}

/* Source SNVEL : /feed/ (403) et /wp-json (401) sont tous deux verrouillés délibérément par le
   site (durcissement sécurité). Repli sur scraping en 2 temps : d'abord la page "Actualités" pour
   titre + lien de chaque article (elle n'affiche aucune date fiable), puis, pour chaque article
   retenu, une requête sur sa page individuelle pour y extraire la vraie date de publication
   (balise standard Yoast SEO "article:published_time", avec repli sur <time datetime>). */
async function fetchSnvelListing(url){
  const res=await fetch(url,{headers:{'User-Agent':BROWSER_UA}});
  if(!res.ok)throw new Error('Status code '+res.status);
  const html=await res.text();
  const items=[];
  const seen=new Set();
  // Le widget de tags/catégories ("Communication", "Gestion / management", "Qui sommes-nous"...)
  // est répété sur TOUTES les pages du site (probablement une barre latérale), avec des URLs à
  // UN seul segment (/gestion-management/). Les vrais articles, eux, ont toujours une URL à DEUX
  // segments (/communication/nom-de-larticle/) — c'est ce critère structurel qu'on exploite ici,
  // plus robuste qu'une liste de catégories à maintenir à la main.
  const NON_NEWS_SECTIONS=/^(qui-sommes-nous|se-connecter|nous-contacter|contact|mentions-legales|adherer|adhesion)\//i;
  const blockRe=/<a\b[^>]*href="((?:https:\/\/www\.veterinaireliberal\.fr)?\/[a-z0-9-]+\/[a-z0-9-]{6,}\/?)"[^>]*>([\s\S]{0,400}?)<\/a>/gi;
  let m,scanned=0;
  while((m=blockRe.exec(html))&&items.length<5&&scanned<150){
    scanned++;
    let raw=m[1];
    const pathOnly=raw.replace(/^https:\/\/www\.veterinaireliberal\.fr/,'').replace(/^\//,'');
    if(NON_NEWS_SECTIONS.test(pathOnly))continue; // sous-page d'une section non-actualité
    let link=raw.startsWith('/')?'https://www.veterinaireliberal.fr'+raw:raw;
    if(seen.has(link))continue;
    const inner=stripHtml(decodeEntities(m[2])).replace(/\s+/g,' ').trim();
    if(inner.length<20)continue; // titre trop court pour être un vrai article
    seen.add(link);
    items.push({title:inner.slice(0,200),link,desc:''});
  }
  return{items};
}
async function fetchSnvelArticleDate(link){
  try{
    const res=await fetch(link,{headers:{'User-Agent':BROWSER_UA}});
    if(!res.ok)return '';
    const html=await res.text();
    let m=html.match(/property="article:published_time"\s+content="([^"]+)"/i);
    if(!m)m=html.match(/<time\b[^>]*datetime="([^"]+)"/i);
    return m?m[1].slice(0,10):'';
  }catch(e){return '';}
}
async function fetchSnvelHtml(url){
  const listing=await fetchSnvelListing(url);
  const items=[];
  for(const it of listing.items.slice(0,5)){
    const date=await fetchSnvelArticleDate(it.link);
    items.push({...it,date});
  }
  return{items};
}

/* Source OPCO EP : pas de flux RSS (/feed/ en 404), et pas d'API REST publique (site Drupal,
   pas WordPress). On scrape la page HTML "Actualités", dont le balisage est propre et stable :
   chaque teaser est un lien <a href=".../actualites/..."> contenant catégorie + durée de lecture
   + titre + date (JJ/MM/AAAA) + résumé, dans cet ordre. Solution plus fragile qu'un flux RSS —
   à surveiller si Opco EP refond son site (voir failedFeeds si le motif ne matche plus). */
async function fetchOpcoEpHtml(url){
  const res=await fetch(url,{headers:{'User-Agent':BROWSER_UA}});
  if(!res.ok)throw new Error('Status code '+res.status);
  const html=await res.text();
  const items=[];
  const linkRe=/<a\b[^>]*href="(\/actualites\/[a-z0-9-]+|https:\/\/www\.opcoep\.fr\/actualites\/[a-z0-9-]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  const seen=new Set();
  while((m=linkRe.exec(html))&&items.length<10){
    const link=m[1].startsWith('/')?'https://www.opcoep.fr'+m[1]:m[1];
    if(seen.has(link))continue; // même article référencé plusieurs fois (image + titre)
    const text=stripHtml(decodeEntities(m[2])).replace(/\s+/g,' ').trim();
    const dateMatch=text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if(!dateMatch)continue; // pas un vrai teaser d'article (lien de nav, image seule, etc.)
    seen.add(link);
    const date=`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
    const beforeDate=text.slice(0,dateMatch.index).trim();
    const afterDate=text.slice(dateMatch.index+dateMatch[0].length).trim();
    // Le titre est la portion de texte juste avant la date, après l'étiquette "X min" si présente.
    const title=beforeDate.replace(/^.*?\d+\s?min\s*/i,'').trim()||beforeDate;
    items.push({title,link,date,desc:afterDate.slice(0,180)});
  }
  return{items};
}

const FEEDS_JSON_PATH=path.join(__dirname,'..','feeds.json');

const RETENTION_DAYS={Haute:21,Moyenne:14,Basse:5};

const VALID_SOURCE_PERI=new Set(RSS_FEEDS.map(f=>f.name+'|'+f.peri));

function loadExistingItems(){
  try{
    const raw=fs.readFileSync(FEEDS_JSON_PATH,'utf8');
    const parsed=JSON.parse(raw);
    const items=Array.isArray(parsed.items)?parsed.items:[];
    // Auto-nettoyage : si le couple (source, périmètre) d'un article ne correspond plus
    // à aucune entrée valide de RSS_FEEDS (ex: recatégorisation, code de périmètre réutilisé
    // pour autre chose), on l'écarte plutôt que de le laisser traîner avec une étiquette fausse.
    return items.filter(it=>VALID_SOURCE_PERI.has(it.source+'|'+it.peri));
  }catch(e){
    return []; // premier passage, ou fichier absent/corrompu : on repart de zéro
  }
}

function mergeWithRetention(existingItems,freshItems){
  const now=Date.now();
  const byKey=new Map();
  const keyOf=(it)=>it.link+'|'+it.peri; // même article, périmètres différents = entrées distinctes (ex: eLearning Industry en double)
  // On garde les articles déjà connus, en fixant leur date de première apparition si elle manque encore.
  // La priorité est recalculée à chaque passage (pas seulement figée au moment de la première collecte) :
  // un changement de mots-clés/pondération doit s'appliquer rétroactivement aux articles déjà en mémoire,
  // sinon un article mal classé peut rester avec son ancien score jusqu'à expiration de sa rétention.
  for(const it of existingItems){
    if(!it.link)continue;
    if(isSkippedLink(it.source,it.link))continue; // purge immédiate des liens désormais exclus (ex: tags SNVEL), sans attendre l'expiration de rétention
    const p=suggestPriority((it.title||'')+' '+(it.desc||''),it.source,it.peri);
    byKey.set(keyOf(it),{...it,sugUrg:p.urg,sugImpact:p.impact,firstSeen:it.firstSeen||now});
  }
  // On superpose les articles récupérés aujourd'hui : priorité recalculée à jour,
  // mais on conserve la date de première apparition d'origine pour ne pas relancer son compteur de rétention.
  for(const it of freshItems){
    const prev=byKey.get(keyOf(it));
    byKey.set(keyOf(it),{...it,firstSeen:prev&&prev.firstSeen?prev.firstSeen:now});
  }
  // On ne garde que ce qui est encore dans sa fenêtre de rétention (selon la priorité du jour)
  const kept=[];
  for(const it of byKey.values()){
    const days=RETENTION_DAYS[it.sugUrg]??RETENTION_DAYS.Basse;
    const ageDays=(now-it.firstSeen)/(1000*60*60*24);
    if(ageDays<=days)kept.push(it);
  }
  return kept;
}

async function run(){
  const freshItems=[];
  const failedFeeds=[];

  for(const feed of RSS_FEEDS){
    try{
      let rawItems;
      if(feed.type==='html-snvel'){
        rawItems=(await fetchSnvelHtml(feed.url)).items;
      }else if(feed.type==='html-opcoep'){
        rawItems=(await fetchOpcoEpHtml(feed.url)).items;
      }else{
        const parsed=await fetchWithFallback(feed.url);
        rawItems=(parsed.items||[]).map(item=>({
          title:(item.title||'').trim(),
          link:(item.link||'').trim(),
          desc:stripHtml(item.contentSnippet||item.content||item.summary||'').slice(0,180),
          date:item.isoDate?item.isoDate.slice(0,10):(item.pubDate?new Date(item.pubDate).toISOString().slice(0,10):'')
        }));
      }
      const items=rawItems.slice(0,5).map(it=>{
        const p=suggestPriority(it.title+' '+it.desc,feed.name,feed.peri);
        return{...it,source:feed.name,peri:feed.peri,sugUrg:p.urg,sugImpact:p.impact};
      }).filter(it=>!isOffTopic(it.title+' '+it.desc)&&!isSkippedLink(feed.name,it.link)&&!looksLikeTrainingOffer(it.desc)&&passesWhitelist(feed.name,it.title+' '+it.desc));
      freshItems.push(...items);
      console.log(`✔ ${feed.name} (${items.length} articles)`);
    }catch(e){
      failedFeeds.push({name:feed.name,peri:feed.peri,reason:(e.message||'erreur inconnue').slice(0,200)});
      console.log(`✘ ${feed.name} — ${e.message}`);
    }
  }

  const existingItems=loadExistingItems();
  const allItems=mergeWithRetention(existingItems,freshItems);
  allItems.sort((a,b)=>b.date>a.date?1:-1);

  const output={
    generatedAt:new Date().toISOString(),
    totalFeeds:RSS_FEEDS.length,
    items:allItems,
    failedFeeds
  };

  fs.writeFileSync(FEEDS_JSON_PATH,JSON.stringify(output));
  console.log(`\nTerminé : ${allItems.length} articles en mémoire (dont ${freshItems.length} récupérés aujourd'hui), ${failedFeeds.length} flux en échec sur ${RSS_FEEDS.length}.`);
}

run().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
