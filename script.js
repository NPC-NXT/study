// ----- BIẾN DOM -----
const totalHoursEl = document.getElementById('totalHours');
const modeRadios = document.getElementsByName('mode');
const bySessionsBox = document.getElementById('bySessionsBox');
const byLengthBox = document.getElementById('byLengthBox');
const numSessionsEl = document.getElementById('numSessions');
const sessionLengthEl = document.getElementById('sessionLength');
const breakLengthEl = document.getElementById('breakLength');
const createBtn = document.getElementById('createBtn');
const planOutput = document.getElementById('planOutput');
const copyBtn = document.getElementById('copyBtn');
const r1 = document.getElementById('r1'), r2 = document.getElementById('r2'), r3 = document.getElementById('r3');

// ----- CHUYỂN ĐỔI GIỮA HAI CHẾ ĐỘ -----
modeRadios.forEach(r=>{
  r.addEventListener('change', ()=> {
    if(r.value === 'bySessions' && r.checked){
      bySessionsBox.classList.remove('hidden');
      byLengthBox.classList.add('hidden');
    } else if (r.value === 'byLength' && r.checked){
      bySessionsBox.classList.add('hidden');
      byLengthBox.classList.remove('hidden');
    }
  });
});

// ----- HÀM CHUYỂN PHÚT → CHUỖI -----
function toTime(min){
  const h = Math.floor(min/60);
  const m = Math.round(min%60);
  if(h>0) return `${h} giờ ${m} phút`;
  return `${m} phút`;
}

// ----- TẠO KẾ HOẠCH -----
function generatePlan(){
  const totalHours = parseFloat(totalHoursEl.value) || 0;
  if(totalHours <= 0){
    planOutput.innerText = "⚠ Vui lòng nhập tổng thời gian hợp lệ.";
    return;
  }

  const totalMinutes = Math.round(totalHours * 60);
  const breakMin = Math.max(0, parseInt(breakLengthEl.value)||0);

  let sessions = [];
  const mode = Array.from(modeRadios).find(r=>r.checked).value;

  // ===== CHẾ ĐỘ 1: CHIA THEO SỐ PHIÊN =====
  if(mode === "bySessions"){
    let num = Math.max(1, parseInt(numSessionsEl.value)||1);
    const totalBreak = Math.max(0, num-1) * breakMin;
    let workTotal = totalMinutes - totalBreak;

    if(workTotal <= 0){
      planOutput.innerText = "⚠ Thời gian không đủ để chia theo số phiên.";
      return;
    }

    let per = Math.floor(workTotal / num);
    let remainder = workTotal - per * num;

    for(let i=1;i<=num;i++){
      let w = per + (remainder>0?1:0);
      if(remainder>0) remainder--;
      sessions.push({index:i, workMinutes:w, breakAfter:(i<num?breakMin:0)});
    }
  }

  // ===== CHẾ ĐỘ 2: CHIA THEO ĐỘ DÀI MỖI PHIÊN =====
  else {
    const len = Math.max(1, parseInt(sessionLengthEl.value)||1);
    let num = Math.floor((totalMinutes + breakMin) / (len + breakMin));

    if(num < 1){
      planOutput.innerText = "⚠ Không đủ thời gian cho độ dài phiên bạn chọn.";
      return;
    }

    let used = num * len + (num-1)*breakMin;

    while(used > totalMinutes){
      num--;
      if(num===0){
        planOutput.innerText = "⚠ Không đủ thời gian cho độ dài phiên.";
        return;
      }
      used = num * len + (num-1)*breakMin;
    }

    for(let i=1;i<=num;i++){
      sessions.push({index:i, workMinutes:len, breakAfter:(i<num?breakMin:0)});
    }

    let leftover = totalMinutes - used;
    let idx=0;
    while(leftover>0){
      sessions[idx%num].workMinutes++;
      leftover--;
      idx++;
    }
  }

  // ===== TÍNH PHÂN CHIA NỘI DUNG =====
  const ratioSum = (parseInt(r1.value)||0)+(parseInt(r2.value)||0)+(parseInt(r3.value)||0);
  const useRatios = ratioSum>0;

  let out = [];
  out.push(`⏳ Tổng thời gian: ${totalMinutes} phút (${totalHours} giờ)\n`);

  sessions.forEach(s=>{
    out.push(`📘 Phiên ${s.index}: Học ${toTime(s.workMinutes)}${s.breakAfter?` — Nghỉ ${s.breakAfter} phút`:''}`);

    if(useRatios){
      const w = s.workMinutes;
      const a = Math.round(w*(parseInt(r1.value)||0)/ratioSum);
      const b = Math.round(w*(parseInt(r2.value)||0)/ratioSum);
      const c = w - a - b;

      out.push(`  • Lý thuyết: ${a} phút`);
      out.push(`  • Thực hành: ${b} phút`);
      out.push(`  • Ôn tập: ${c} phút`);
    }
    out.push('');
  });

  const totalWork = sessions.reduce((s,x)=>s+x.workMinutes,0);
  const totalBreak = sessions.reduce((s,x)=>s+x.breakAfter,0);

  out.push(`📌 Tổng thời gian học: ${toTime(totalWork)}`);
  out.push(`📌 Tổng thời gian nghỉ: ${toTime(totalBreak)}`);
  out.push(`📌 Thời gian thực tế sử dụng: ${toTime(totalWork+totalBreak)}`);

  planOutput.innerText = out.join("\n");
}

// ----- NÚT TẠO KẾ HOẠCH -----
createBtn.addEventListener('click', generatePlan);

// ----- COPY KẾ HOẠCH -----
copyBtn.addEventListener('click', ()=>{
  navigator.clipboard.writeText(planOutput.innerText)
    .then(()=>alert("Đã sao chép kế hoạch!"))
    .catch(()=>alert("Không thể sao chép."));
});
// --- Đăng ký Service Worker để hỗ trợ PWA (offline / cài đặt) ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('ServiceWorker đã đăng ký:', reg.scope))
      .catch(err => console.log('ServiceWorker đăng ký lỗi:', err));
  });
}
