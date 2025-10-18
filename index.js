/*
	Slot machine demo
	- spin logic
	- credits, bet, payout calculation
	- auto-spin toggle
*/

console.log('slot machine loaded');

const symbols = ['🍒','🍋','🔔','⭐','🍇'];
const reels = [document.getElementById('reel0'), document.getElementById('reel1'), document.getElementById('reel2')];
const creditsEl = document.getElementById('credits');
const betEl = document.getElementById('bet');
const spinBtn = document.getElementById('spinBtn');
const autoBtn = document.getElementById('autoBtn');
const messageEl = document.getElementById('message');

let credits = 100;
let auto = false;

function updateCredits(){ creditsEl.textContent = credits; }

function randomSymbol(){ return symbols[Math.floor(Math.random()*symbols.length)]; }

function evaluate(a,b,c,bet){
	// simple payouts
	if(a===b && b===c){
		// three of a kind
		if(a==='⭐') return bet*10;
		return bet*5;
	}
	if(a===b || b===c || a===c) return bet*2; // pair
	return -bet; // loss
}

async function spin(){
	const bet = Number(betEl.value);
	if(bet>credits) { messageEl.textContent='Not enough credits'; return; }
	// take bet temporarily
	credits -= bet;
	updateCredits();
	messageEl.textContent='Spinning...';

	// animate reels
	const durations = [700, 1100, 1500];
	const results = [];
	for(let i=0;i<reels.length;i++){
		const r = reels[i];
		// quick random flicker
		const start = Date.now();
		const dur = durations[i];
		await new Promise(resolve =>{
			const t = setInterval(()=>{
				r.textContent = randomSymbol();
				r.classList.add('spin');
				if(Date.now()-start>dur){
					clearInterval(t);
					r.classList.remove('spin');
					const sym = randomSymbol();
					r.textContent = sym;
					results[i]=sym;
					resolve();
				}
			},80);
		});
	}

	// evaluate
	let payout = evaluate(results[0],results[1],results[2],bet);
	if(payout>0){
		// apply inventory effects (may modify payout)
		payout = applyInventoryOnWin ? applyInventoryOnWin(payout) : payout;
		credits += bet + payout; // give back bet + win
		messageEl.textContent = `You won ${payout}!`;
	} else {
		messageEl.textContent = `You lost ${bet}.`;
	}
	updateCredits();

	// auto mode
	if(auto && credits>0) setTimeout(spin, 600);
}

spinBtn.addEventListener('click', ()=>{ if(!auto) spin(); });
autoBtn.addEventListener('click', ()=>{
	auto = !auto;
	autoBtn.textContent = auto ? 'STOP' : 'AUTO';
	if(auto) spin();
});

updateCredits();

// ----------------------
// LOGIN UI: modal + animation
// ----------------------

// 모달 마크업을 동적으로 추가(기존 HTML을 크게 변경하지 않으려는 경우)
const modalHtml = `
	<div class="modal-backdrop" id="loginModal">
		<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="loginTitle">
			<div class="modal-header">
				<div class="modal-title" id="loginTitle">Welcome Back</div>
				<button class="modal-close" id="loginClose" aria-label="Close">✕</button>
			</div>
			<div class="field">
				<label for="loginUser">Username</label>
				<input id="loginUser" placeholder="yourname@example.com" autocomplete="username">
			</div>
			<div class="field">
				<label for="loginPass">Password</label>
				<input id="loginPass" type="password" placeholder="password" autocomplete="current-password">
			</div>
			<div class="row-opts">
				<label class="remember"><input type="checkbox" id="rememberChk"> Remember me</label>
				<div class="forgot">Forgot Password?</div>
			</div>
			<button class="btn" id="loginSubmit">Login</button>
			<div class="helper" id="loginHelper">기능 구현은 없고 예제용입니다.</div>
			<div class="register">Don't have an account? <span class="link">Register</span></div>
		</div>
	</div>
`;

// append modal to body
document.body.insertAdjacentHTML('beforeend', modalHtml);

const loginToggle = document.getElementById('loginToggle');
const loginModal = document.getElementById('loginModal');
const loginClose = document.getElementById('loginClose');
const loginSubmit = document.getElementById('loginSubmit');
const loginHelper = document.getElementById('loginHelper');

function openModal(){
	if(!loginModal) return;
	loginModal.classList.add('open');
	// 포커스 이동
	const u = document.getElementById('loginUser');
	if(u) u.focus();
}
function closeModal(){
	if(!loginModal) return;
	loginModal.classList.remove('open');
}

if(loginToggle) loginToggle.addEventListener('click', openModal);
if(loginClose) loginClose.addEventListener('click', closeModal);
// 닫기: 백드롭 클릭 시
if(loginModal) loginModal.addEventListener('click', (e)=>{ if(e.target === loginModal) closeModal(); });

if(loginSubmit){
	loginSubmit.addEventListener('click', ()=>{
		const user = document.getElementById('loginUser')?.value || '';
		const pass = document.getElementById('loginPass')?.value || '';
		const remember = document.getElementById('rememberChk')?.checked || false;
		// 간단한 시각적 피드백: 입력 체크
		if(!user || !pass){
			loginHelper.textContent = '사용자명과 비밀번호를 모두 입력해주세요.';
			loginHelper.style.color = '#f87171';
			return;
		}
		loginHelper.style.color = '#94a3b8';
		loginHelper.innerHTML = '<span class="spinner" aria-hidden="true"></span> 로그인 시도 중...';

		// 모의 로그인(타이머 사용) — 실제 인증은 없음
		setTimeout(()=>{
			if(remember) localStorage.setItem('demo.user', user);
			loginHelper.innerHTML = '<span class="success-badge">로그인 성공</span>';
			setTimeout(()=> closeModal(), 900);
		}, 900);
	});
}

// 자동 채우기: 저장된 사용자 보여주기
const saved = localStorage.getItem('demo.user');
if(saved){
	const u = document.getElementById('loginUser');
	if(u) u.value = saved;
}

// ----------------------
// NON-GAMBLING FEATURES: Guess Game, Stats, Theme Toggle
// ----------------------

// Stats (persisted)
const statSpins = document.getElementById('statSpins');
const statWins = document.getElementById('statWins');
const statLosses = document.getElementById('statLosses');
const resetStats = document.getElementById('resetStats');

let stats = JSON.parse(localStorage.getItem('demo.stats') || '{"spins":0,"wins":0,"losses":0}');

function saveStats(){ localStorage.setItem('demo.stats', JSON.stringify(stats)); renderStats(); }
function renderStats(){ if(statSpins) statSpins.textContent = stats.spins; if(statWins) statWins.textContent = stats.wins; if(statLosses) statLosses.textContent = stats.losses; }
renderStats();

// increment stats on spin resolution
function recordSpin(win){ stats.spins += 1; if(win) stats.wins +=1; else stats.losses +=1; saveStats(); }

// hook into spin evaluation by wrapping original evaluate result
const originalSpin = spin;
spin = async function(){
	const beforeCredits = credits;
	await originalSpin();
	const afterCredits = credits;
	recordSpin(afterCredits>beforeCredits);
};

if(resetStats) resetStats.addEventListener('click', ()=>{ stats={spins:0,wins:0,losses:0}; saveStats(); });

// Guess game
const guessBtn = document.getElementById('guessBtn');
const statsBtn = document.getElementById('statsBtn');
const themeBtn = document.getElementById('themeBtn');
const guessPanel = document.getElementById('guessPanel');
const statsPanel = document.getElementById('statsPanel');
const guessInput = document.getElementById('guessInput');
const guessPlay = document.getElementById('guessPlay');
const guessResult = document.getElementById('guessResult');

if(guessBtn) guessBtn.addEventListener('click', ()=>{ guessPanel.classList.toggle('hidden'); statsPanel.classList.add('hidden'); });
if(statsBtn) statsBtn.addEventListener('click', ()=>{ statsPanel.classList.toggle('hidden'); guessPanel.classList.add('hidden'); });

if(guessPlay){
	guessPlay.addEventListener('click', ()=>{
		const val = Number(guessInput.value);
		if(!val || val<1 || val>10){ guessResult.textContent='Enter number 1-10'; return; }
		const target = Math.floor(Math.random()*10)+1;
		if(val===target){ guessResult.textContent = `Correct! It was ${target}. You win 20 credits.`; credits += 20; updateCredits(); } else { guessResult.textContent = `Wrong. It was ${target}. Try again.`; }
	});
}

// theme toggle
const storedTheme = localStorage.getItem('demo.theme') || 'dark';
function applyTheme(t){ document.documentElement.setAttribute('data-theme', t); localStorage.setItem('demo.theme', t); }
applyTheme(storedTheme);
if(themeBtn) themeBtn.addEventListener('click', ()=>{ const t = (localStorage.getItem('demo.theme')==='dark')?'light':'dark'; applyTheme(t); });

// ------------------
// Shop / Inventory
// ------------------

const shopBtn = document.getElementById('shopBtn');
const shopPanel = document.getElementById('shopPanel');
const shopList = document.getElementById('shopList');
const inventoryEl = document.getElementById('inventory');

const shopItems = [
	{id:'boost1', name:'Double next win', price:30, desc:'Doubles payout for your next win'},
	{id:'free5', name:'Free 5 credits', price:20, desc:'Instant +5 credits'},
	{id:'autoBoost', name:'Auto spin speed', price:50, desc:'Faster auto spins (cosmetic)'}
];

let inventory = JSON.parse(localStorage.getItem('demo.inv')||'{}');

function renderShop(){
	if(!shopList) return;
	shopList.innerHTML='';
	shopItems.forEach(it=>{
		const div = document.createElement('div');
		div.className='shop-item';
		div.innerHTML = `<div><strong>${it.name}</strong><div style="font-size:12px;color:rgba(255,255,255,0.6)">${it.desc}</div></div><div><span style="margin-right:8px">${it.price}¢</span><button data-id="${it.id}">Buy</button></div>`;
		shopList.appendChild(div);
	});
}

function renderInventory(){
	if(!inventoryEl) return;
	const keys = Object.keys(inventory);
	inventoryEl.textContent = keys.length? keys.map(k=>`${k} x${inventory[k]}`).join(', ') : '(empty)';
}

function buy(id){
	const item = shopItems.find(s=>s.id===id);
	if(!item) return;
	if(credits < item.price){ messageEl.textContent='Not enough credits to buy'; return; }
	credits -= item.price; updateCredits();
	inventory[id] = (inventory[id]||0)+1;
	localStorage.setItem('demo.inv', JSON.stringify(inventory));
	renderInventory();
	messageEl.textContent = `Purchased ${item.name}`;
	if(id==='free5'){ credits +=5; updateCredits(); }
}

shopList?.addEventListener('click', (e)=>{ const id = e.target.getAttribute('data-id'); if(id) buy(id); });
renderShop(); renderInventory();

if(shopBtn) shopBtn.addEventListener('click', ()=>{ shopPanel.classList.toggle('hidden'); guessPanel.classList.add('hidden'); statsPanel.classList.add('hidden'); });

function applyInventoryOnWin(payout){
	if(inventory['boost1']>0){
		inventory['boost1'] -=1; localStorage.setItem('demo.inv', JSON.stringify(inventory)); renderInventory();
		return payout*2;
	}
	return payout;
}