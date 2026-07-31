"use strict";
/* ============================================================
   0. LƯU TRỮ
   ============================================================ */
const KHO = (()=>{
  let ok = true, tam = {};
  try{ localStorage.setItem("_t","1"); localStorage.removeItem("_t"); }catch(e){ ok = false; }
  return { ok,
    doc(k,md){ try{ const v = ok ? localStorage.getItem(k) : tam[k]; return v==null?md:JSON.parse(v); }catch(e){ return md; } },
    ghi(k,v){ const s = JSON.stringify(v); try{ ok ? localStorage.setItem(k,s) : (tam[k]=s); }catch(e){} } };
})();

