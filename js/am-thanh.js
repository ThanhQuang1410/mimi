"use strict";
/* ============================================================
   5. ÂM NHẠC
   ============================================================ */
let ctx = null;
function amThanh(){ if(!ctx) ctx = new (window.AudioContext||window.webkitAudioContext)(); return ctx; }

/* Giữ màn hình sáng trong lúc chơi: màn hình tự tắt giữa chừng là nguyên nhân chính khiến
   AudioContext bị hệ điều hành treo/ngắt, gây mất tiếng hoặc phát bị khựng. */
let khoaManHinh = null;
async function xinKhoaManHinh(){
  if(!("wakeLock" in navigator) || !dangChay) return;
  try{
    khoaManHinh = await navigator.wakeLock.request("screen");
    khoaManHinh.addEventListener("release", ()=>{ khoaManHinh = null; });
  }catch(e){ console.warn("Không khoá được màn hình:", e); }
}
function nhaKhoaManHinh(){ if(khoaManHinh){ try{ khoaManHinh.release(); }catch(e){} khoaManHinh=null; } }
