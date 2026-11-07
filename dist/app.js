const numbers = [
  ['0','zero'],['1','one'],['2','two'],['3','three'],['4','four'],['5','five'],['6','six'],['7','seven'],['8','eight'],['9','nine'],['10','ten'],
  ['11','eleven'],['12','twelve'],['13','thirteen'],['14','fourteen'],['15','fifteen'],['16','sixteen'],['17','seventeen'],['18','eighteen'],['19','nineteen'],['20','twenty'],['21','twenty-one']
];

const toBeQuestions = [
  {sentence:'I ___ Alonso.', answer:'am', explanation:'Con I usamos am.'},
  {sentence:'You ___ my friend.', answer:'are', explanation:'Con you usamos are.'},
  {sentence:'She ___ from Peru.', answer:'is', explanation:'Con she usamos is.'},
  {sentence:'He ___ twenty years old.', answer:'is', explanation:'Con he usamos is.'},
  {sentence:'We ___ students.', answer:'are', explanation:'Con we usamos are.'},
  {sentence:'They ___ happy.', answer:'are', explanation:'Con they usamos are.'},
  {sentence:'It ___ a game.', answer:'is', explanation:'Con it usamos is.'},
  {sentence:'I ___ not tired.', answer:'am', explanation:'La negación es I am not.'}
];

const orderSentences = [
  {words:['I','am','twenty-one','years','old.'], translation:'Tengo veintiún años.'},
  {words:['She','is','from','Peru.'], translation:'Ella es de Perú.'},
  {words:['Are','you','a','student?'], translation:'¿Eres estudiante?'},
  {words:['I','am','not','tired.'], translation:'No estoy cansado.'},
  {words:['They','are','my','friends.'], translation:'Ellos son mis amigos.'}
];

const previousVocabulary = [
  {en:'Hello',es:'Hola'},{en:'Goodbye',es:'Adiós'},{en:'Please',es:'Por favor'},{en:'Thank you',es:'Gracias'},
  {en:'Name',es:'Nombre'},{en:'Age',es:'Edad'},{en:'Country',es:'País'},{en:'Friend',es:'Amigo'},
  {en:'Fine',es:'Bien'},{en:'Meet',es:'Conocer'}
];

const defaultStages = {lesson:false,numbers:false,tobe:false,order:false,xiaoma:false};
const defaultState = {xp:0,hearts:5,streak:1,lastStudy:'',foundationStages:defaultStages,foundationComplete:false};
let saved = {};
try { saved = JSON.parse(localStorage.getItem('englishQuestProgress') || '{}'); } catch (_) { saved = {}; }
let state = {
  ...defaultState,
  ...saved,
  foundationStages:{...defaultStages,...(saved.foundationStages || {})}
};

let currentGame = 'numbers';
let queue = [];
let gameIndex = 0;
let answered = false;
let selectedWords = [];

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const shuffle = items => [...items].sort(() => Math.random() - .5);

function foundationProgress(){
  const completed = Object.values(state.foundationStages).filter(Boolean).length;
  return completed * 20;
}

function save(){
  const today = new Date().toISOString().slice(0,10);
  if(state.lastStudy && state.lastStudy !== today){
    const days = Math.round((new Date(today) - new Date(state.lastStudy)) / 86400000);
    state.streak = days === 1 ? state.streak + 1 : 1;
  }
  state.lastStudy = today;
  localStorage.setItem('englishQuestProgress', JSON.stringify(state));
  renderStats();
}

function renderStats(){
  const progress = foundationProgress();
  $('#xp').textContent = state.xp;
  $('#hearts').textContent = state.hearts;
  $('#streak').textContent = state.streak;
  $('#sidebar-progress').style.width = `${progress}%`;
  $('#sidebar-percent').textContent = progress;
}

function completeStage(stage, xp){
  if(!state.foundationStages[stage]){
    state.foundationStages[stage] = true;
    state.xp += xp;
  }
  state.foundationComplete = foundationProgress() === 100;
  save();
}

function showView(id){
  $$('.view').forEach(view => view.classList.toggle('active', view.id === id));
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === id));
  $('.sidebar').classList.remove('open');
  window.scrollTo({top:0,behavior:'smooth'});
}

function toast(message){
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  setTimeout(() => element.classList.remove('show'), 2300);
}

function speak(text, rate=.78){
  if(!('speechSynthesis' in window)){ toast('Este navegador no ofrece audio de voz.'); return; }
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = rate;
  speechSynthesis.speak(utterance);
}

function renderNumberGrid(){
  $('#number-grid').innerHTML = numbers.map(([digit,word]) => `<button data-say="${word}"><strong>${digit}</strong><span>${word}</span><small>🔊 escuchar</small></button>`).join('');
}

function activatePicker(game){
  $$('.game-picker button').forEach(button => button.classList.toggle('active', button.dataset.game === game));
}

function startGame(game){
  currentGame = game;
  activatePicker(game);
  gameIndex = 0;
  answered = false;
  selectedWords = [];
  if(game === 'numbers'){
    queue = shuffle(numbers.slice(0,21)).slice(0,10).map(([digit,word]) => ({digit,word}));
    renderNumberQuestion();
  }
  if(game === 'tobe'){
    queue = shuffle(toBeQuestions);
    renderToBeQuestion();
  }
  if(game === 'order'){
    queue = [...orderSentences];
    renderOrderQuestion();
  }
  if(game === 'xiaoma') renderXiaoma();
  if(game === 'review'){
    queue = shuffle(previousVocabulary);
    renderReviewQuestion();
  }
}

function answerButtons(options){
  return `<div class="answers">${options.map(option => `<button data-answer="${option}">${option}</button>`).join('')}</div>`;
}

function handleChoice(correct, explanation, next){
  $$('#game-area [data-answer]').forEach(button => button.addEventListener('click', () => {
    if(answered) return;
    answered = true;
    const ok = button.dataset.answer === correct;
    button.classList.add(ok ? 'correct' : 'wrong');
    if(ok){
      $('#feedback').textContent = '¡Correcto!';
      $('#feedback').className = 'feedback good';
    }else{
      state.hearts = Math.max(0,state.hearts-1);
      save();
      const right = $$('#game-area [data-answer]').find(candidate => candidate.dataset.answer === correct);
      if(right) right.classList.add('correct');
      $('#feedback').textContent = `${explanation}`;
      $('#feedback').className = 'feedback bad';
    }
    setTimeout(next, ok ? 750 : 1500);
  }));
}

function renderNumberQuestion(){
  const item = queue[gameIndex];
  const distractors = shuffle(numbers.filter(number => number[0] !== item.digit)).slice(0,3).map(number => number[0]);
  const options = shuffle([item.digit,...distractors]);
  $('#game-area').innerHTML = `<div class="game-card"><span class="game-label">NÚMEROS 0–20</span><h2>${item.word}</h2><button class="listen-inline" data-say="${item.word}">🔊 Escuchar</button>${answerButtons(options)}<div class="game-footer"><span class="game-progress">${gameIndex+1} de ${queue.length}</span><span class="feedback" id="feedback">Elige el número</span></div></div>`;
  answered = false;
  handleChoice(item.digit, `${item.word} = ${item.digit}`, () => {
    gameIndex++;
    if(gameIndex < queue.length) renderNumberQuestion(); else renderComplete('numbers','Números entrenados');
  });
}

function renderToBeQuestion(){
  const item = queue[gameIndex];
  $('#game-area').innerHTML = `<div class="game-card"><span class="game-label">ELIGE AM, IS O ARE</span><h2>${item.sentence}</h2>${answerButtons(shuffle(['am','is','are']))}<div class="game-footer"><span class="game-progress">${gameIndex+1} de ${queue.length}</span><span class="feedback" id="feedback">Piensa primero en el sujeto</span></div></div>`;
  answered = false;
  handleChoice(item.answer, item.explanation, () => {
    gameIndex++;
    if(gameIndex < queue.length) renderToBeQuestion(); else renderComplete('tobe','Verbo to be entrenado');
  });
}

function renderOrderQuestion(){
  const item = queue[gameIndex];
  const bank = shuffle(item.words.map((word,index) => ({word,id:`${index}-${word}`})));
  $('#game-area').innerHTML = `<div class="game-card"><span class="game-label">CONSTRUYE SIN COPIAR</span><h2>${item.translation}</h2><div class="token-zone" id="token-zone"><span class="game-progress">Toca las palabras en orden</span></div><div class="token-bank">${bank.map(token => `<button class="word-token" data-word="${token.word}" data-id="${token.id}">${token.word}</button>`).join('')}</div><div class="game-footer"><button class="next-button" id="check-order">Comprobar</button><span class="feedback" id="feedback"></span></div></div>`;
  selectedWords = [];
  $$('.word-token').forEach(button => button.addEventListener('click', () => {
    if(button.classList.contains('selected')) return;
    button.classList.add('selected');
    selectedWords.push(button.dataset.word);
    $('#token-zone').innerHTML = selectedWords.map(word => `<span class="word-token selected">${word}</span>`).join('');
  }));
  $('#check-order').addEventListener('click', () => {
    const ok = selectedWords.join(' ') === item.words.join(' ');
    if(ok){
      $('#feedback').textContent = '¡Correcto!';
      $('#feedback').className = 'feedback good';
      speak(item.words.join(' '));
      setTimeout(() => {
        gameIndex++;
        if(gameIndex < queue.length) renderOrderQuestion(); else renderComplete('order','Construcción entrenada');
      },1100);
    }else{
      $('#feedback').textContent = 'Todavía no. Vuelve a ordenar.';
      $('#feedback').className = 'feedback bad';
      state.hearts = Math.max(0,state.hearts-1);
      save();
      setTimeout(renderOrderQuestion,900);
    }
  });
}

function renderXiaoma(){
  $('#game-area').innerHTML = `<div class="game-card xiaoma-mission"><span class="game-label">MODO XIAOMA · CON BASE</span><h2>Misión: 90 segundos sobre ti</h2><p>No memorices sonidos vacíos. Primero entiende cada estructura; luego úsala con tus datos.</p><div class="mission-rounds"><label><input type="checkbox" data-round> <span><b>Ronda 1 · Con apoyo</b>Lee: “I am Alonso. I am twenty-one years old. I am from Peru.”</span></label><label><input type="checkbox" data-round> <span><b>Ronda 2 · Con palabras clave</b>Mira solo: name · age · country. Forma las frases tú.</span></label><label><input type="checkbox" data-round> <span><b>Ronda 3 · Sin mirar</b>Dilo sin texto y responde: “Are you twenty-one years old?”</span></label></div><div class="repair-kit"><b>Kit para no bloquearte</b><button data-say="Could you repeat that, please?">🔊 Could you repeat that, please?</button><button data-say="Please speak more slowly.">🔊 Please speak more slowly.</button><button data-say="I do not understand yet.">🔊 I don’t understand yet.</button></div><button class="primary" id="finish-xiaoma" disabled>Registrar misión</button><p class="manual-note" id="xiaoma-note">Marca las tres rondas cuando realmente las hagas.</p></div>`;
  const rounds = $$('[data-round]');
  const finish = $('#finish-xiaoma');
  rounds.forEach(round => round.addEventListener('change', () => { finish.disabled = !rounds.every(item => item.checked); }));
  finish.addEventListener('click', () => {
    completeStage('xiaoma',30);
    renderComplete('xiaoma','Misión Xiaoma registrada');
  });
}

function renderReviewQuestion(){
  const item = queue[gameIndex];
  const options = shuffle([item.es,...shuffle(previousVocabulary.filter(word => word.en !== item.en)).slice(0,3).map(word => word.es)]);
  $('#game-area').innerHTML = `<div class="game-card"><span class="game-label">REPASO DE LA LECCIÓN ANTERIOR</span><h2>${item.en}</h2>${answerButtons(options)}<div class="game-footer"><span class="game-progress">${gameIndex+1} de ${queue.length}</span><span class="feedback" id="feedback">Elige la traducción</span></div></div>`;
  answered = false;
  handleChoice(item.es, `${item.en} = ${item.es}`, () => {
    gameIndex++;
    if(gameIndex < queue.length) renderReviewQuestion(); else renderComplete(null,'Repaso terminado');
  });
}

function renderComplete(stage,label){
  if(stage && stage !== 'xiaoma') completeStage(stage,20);
  const progress = foundationProgress();
  const next = stage === 'numbers' ? 'tobe' : stage === 'tobe' ? 'order' : stage === 'order' ? 'xiaoma' : 'numbers';
  const allDone = progress === 100;
  $('#game-area').innerHTML = `<div class="game-card"><span class="game-label">${allDone ? 'BASE 0 COMPLETADA' : 'ACTIVIDAD COMPLETADA'}</span><h2>${label} ${allDone ? '🎉' : '✓'}</h2><p class="lead">${allDone ? 'Terminaste la primera base. Ahora practica conmigo para comprobar que puedes responder sin pistas.' : `Progreso de la Base 0: ${progress}%. Continúa con el siguiente bloque.`}</p><button class="primary" id="next-activity">${allDone ? 'Volver al inicio' : 'Siguiente actividad'}</button></div>`;
  $('#next-activity').addEventListener('click', () => allDone ? showView('inicio') : startGame(next));
}

document.addEventListener('click', event => {
  const speech = event.target.closest('[data-say]');
  if(speech) speak(speech.dataset.say);
});

$$('[data-view]').forEach(element => element.addEventListener('click', event => {
  event.preventDefault();
  showView(element.dataset.view);
}));

$$('[data-start-foundation]').forEach(element => element.addEventListener('click', () => showView('leccion')));
$$('[data-game]').forEach(element => element.addEventListener('click', () => {
  showView('practica');
  startGame(element.dataset.game);
}));

$('#mobile-menu').addEventListener('click', () => $('.sidebar').classList.toggle('open'));
$('#finish-lesson').addEventListener('click', () => {
  completeStage('lesson',20);
  showView('practica');
  startGame('numbers');
  toast('Explicación completada · ahora demuestra lo aprendido');
});

$$('[data-copy]').forEach(element => element.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(element.dataset.copy); toast('Mensaje copiado · pégalo en ChatGPT'); }
  catch (_) { toast('Selecciona y copia el mensaje manualmente.'); }
}));

renderNumberGrid();
renderStats();
startGame('numbers');
