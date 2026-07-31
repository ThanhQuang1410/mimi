(function(){
  "use strict";
  const canvas = document.getElementById('mimiCanvas');
  const svg = document.getElementById('mimi');
  const M = { ready:false };
  window.Mimi3D = M;

  if(!window.THREE || !window.THREE.GLTFLoader){ return; }  // CDN thất bại, giữ nguyên thỏ SVG

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const denHuong = new THREE.DirectionalLight(0xffffff, 0.8);
  denHuong.position.set(2, 4, 3);
  scene.add(denHuong);

  // Huy hiệu cổ / khoá vòng cổ dùng material KHÔNG khai báo metallicFactor, mà chuẩn glTF mặc
  // định là 1.0 = kim loại hoàn toàn. Kim loại không có màu khuếch tán, chỉ phản chiếu môi
  // trường — không có environment map thì nó phản chiếu ra màu ĐEN (đó là lý do huy hiệu bị tối).
  // Dựng một môi trường phòng đơn giản để kim loại có thứ mà phản chiếu.
  try{
    if(THREE.RoomEnvironment && THREE.PMREMGenerator){
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
    }
  }catch(e){ console.warn('Skye 3D: không dựng được environment map:', e); }

  function chinhKichThuoc(){
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', chinhKichThuoc);

  let model = null, boc = null, tru = null;
  const B = {};  // bone tra cứu theo tên ngắn, điền sau khi model load xong

  // Thỏ SVG đã hiển thị sẵn mặc định — không cần huỷ-khi-quá-giờ, model tải xong
  // lúc nào (nhanh hay chậm) thì hiện lúc đó. Chỉ thật sự ở lại thỏ SVG khi lỗi tải.
  const loader = new THREE.GLTFLoader();
  loader.load('./skye_paw_patrol_rig.glb', (gltf)=>{
    try{
      model = gltf.scene;

      // GLTFLoader gọi mesh.bind(skeleton, mesh.matrixWorld) TRƯỚC khi matrixWorld được tính,
      // nên bindMatrix bị kẹt ở ma trận đơn vị thay vì ma trận thật (armature có scale 27.92).
      // Hậu quả: Box3 đo ra 383 đơn vị nhưng shader lại vẽ ở 13.7 đơn vị (nhỏ hơn đúng 27.92 lần),
      // làm mọi phép căn camera dựa trên Box3 đều sai tỉ lệ. Bind lại bằng matrixWorld đã tính
      // đúng, ngay khi model còn chưa bị xoay/bọc — sau bước này số đo và hình vẽ mới khớp nhau.
      model.updateMatrixWorld(true);
      model.traverse(o=>{
        if(o.isSkinnedMesh && o.skeleton) o.bind(o.skeleton, o.matrixWorld);
      });

      // Ẩn cặp kính đeo trên MẶT, giữ cặp kính + mũ bay trên đầu.
      // Lưu ý: node mang tên mô tả ("Skye_Goggles_Face_...") là node RỖNG, không chứa mesh — lọc
      // theo tên đó thì ẩn nhầm node rỗng, kính vẫn hiện. Mesh thật nằm ở node "Object_NN" đứng
      // ngay sau node mô tả trong file (đã đối chiếu material để chắc chắn):
      //   Object_55 = Goggles_Face, Object_57 = Goggles_Face_Glass, Object_63 = GogglesStrap_Face
      //   (giữ lại Object_59/61/65 = Goggles_Top, Goggles_Top_Glass, GogglesStrap_Top)
      const KINH_MAT = ['Object_55','Object_57','Object_63'];
      let daAn = 0;
      model.traverse(o=>{
        if(KINH_MAT.indexOf(o.name) !== -1){ o.visible = false; daAn++; }
      });
      if(daAn !== KINH_MAT.length)
        console.warn('Skye 3D: chỉ ẩn được', daAn, '/', KINH_MAT.length, 'mesh kính đeo mặt — tên node có thể đã đổi.');

      // Nếu không dựng được environment map, kim loại sẽ đen thui — hạ metalness để còn nhìn được.
      if(!scene.environment){
        model.traverse(o=>{
          if(!o.isMesh) return;
          (Array.isArray(o.material) ? o.material : [o.material]).forEach(m=>{
            if(m && m.metalness > 0.5) m.metalness = 0.15;
          });
        });
      }

      // File này dựng theo trục Z HƯỚNG LÊN (đã đối chiếu toạ độ từng bộ phận đọc thẳng từ .glb:
      // thân z≈0–172, đầu z≈158–382) và mặt quay về -Y, trong khi Three.js mặc định Y hướng lên.
      // Không xoay thì camera đặt dọc +Z sẽ nhìn con chó từ ĐỈNH ĐẦU xuống — đó là lý do Skye
      // trông bé tí/méo. Xoay -90° quanh X: chó đứng thẳng (cao theo Y), mặt quay về +Z nhìn bé.
      model.rotation.x = -Math.PI / 2;

      // Chuẩn hoá về hộp bao cao đúng 1 đơn vị, tâm tại gốc toạ độ — sau bước này mọi con số
      // (khoảng cách camera, độ cao cú nhảy) không còn phụ thuộc đơn vị gốc kỳ lạ của file nữa.
      boc = new THREE.Group();
      boc.add(model);
      boc.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(boc);
      const co = box.getSize(new THREE.Vector3());
      const tam = box.getCenter(new THREE.Vector3());
      model.position.sub(tam);                    // dời tâm model về gốc của bọc
      boc.scale.setScalar(1 / Math.max(co.y, 1e-6));

      // Thêm một trục xoay đặt ở NGANG BÀN CHÂN (y = -0.5 sau chuẩn hoá) để lúc mừng rỡ Skye
      // chồm lên hai chân sau — xoay quanh tâm người sẽ làm mông thụt xuống đất, trông sai.
      tru = new THREE.Group();
      tru.position.y = -0.5;
      boc.position.y = 0.5;                       // bù lại để lúc đứng yên thân vẫn nằm giữa khung
      tru.add(boc);
      scene.add(tru);

      const caoChuan = 1, rongChuan = co.x / Math.max(co.y, 1e-6);
      const nua = Math.max(rongChuan, caoChuan) / 2 * 1.15;
      const khoangCach = nua / Math.tan((camera.fov * Math.PI / 180) / 2);
      camera.position.set(0, 0, khoangCach);
      camera.lookAt(0, 0, 0);
      camera.near = khoangCach * 0.01;
      camera.far = khoangCach * 10;
      camera.updateProjectionMatrix();

      canvas.style.display = 'block';
      svg.style.display = 'none';
      chinhKichThuoc();  // đo lại kích thước canvas thật + cập nhật camera.aspect SAU khi đã hiện canvas
      console.log('Skye 3D: model loaded OK. kích thước gốc=', co.toArray(), 'tâm gốc=', tam.toArray(), 'tỉ lệ=', boc.scale.x, 'rộng chuẩn=', rongChuan, 'khoangCach=', khoangCach, 'canvas=', canvas.clientWidth, canvas.clientHeight, 'aspect=', camera.aspect);
      M.ready = true;
      window.dispatchEvent(new CustomEvent('mimi3d-model-loaded', { detail:{ model, B } }));
    }catch(e){
      console.error('Skye 3D: lỗi khi dựng scene sau khi tải xong, giữ thỏ SVG:', e);
    }
  }, undefined, (err)=>{
    console.error('Skye 3D: lỗi tải file .glb, giữ thỏ SVG:', err);
  });

  M._scene = scene; M._camera = camera; M._renderer = renderer;

  const TEN_BO_XUONG = {
    'Skye_Rig:x_BN_EAR_L_1_88': 'taiT',
    'Skye_Rig:x_BN_EAR_R_1_93': 'taiP',
    'Skye_Rig:x_BN_head_174':   'dau',
    'Skye_Rig:x_BN_jaw_1_167':  'ham',
    'Skye_Rig:x_BN_tail_s_1_205': 'duoi1',
    'Skye_Rig:x_BN_tail_s_2_204': 'duoi2',
    'Skye_Rig:x_BN_tail_s_3_203': 'duoi3',
    'Skye_Rig:x_BN_tail_s_4_202': 'duoi4',
    'Skye_Rig:x_BN_tail_s_5_201': 'duoi5',
    'Skye_Rig:x_BN_tail_s_6_200': 'duoi6'
  };
  // GLTFLoader chạy tên node qua PropertyBinding.sanitizeNodeName, hàm này XOÁ dấu ':' —
  // "Skye_Rig:x_BN_jaw_1_167" trong file trở thành "Skye_Rigx_BN_jaw_1_167" trong scene. So tên
  // thô sẽ không khớp bone nào, và mọi cử động xương (mồm, tai, đuôi) im lìm. Chuẩn hoá cả hai vế.
  const chuanTen = s => String(s||'').replace(/[^A-Za-z0-9_]/g, '');
  const TRA_XUONG = {};
  Object.keys(TEN_BO_XUONG).forEach(k=>{ TRA_XUONG[chuanTen(k)] = TEN_BO_XUONG[k]; });
  function timBoXuong(root){
    root.traverse(o=>{
      const ten = TRA_XUONG[chuanTen(o.name)];
      if(ten){ B[ten] = o; o.userData.goc = o.rotation.clone(); }
    });
    const thieu = Object.values(TEN_BO_XUONG).filter(v=>!B[v]);
    if(thieu.length) console.warn('Skye 3D: không tìm thấy xương:', thieu.join(', '));
    else console.log('Skye 3D: đã tìm đủ', Object.keys(B).length, 'xương để cử động.');
  }

  let trangThaiHienTai = 'ngu', hamMo = false, nhayT0 = null, hamHienTai = 0, lacTre = 0;
  M.setTrangThai = function(t){ trangThaiHienTai = t; };
  M.moMieng = function(){ hamMo = true; };
  M.khepMieng = function(){ hamMo = false; };
  M.nhay = function(){ nhayT0 = performance.now(); };

  function batDauVongLap(){
    const dongHo = new THREE.Clock();
    (function ve(){
      requestAnimationFrame(ve);
      const t = dongHo.getElapsedTime();
      if(!model) return;

      const dangMung = nhayT0 !== null;
      const dangNghe = trangThaiHienTai === 'nghe';

      // đuôi: ngoáy nền liên tục, mừng thì ngoáy tít
      const DUOI = ['duoi1','duoi2','duoi3','duoi4','duoi5','duoi6'];
      const bienDoDuoi = dangMung ? 0.55 : (trangThaiHienTai === 'noi' ? 0.35 : 0.22);
      const tocDuoi = dangMung ? 11 : 5;
      DUOI.forEach((k,i)=>{
        const o = B[k]; if(!o) return;
        o.rotation.y = o.userData.goc.y + Math.sin(t*tocDuoi - i*0.6) * bienDoDuoi;
      });

      // Đầu lắc lư: nghiêng nhẹ sang hai bên (trục Z) kèm gật rất nhẹ (trục X) ở nhịp lệch nhau
      // cho tự nhiên. Lắc rõ hơn khi đang nghe và khi mừng, vẫn đung đưa nhè nhẹ lúc bình thường.
      const bienLac = dangMung ? 0.22 : (dangNghe ? 0.18 : 0.07);
      const tocLac  = dangMung ? 5 : 2;
      const gocLac  = Math.sin(t*tocLac) * bienLac;
      if(B.dau){
        B.dau.rotation.z = B.dau.userData.goc.z + gocLac;
        B.dau.rotation.x = B.dau.userData.goc.x + Math.sin(t*tocLac*0.65 + 1.1) * bienLac * 0.45;
      }

      // Tai vốn là xương CON của xương đầu nên đã đi theo đầu sẵn. Không tự vẫy nữa — chỉ thêm
      // độ trễ so với góc lắc của đầu để tai đung đưa theo quán tính như tai thật.
      lacTre += (gocLac - lacTre) * 0.12;
      const treTai = (gocLac - lacTre) * 1.6;
      if(B.taiT) B.taiT.rotation.z = B.taiT.userData.goc.z + treTai;
      if(B.taiP) B.taiP.rotation.z = B.taiP.userData.goc.z + treTai;

      // Mồm: xoay quanh bản lề hàm, chỉ hé rất nhẹ (~0..3°) cho giống mấp máy khi nói.
      const dichHam = hamMo ? (0.5 + 0.5 * Math.sin(t * 13)) * 0.055 : 0;
      hamHienTai += (dichHam - hamHienTai) * 0.35;   // làm mượt lúc bắt đầu/kết thúc nói
      if(B.ham) B.ham.rotation.x = B.ham.userData.goc.x + hamHienTai;

      // Mừng rỡ: chồm lên hai chân sau (nhấc bổng hai chân trước) rồi hạ xuống, kèm rung nhẹ —
      // giống chó thật vồ lấy chủ, thay vì cả khối trượt lên trượt xuống cứng đơ.
      if(dangMung && tru){
        const dt = (performance.now() - nhayT0) / 1000;
        const TONG = 1.6;
        if(dt > TONG){ nhayT0 = null; tru.rotation.x = 0; tru.position.y = -0.5; }
        else{
          const bao = Math.sin(Math.PI * Math.min(1, dt/TONG * 1.15));  // lên nhanh, hạ mềm
          const nhun = 1 + 0.12 * Math.sin(dt * 15);                    // rung nhẹ lúc đang chồm
          tru.rotation.x = -0.55 * bao * nhun;   // âm = phần trước hếch lên (mặt quay về +Z)
          tru.position.y = -0.5 + 0.06 * bao;    // nhấc nhẹ khỏi mặt đất cho có đà
        }
      }

      renderer.render(scene, camera);
    })();
  }

  window.addEventListener('mimi3d-model-loaded', (e)=>{
    timBoXuong(e.detail.model);
    batDauVongLap();
  });
})();
