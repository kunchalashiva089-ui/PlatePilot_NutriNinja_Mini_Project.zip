const recipes = [
  {id:"oats",name:"Banana peanut oats",type:"Breakfast",emoji:"🥣",diet:["vegetarian","vegan"],cost:25,kcal:380,p:14,c:55,f:11,ingredients:["Oats","Banana","Peanuts"],swap:["poha","eggbhurji"]},
  {id:"poha",name:"Vegetable poha",type:"Breakfast",emoji:"🍲",diet:["vegetarian","vegan"],cost:22,kcal:330,p:8,c:58,f:7,ingredients:["Poha","Onion","Peas"],swap:["oats","eggbhurji"]},
  {id:"eggbhurji",name:"Egg bhurji with roti",type:"Breakfast",emoji:"🍳",diet:["nonveg"],cost:35,kcal:410,p:22,c:42,f:15,ingredients:["Eggs","Wheat flour","Onion"],swap:["oats","poha"]},
  {id:"dalrice",name:"Dal, rice & seasonal veg",type:"Lunch",emoji:"🍛",diet:["vegetarian","vegan"],cost:38,kcal:560,p:20,c:88,f:10,ingredients:["Toor dal","Rice","Seasonal vegetables"],swap:["soyacurry","chickencurry"]},
  {id:"soyacurry",name:"Soya chunks curry & rice",type:"Lunch",emoji:"🥘",diet:["vegetarian","vegan"],cost:40,kcal:590,p:34,c:82,f:11,ingredients:["Soya chunks","Rice","Tomato"],swap:["dalrice","chickencurry"]},
  {id:"chickencurry",name:"Chicken curry & rice",type:"Lunch",emoji:"🍗",diet:["nonveg"],cost:48,kcal:620,p:38,c:78,f:15,ingredients:["Chicken","Rice","Tomato"],swap:["dalrice","soyacurry"]},
  {id:"chana",name:"Roasted chana & banana",type:"Snack",emoji:"🍌",diet:["vegetarian","vegan"],cost:15,kcal:230,p:9,c:38,f:4,ingredients:["Roasted chana","Banana"],swap:["curd","sprouts"]},
  {id:"curd",name:"Curd & seasonal fruit",type:"Snack",emoji:"🥛",diet:["vegetarian"],cost:18,kcal:190,p:8,c:28,f:5,ingredients:["Curd","Seasonal fruit"],swap:["chana","sprouts"]},
  {id:"sprouts",name:"Moong sprouts chaat",type:"Snack",emoji:"🥗",diet:["vegetarian","vegan"],cost:16,kcal:180,p:12,c:27,f:3,ingredients:["Moong sprouts","Onion","Lemon"],swap:["chana","curd"]},
  {id:"khichdi",name:"Dal khichdi",type:"Dinner",emoji:"🍚",diet:["vegetarian","vegan"],cost:30,kcal:430,p:16,c:72,f:8,ingredients:["Rice","Moong dal","Vegetables"],swap:["paneer","eggmeal"]},
  {id:"paneer",name:"Paneer bhurji & roti",type:"Dinner",emoji:"🧀",diet:["vegetarian"],cost:42,kcal:470,p:25,c:45,f:18,ingredients:["Paneer","Wheat flour","Tomato"],swap:["khichdi","eggmeal"]},
  {id:"eggmeal",name:"Egg curry & roti",type:"Dinner",emoji:"🍽️",diet:["nonveg"],cost:38,kcal:450,p:24,c:48,f:16,ingredients:["Eggs","Wheat flour","Onion"],swap:["khichdi","paneer"]}
];

const slots = ["Breakfast","Lunch","Snack","Dinner"];
let currentPlan = [];
let chart;

function choosePlan(diet,budget,goal){
  const pool = slots.map(slot => recipes.filter(r => r.type===slot && r.diet.includes(diet)));
  let selected = pool.map(items => items.slice().sort((a,b)=>{
    const score = r => (goal==="muscle" ? r.p*2+r.kcal/100 : goal==="weight" ? r.p*1.6-r.kcal/100 : r.p+r.kcal/180);
    return score(b)-score(a);
  })[0]);
  // If the highest-scoring choices exceed the budget, choose cheaper compatible meals.
  while(selected.reduce((s,r)=>s+r.cost,0)>budget){
    let candidates = selected.map((r,i)=>({i, alternatives:pool[i].filter(x=>x.cost<r.cost).sort((a,b)=>a.cost-b.cost)}))
      .filter(x=>x.alternatives.length);
    if(!candidates.length) break;
    candidates.sort((a,b)=>(selected[b.i].cost-b.alternatives[0].cost)-(selected[a.i].cost-a.alternatives[0].cost));
    const c=candidates[0]; selected[c.i]=c.alternatives[0];
  }
  return selected;
}

function render(){
  const budget=Number(document.getElementById("budget").value);
  const total=currentPlan.reduce((s,r)=>s+r.cost,0);
  const kcal=currentPlan.reduce((s,r)=>s+r.kcal,0);
  const p=currentPlan.reduce((s,r)=>s+r.p,0);
  const c=currentPlan.reduce((s,r)=>s+r.c,0);
  const f=currentPlan.reduce((s,r)=>s+r.f,0);
  document.getElementById("totalCost").textContent=`₹${total}`;
  document.getElementById("totalCalories").innerHTML=`${kcal} <small>kcal</small>`;
  document.getElementById("totalProtein").innerHTML=`${p} <small>g</small>`;
  document.getElementById("budgetBar").style.width=`${Math.min(100,total/budget*100)}%`;
  document.getElementById("budgetMessage").textContent=total<=budget?`₹${budget-total} remaining from your ₹${budget} budget`:`₹${total-budget} over budget — increase your limit`;
  document.getElementById("budgetBar").style.background=total<=budget?"#24734f":"#d66b4e";
  document.getElementById("mealList").innerHTML=currentPlan.map((r,i)=>`
    <article class="meal-card">
      <div class="meal-emoji">${r.emoji}</div>
      <div><div class="meal-type">${r.type.toUpperCase()}</div><div class="meal-name">${r.name}</div><div class="meal-detail">${r.kcal} kcal · ${r.p}g protein · ${r.ingredients.join(", ")}</div></div>
      <div class="meal-right"><div class="meal-cost">₹${r.cost}</div><button class="swap-btn" data-index="${i}">↻ Swap</button></div>
    </article>`).join("");
  document.querySelectorAll(".swap-btn").forEach(btn=>btn.addEventListener("click",()=>swapMeal(Number(btn.dataset.index))));
  document.getElementById("proteinLegend").textContent=`${p}g`;
  document.getElementById("carbsLegend").textContent=`${c}g`;
  document.getElementById("fatsLegend").textContent=`${f}g`;
  if(chart) chart.destroy();
  chart=new Chart(document.getElementById("macroChart"),{type:"doughnut",data:{labels:["Protein","Carbs","Fats"],datasets:[{data:[p,c,f],backgroundColor:["#24734f","#b5d779","#f2a45d"],borderWidth:0,hoverOffset:5}]},options:{responsive:true,maintainAspectRatio:false,cutout:"70%",plugins:{legend:{display:false}}}});
  renderGroceries();
}

function swapMeal(index){
  const old=currentPlan[index],budget=Number(document.getElementById("budget").value);
  const diet=document.getElementById("diet").value;
  const currentCost=currentPlan.reduce((s,r)=>s+r.cost,0);
  const choices=old.swap.map(id=>recipes.find(r=>r.id===id)).filter(r=>r && r.diet.includes(diet) && currentCost-old.cost+r.cost<=budget);
  if(!choices.length){alert("No suitable swap fits your current budget. Try increasing your daily budget.");return;}
  currentPlan[index]=choices[0];
  render();
}

function renderGroceries(){
  const counts={};
  currentPlan.forEach(r=>r.ingredients.forEach(item=>counts[item]=(counts[item]||0)+1));
  document.getElementById("groceryList").innerHTML=Object.entries(counts).map(([name,count])=>`<div class="grocery-item"><span>${name}</span><b>${count} ${count===1?"pack":"packs"}</b></div>`).join("");
}

document.getElementById("profileForm").addEventListener("submit",e=>{
  e.preventDefault();
  const budget=Number(document.getElementById("budget").value);
  if(budget<50){alert("Please enter a budget of at least ₹50.");return;}
  currentPlan=choosePlan(document.getElementById("diet").value,budget,document.getElementById("goal").value);
  document.getElementById("results").classList.remove("hidden");
  document.getElementById("saveBtn").classList.remove("saved");
  document.getElementById("saveBtn").textContent="♡ Save plan";
  render();
  document.getElementById("results").scrollIntoView({behavior:"smooth"});
});

document.getElementById("saveBtn").addEventListener("click",()=>{
  localStorage.setItem("platePilotPlan",JSON.stringify({date:new Date().toISOString(),budget:document.getElementById("budget").value,plan:currentPlan}));
  document.getElementById("saveBtn").classList.add("saved");
  document.getElementById("saveBtn").textContent="✓ Plan saved";
});

// Restore the last saved plan when the page is reopened.
const saved=localStorage.getItem("platePilotPlan");
if(saved){
  try{
    const data=JSON.parse(saved);
    document.getElementById("budget").value=data.budget;
    currentPlan=data.plan;
    document.getElementById("results").classList.remove("hidden");
    document.getElementById("saveBtn").classList.add("saved");
    document.getElementById("saveBtn").textContent="✓ Plan saved";
    render();
  }catch(error){localStorage.removeItem("platePilotPlan");}
}
