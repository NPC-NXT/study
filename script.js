// Basic Study Splitter
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

// Mode toggle
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

function minutesToHMS(min){
  const h = Math.floor(min/60);
  const m = Math.round(min%60);
  if(h>0) return `${h}h ${m}m`;
  return `${m}m`;
}

function generatePlan(){
  const totalHours = parseFloat(totalHoursEl.value) || 0;
  if(totalHours <= 0){ planOutput.innerText = 'Nhập tổng thời gian > 0'; return; }
  const totalMinutes = Math.round(totalHours * 60);
  const breakMin = Math.max(0, parseInt(breakLengthEl.value) || 0);

  let sessions = [];
  const mode = Array.from(modeRadios).find(r=>r.checked).value;
  if(mode === 'bySessions'){
    let num = Math.max(1, parseInt(numSessionsEl.value) || 1);
    // compute working minutes available after breaks: totalMinutes = workMinutes + (num-1)*breakMin
    const totalBreak = Math.max(0, num-1) * breakMin;
    let workTotal = totalMinutes - totalBreak;
    if(workTotal <= 0){
      planOutput.innerText = 'Thời gian không đủ cho số phiên và nghỉ đã chọn.';
      return;
    }
    let per = Math.floor(workTotal / num);
    let remainder = workTotal - per * num;
    for(let i=1;i<=num;i++){
      let w = per + (remainder>0?1:0);
      if(remainder>0) remainder--;
      sessions.push({index:i, workMinutes:w, breakAfter: (i<num?breakMin:0)});
    }
  } else {
    // byLength
    const len = Math.max(1, parseInt(sessionLengthEl.value) || 1);
    let num = Math.floor((totalMinutes + breakMin) / (len + breakMin)); // approximate
    if(num < 1) { planOutput.innerText='Không đủ thời gian cho phiên đã chọn.'; return; }
    let used = num * len + (num-1)*breakMin;
    // adjust if used > total
    while(used > totalMinutes){
      num--;
      if(num===0) { planOutput.innerText='Không đủ thời gian cho phiên đã chọn.'; return; }
      used = num * len + (num-1)*breakMin;
    }
    for(let i=1;i<=num;i++){
      sessions.push({index:i, workMinutes:len, breakAfter:(i<num?breakMin:0)});
    }
    // if leftover minutes remain, distribute to first sessions
    let leftover = totalMinutes - used;
    let idx=0;
    while(leftover>0){
      sessions[idx%num].workMinutes++;
      leftover--;
      idx++;
    }
  }

  // compute content split per session if ratios provided
  const ratioSum = (parseInt(r1.value)||0)+(parseInt(r2.value)||0)+(parseInt(r3.value)||0);
  const useRatios = ratioSum>0;
  let out = [];
  out.push(`Tổng: ${totalMinutes} phút (${totalHours} giờ)\n`);
  sessions.forEach(s=>{
    out.push(`Phiên ${s.index}: Làm ${minutesToHMS(s.workMinutes)}${s.breakAfter?` — Nghỉ ${s.breakAfter}m` : ''}`);
    if(useRatios){
      const w = s.workMinutes;
      const a = Math.round(w * (parseInt(r1.value)||0) / ratioSum);
      const b = Math.round(w * (parseInt(r2.value)||0) / ratioSum);
      const c = w - a - b;
      out.push(`  • Lý thuyết: ${a}m  • Thực hành: ${b}m  • Ôn tóm tắt: ${c}m`);
    }
    out.push('');
  });

  // summary
  const totalWork = sessions.reduce((s,x)=>s+x.workMinutes,0);
  const totalBreak = sessions.reduce((s,x)=>s+x.breakAfter,0);
  out.push(`Tổng thời gian làm: ${minutesToHMS(totalWork)}`);
  out.push(`Tổng thời gian nghỉ: ${minutesToHMS(totalBreak)}`);
  out.push(`Thời gian thật sự dùng: ${minutesToHMS(totalWork + totalBreak)}`);

  planOutput.innerText = out.join('\n');
}

createBtn.addEventListener('click', generatePlan);

copyBtn.addEventListener('click', ()=>{
  const text = planOutput.innerText;
  if(!text) return;
  navigator.clipboard.writeText(text).then(()=>{ alert('Đã copy kế hoạch!'); }).catch(()=>{ alert('Copy không thành công'); });
});
