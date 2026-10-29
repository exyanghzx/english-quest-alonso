const vocabulary=[
  {en:'Hello',es:'Hola',sentence:'Hello! My name is Ana.'},{en:'Goodbye',es:'Adiós',sentence:'Goodbye! See you tomorrow.'},
  {en:'Please',es:'Por favor',sentence:'Please, speak slowly.'},{en:'Thank you',es:'Gracias',sentence:'Thank you very much.'},
  {en:'Name',es:'Nombre',sentence:'My name is Luis.'},{en:'Age',es:'Edad',sentence:'What is your age?'},
  {en:'Country',es:'País',sentence:'Peru is my country.'},{en:'Friend',es:'Amigo',sentence:'She is my friend.'},
  {en:'Fine',es:'Bien',sentence:'I am fine, thank you.'},{en:'Meet',es:'Conocer',sentence:'Nice to meet you.'}
];
const orderSentences=[
  {words:['My','name','is','Daniel.'],translation:'Me llamo Daniel.'},
  {words:['I','am','21','years','old.'],translation:'Tengo 21 años.'},
  {words:['Nice','to','meet','you.'],translation:'Mucho gusto.'},
  {words:['I','am','from','Peru.'],translation:'Soy de Perú.'},
  {words:['I','like','music.'],translation:'Me gusta la música.'}
];
const defaultState={xp:0,hearts:5,progress:0,streak:1,lastStudy:'',correct:0};
let state={...defaultState,...JSON.parse(localStorage.getItem('englishQuestProgress')||'{}')};
let currentGame='quiz',quizIndex=0,quizAnswered=false,orderIndex=0,selectedWords=[],matchSelected=[];
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];

function save(){
  const today=new Date().toISOString().slice(0,10);
  if(state.lastStudy&&state.lastStudy!==today){
    const prev=new Date(state.lastStudy),now=new Date(today); const days=Math.round((now-prev)/86400000);
    state.streak=days===1?state.streak+1:1;
  }
  state.lastStudy=today;localStorage.setItem('englishQuestProgress',JSON.stringify(state));renderStats();
}
function renderStats(){
  $('#xp').textContent=state.xp;$('#hearts').textContent=state.hearts;$('#streak').textContent=state.streak;
  $('#sidebar-progress').style.width=`${state.progress}%`;$('#sidebar-percent').textContent=state.progress;
}
function showView(id){
  $$('.view').forEach(v=>v.classList.toggle('active',v.id===id));
  $$('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.view===id));
  $('.sidebar').classList.remove('open');window.scrollTo({top:0,behavior:'smooth'});
}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200)}
function speak(text,rate=.82){speechSynthesis.cancel();const utter=new SpeechSynthesisUtterance(text);utter.lang='en-US';utter.rate=rate;speechSynthesis.speak(utter)}
function shuffle(items){return [...items].sort(()=>Math.random()-.5)}
function gainXp(amount){state.xp+=amount;state.correct+=1;state.progress=Math.min(100,Math.max(state.progress,Math.round(state.correct/20*100)));save()}

$$('[data-view]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();showView(el.dataset.view)}));
$$('[data-start-lesson]').forEach(el=>el.addEventListener('click',()=>showView('leccion')));
$$('[data-say]').forEach(el=>el.addEventListener('click',()=>speak(el.dataset.say)));
$('#mobile-menu').addEventListener('click',()=>$('.sidebar').classList.toggle('open'));
$('#finish-lesson').addEventListener('click',()=>{state.progress=Math.max(state.progress,15);state.xp+=20;save();showView('practica');startGame('quiz');toast('+20 XP · Lección completada')});
$$('[data-copy]').forEach(el=>el.addEventListener('click',async()=>{await navigator.clipboard.writeText(el.dataset.copy);toast('Mensaje copiado · pégalo en ChatGPT')}));
$$('[data-game]').forEach(el=>el.addEventListener('click',()=>{showView('practica');startGame(el.dataset.game)}));

function activatePicker(game){$$('.game-picker button').forEach(b=>b.classList.toggle('active',b.dataset.game===game))}
function startGame(game){currentGame=game;activatePicker(game);if(game==='quiz'){quizIndex=0;renderQuiz()}if(game==='order'){orderIndex=0;selectedWords=[];renderOrder()}if(game==='match'){matchSelected=[];renderMatch()}if(game==='speak')renderSpeak()}

function renderQuiz(){
  quizAnswered=false;const item=vocabulary[quizIndex%vocabulary.length];const options=shuffle([item.es,...shuffle(vocabulary.filter(v=>v!==item)).slice(0,3).map(v=>v.es)]);
  $('#game-area').innerHTML=`<div class="game-card"><span class="game-label">TRADUCE AL ESPAÑOL</span><h2>${item.en}</h2><div class="answers">${options.map(o=>`<button data-answer="${o}">${o}</button>`).join('')}</div><div class="game-footer"><span class="game-progress">Pregunta ${quizIndex+1} de 10</span><span class="feedback" id="feedback">Elige una respuesta</span></div></div>`;
  $$('#game-area [data-answer]').forEach(btn=>btn.addEventListener('click',()=>{if(quizAnswered)return;quizAnswered=true;const ok=btn.dataset.answer===item.es;btn.classList.add(ok?'correct':'wrong');if(ok){gainXp(10);$('#feedback').textContent='¡Correcto! +10 XP';$('#feedback').className='feedback good'}else{state.hearts=Math.max(0,state.hearts-1);save();$('#feedback').textContent=`Respuesta: ${item.es}`;$('#feedback').className='feedback bad';$$('#game-area [data-answer]').find(b=>b.dataset.answer===item.es).classList.add('correct')}setTimeout(()=>{quizIndex++;quizIndex<10?renderQuiz():renderComplete()},1100)}));
}
function renderOrder(){
  const item=orderSentences[orderIndex%orderSentences.length];const bank=shuffle(item.words.map((word,i)=>({word,id:i+word})));
  $('#game-area').innerHTML=`<div class="game-card"><span class="game-label">ORDENA LA FRASE</span><h2>${item.translation}</h2><div class="token-zone" id="token-zone"><span class="game-progress">Toca las palabras en el orden correcto</span></div><div class="token-bank">${bank.map(t=>`<button class="word-token" data-word="${t.word}" data-id="${t.id}">${t.word}</button>`).join('')}</div><div class="game-footer"><button class="next-button" id="check-order">Comprobar</button><span class="feedback" id="feedback"></span></div></div>`;
  $$('.word-token').forEach(btn=>btn.addEventListener('click',()=>{if(btn.classList.contains('selected'))return;btn.classList.add('selected');selectedWords.push(btn.dataset.word);$('#token-zone').innerHTML=selectedWords.map(w=>`<span class="word-token selected">${w}</span>`).join('')}));
  $('#check-order').addEventListener('click',()=>{const ok=selectedWords.join(' ')===item.words.join(' ');if(ok){gainXp(15);$('#feedback').textContent='¡Perfecto! +15 XP';$('#feedback').className='feedback good';speak(item.words.join(' '));setTimeout(()=>{orderIndex++;selectedWords=[];orderIndex<5?renderOrder():renderComplete()},1300)}else{$('#feedback').textContent='Inténtalo otra vez';$('#feedback').className='feedback bad';selectedWords=[];setTimeout(renderOrder,700)}})
}
function renderMatch(){
  const pairs=shuffle(vocabulary).slice(0,4);const cards=shuffle(pairs.flatMap((p,i)=>[{text:p.en,pair:i},{text:p.es,pair:i}]));
  $('#game-area').innerHTML=`<div class="game-card"><span class="game-label">ENCUENTRA LAS PAREJAS</span><h2>Inglés + español</h2><div class="match-grid">${cards.map((c,i)=>`<button class="match-card" data-pair="${c.pair}" data-index="${i}">${c.text}</button>`).join('')}</div><div class="game-footer"><span class="game-progress">Une cada palabra con su significado</span><span class="feedback" id="feedback"></span></div></div>`;
  $$('.match-card').forEach(card=>card.addEventListener('click',()=>{if(card.classList.contains('matched')||matchSelected.includes(card))return;card.classList.add('selected');matchSelected.push(card);if(matchSelected.length===2){const [a,b]=matchSelected;if(a.dataset.pair===b.dataset.pair){a.classList.add('matched');b.classList.add('matched');gainXp(10);$('#feedback').textContent='¡Pareja! +10 XP';$('#feedback').className='feedback good';if($$('.match-card:not(.matched)').length===0)setTimeout(renderComplete,700)}else{$('#feedback').textContent='No coinciden';$('#feedback').className='feedback bad';setTimeout(()=>{a.classList.remove('selected');b.classList.remove('selected')},500)}matchSelected=[]}}));
}
function renderSpeak(){
  const phrase='Hello, my name is Alex.';
  $('#game-area').innerHTML=`<div class="game-card"><span class="game-label">PRONUNCIACIÓN</span><h2>${phrase}</h2><button class="big-audio" id="listen-phrase" aria-label="Escuchar frase">🔊</button><div class="speak-box"><p>1. Escucha dos veces.<br>2. Imita el ritmo, no cada letra.<br>3. Pulsa el micrófono y di la frase.</p></div><button class="mic-button" id="mic-button">● Empezar a hablar</button><div class="game-footer"><span class="game-progress">El reconocimiento depende de tu navegador</span><span class="feedback" id="feedback"></span></div></div>`;
  $('#listen-phrase').addEventListener('click',()=>speak(phrase,.72));
  $('#mic-button').addEventListener('click',()=>{const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Recognition){$('#feedback').textContent='Tu navegador no ofrece reconocimiento. Grábate con el móvil y compárate.';return}const recognition=new Recognition();recognition.lang='en-US';recognition.interimResults=false;$('#feedback').textContent='Escuchando…';recognition.start();recognition.onresult=e=>{const heard=e.results[0][0].transcript;const normalize=s=>s.toLowerCase().replace(/[^a-z ]/g,'').trim();const ok=normalize(heard).includes('hello')&&normalize(heard).includes('my name is');if(ok){gainXp(20);$('#feedback').textContent=`Escuché: “${heard}” · ¡Muy bien! +20 XP`;$('#feedback').className='feedback good'}else{$('#feedback').textContent=`Escuché: “${heard}”. Escucha e inténtalo otra vez.`;$('#feedback').className='feedback bad'}};recognition.onerror=()=>{$('#feedback').textContent='No pude escuchar. Revisa el permiso del micrófono.'}})
}
function renderComplete(){$('#game-area').innerHTML=`<div class="game-card"><span class="game-label">SESIÓN COMPLETADA</span><h2>¡Buen trabajo! 🎉</h2><p class="lead">Hoy entrenaste recuperación activa, comprensión y producción. Mañana, repite antes de avanzar.</p><button class="primary" id="again">Practicar otra vez</button></div>`;$('#again').addEventListener('click',()=>startGame(currentGame))}

renderStats();startGame('quiz');
