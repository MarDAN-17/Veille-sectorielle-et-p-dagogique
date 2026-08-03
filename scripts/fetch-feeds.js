/* ══════════════════════════════════════════════════════════════
   Génère feeds.json à partir des 66 flux RSS, sans passer par rss2json.
   Exécuté automatiquement 1x/jour par GitHub Actions (voir .github/workflows/veille.yml)
   Peut aussi être lancé manuellement en local : node scripts/fetch-feeds.js
   ══════════════════════════════════════════════════════════════ */
const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser({ timeout: 15000 });

/* ══════ LISTE DES FLUX (identique à l'ancien RSS_FEEDS d'index.html) ══════ */
const RSS_FEEDS = [
  /* VÉTÉRINAIRE */
  {url:"https://apform.fr/feed/",name:"APFORM",peri:"vet"},
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
  {url:"https://rss.app/feeds/ms3IMBpi8WOtq4o7.xml",name:"SNVEL",peri:"vet"},
  {url:"https://rss.app/feeds/hZ6uwoVUoNLK1dsf.xml",name:"La Dépêche Vétérinaire",peri:"vet"},
  {url:"https://rss.app/feeds/PceSswzMXGRPvei0.xml",name:"Le Point Vétérinaire",peri:"vet"},
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
  {url:"https://rss.app/feeds/dFVbEbdCTARlNGNm.xml",name:"OPCO EP",peri:"reg"},
  /* IA & PÉDAGOGIE */
  {url:"https://ainoa-asso.fr/feed/",name:"AINOA",peri:"ia"},
  {url:"https://portaileduc.net/website/feed/",name:"PortailEduc",peri:"ia"},
  {url:"https://sydologie.com/feed",name:"Sydologie",peri:"ia"},
  {url:"https://latelierduformateur.fr/feed/",name:"L'Atelier du Formateur",peri:"ia"},
  {url:"https://outilstice.com/feed/",name:"Les Outils Tice",peri:"ia"},
  {url:"https://www.istf-formation.fr/feed/",name:"ISTF",peri:"ia"},
  {url:"https://feeds.feedburner.com/elearningindustry",name:"eLearning Industry",peri:"ia"},
  {url:"https://www.letudiant.fr/educpros/rss.xml",name:"Educpros",peri:"ia"},
  {url:"https://journals.openedition.org/feed.php",name:"Distances & Médiations",peri:"ia"},
  {url:"https://lepodcastdelaformation.fr/feed/",name:"Podcast de la Formation",peri:"ia"},
  {url:"https://blog.google/rss",name:"Google Blog",peri:"ia"},
  {url:"https://openai.com/news/rss.xml",name:"OpenAI Blog",peri:"ia"},
  {url:"https://towardsdatascience.com/feed/",name:"Towards Data Science",peri:"ia"},
  {url:"https://feeds.podcastics.com/podcastics/podcasts/rss/6628_a9c72191f50b205a6ebe0276fb677e8f.rss",name:"Podcast Formation Pro",peri:"ia"},
  {url:"https://www.audible.fr/blog/rss.xml",name:"Audible Blog",peri:"ia"},
  {url:"https://rss.app/feeds/pwLs2q5Qei1xfnGG.xml",name:"Blog Articulate",peri:"ia"},
  {url:"https://rss.app/feeds/esKG9cZhHIbFAZVl.xml",name:"Blog MyVirtualClassroom",peri:"ia"},
  {url:"https://rss.app/feeds/zdAHoPpGZHrQhHoq.xml",name:"RDV en terre digitale",peri:"ia"},
  {url:"https://www.digiformag.com/feed/",name:"Digiformag",peri:"ia"},
  {url:"https://www.certif-avenir.fr/blog-feed.xml",name:"Certif Avenir",peri:"ia"},
];

/* ══════ PRIORITÉ SUGGÉRÉE — modèle à points cumulables ══════ */
const PRIORITY_HIGH=["délégation d'acte","délégation d'actes","actes délégués","acte délégué","gipsa","titre asv",
  "asv gipsa","qualiopi","rncp","certification professionnelle","loi d'orientation agricole","convention collective",
  "échelon 5","opco ep","cqp","apprentissage vétérinaire","alternance vétérinaire","délégués du snvel","habilitation",
  "centre de formation habilité","jury national","manuel de formation aux actes"];
const PRIORITY_MED=["france compétences","vademecum","centre inffo","vae ","validation des acquis",
  "formation continue","ingénierie pédagogique","référentiel","évaluation certificative","mentorat vétérinaire",
  "bien-être animal","santé publique vétérinaire","droit de la formation","réforme de la formation","apprentissage",
  "apprenti","apprentis","contrat d'apprentissage","premier équipement","financement formation","financement des apprentis"];
const PRIORITY_LOW=["canicule","sécheresse","engrais","haie","pfas","eau potable","phytosanitaire","safer",
  "label rouge","crevette","nématode"];

/* Sources dont la seule provenance justifie un bonus de priorité, propre à chaque périmètre */
const SOURCE_PRIORITY={
  vet:["SNVEL","APFORM","Ordre des Vétérinaires"],
  reg:["OPCO EP","France Compétences","France Compétences RSS","Centre Inffo","Centre Inffo — Quotidien",
    "Centre Inffo — Réforme","Centre Inffo — Droit formation","Centre Inffo — Régions","Centre Inffo — Europe",
    "Centre Inffo — Innovation"],
  ia:["AINOA","Sydologie","Podcast de la Formation","L'Atelier du Formateur"]
};

function countMatches(text,list){
  return list.reduce((n,k)=>text.includes(k)?n+1:n,0);
}

function suggestPriority(text,sourceName,peri){
  const low=text.toLowerCase();
  let score=0;
  score+=countMatches(low,PRIORITY_HIGH)*3;
  score+=countMatches(low,PRIORITY_MED)*1;
  if(SOURCE_PRIORITY[peri]&&SOURCE_PRIORITY[peri].includes(sourceName))score+=2;
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

function stripHtml(html){
  return (html||'').replace(/<[^>]+>/g,'').trim();
}

async function fetchWithFallback(url){
  try{
    return await parser.parseURL(url);
  }catch(e){
    // Repli : certains flux WordPress mal formés (ex: "&" non échappé) font échouer le parseur strict.
    // On récupère le texte brut, on corrige les "&" isolés, et on retente.
    const res=await fetch(url);
    if(!res.ok)throw e;
    let text=await res.text();
    text=text.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g,'&amp;');
    return await parser.parseString(text);
  }
}

async function run(){
  const allItems=[];
  const failedFeeds=[];

  for(const feed of RSS_FEEDS){
    try{
      const parsed=await fetchWithFallback(feed.url);
      const items=(parsed.items||[]).slice(0,5).map(item=>{
        const title=(item.title||'').trim();
        const desc=stripHtml(item.contentSnippet||item.content||item.summary||'').slice(0,180);
        const date=item.isoDate?item.isoDate.slice(0,10):(item.pubDate?new Date(item.pubDate).toISOString().slice(0,10):'');
        const p=suggestPriority(title+' '+desc,feed.name,feed.peri);
        return{title,link:(item.link||'').trim(),date,desc,source:feed.name,peri:feed.peri,sugUrg:p.urg,sugImpact:p.impact};
      }).filter(it=>!isOffTopic(it.title+' '+it.desc));
      allItems.push(...items);
      console.log(`✔ ${feed.name} (${items.length} articles)`);
    }catch(e){
      failedFeeds.push({name:feed.name,peri:feed.peri,reason:(e.message||'erreur inconnue').slice(0,200)});
      console.log(`✘ ${feed.name} — ${e.message}`);
    }
  }

  allItems.sort((a,b)=>b.date>a.date?1:-1);

  const output={
    generatedAt:new Date().toISOString(),
    totalFeeds:RSS_FEEDS.length,
    items:allItems,
    failedFeeds
  };

  fs.writeFileSync(path.join(__dirname,'..','feeds.json'),JSON.stringify(output));
  console.log(`\nTerminé : ${allItems.length} articles récupérés, ${failedFeeds.length} flux en échec sur ${RSS_FEEDS.length}.`);
}

run().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
