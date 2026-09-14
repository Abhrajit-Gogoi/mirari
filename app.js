const cam = document.getElementById('cam');
const camWrap = document.getElementById('camWrap');
const toggleBtn = document.getElementById('toggleBtn');
const statText = document.getElementById('statText');
const recBtn = document.getElementById('recBtn');
const intervalInput = document.getElementById('interval');
const fpsInput = document.getElementById('fps');
const list = document.getElementById('list');

let stream = null;
let isRec = false;
let timer = null;
let frames = [];

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

function openDb() {
  return new Promise((res, rej) => {
    const req = indexedDB.open('timelapse_db', 1);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore('videos', { autoIncrement: true });
    };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function saveVideo(blob) {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction('videos', 'readwrite');
    const store = tx.objectStore('videos');
    const item = { blob, date: new Date().toLocaleString() };
    const req = store.add(item);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function getVideos() {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction('videos', 'readonly');
    const store = tx.objectStore('videos');
    const req = store.getAll();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function renderGallery() {
  list.innerHTML = '';
  const items = await getVideos();
  items.reverse().forEach(item => {
    const card = document.createElement('div');
    card.className = 'item';

    const vid = document.createElement('video');
    vid.src = URL.createObjectURL(item.blob);
    vid.controls = true;

    const info = document.createElement('span');
    info.className = 'stat';
    info.textContent = item.date;

    card.appendChild(vid);
    card.appendChild(info);
    list.appendChild(card);
  });
}

async function initCam() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    cam.srcObject = stream;
  } catch (err) {
    statText.textContent = 'Camera access denied';
  }
}

async function snapFrame() {
  if (!cam.videoWidth) return;
  const bmp = await createImageBitmap(cam);
  frames.push(bmp);
  statText.textContent = `Captured ${frames.length} frames`;
}

async function compileVideo() {
  if (!frames.length) return;
  statText.textContent = 'Compiling...';

  canvas.width = cam.videoWidth;
  canvas.height = cam.videoHeight;

  const fps = parseInt(fpsInput.value) || 30;
  const outStream = canvas.captureStream(0);
  const track = outStream.getVideoTracks()[0];
  const rec = new MediaRecorder(outStream);
  const chunks = [];

  rec.ondataavailable = e => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const compiled = new Promise(res => {
    rec.onstop = () => res(new Blob(chunks, { type: 'video/webm' }));
  });

  rec.start();
  const delay = 1000 / fps;

  for (const f of frames) {
    ctx.drawImage(f, 0, 0);
    if (track && track.requestFrame) {
      track.requestFrame();
    }
    await new Promise(r => setTimeout(r, delay));
    f.close();
  }

  rec.stop();
  const blob = await compiled;
  await saveVideo(blob);
  await renderGallery();
  statText.textContent = 'Saved to local storage';
  frames = [];
}

toggleBtn.addEventListener('click', () => {
  const isHidden = camWrap.classList.toggle('hidden');
  toggleBtn.textContent = isHidden ? 'Show Preview' : 'Hide Preview';
  toggleBtn.classList.toggle('active', isHidden);
});

recBtn.addEventListener('click', async () => {
  if (isRec) {
    clearInterval(timer);
    isRec = false;
    recBtn.textContent = 'Start';
    recBtn.classList.remove('active');
    await compileVideo();
  } else {
    frames = [];
    isRec = true;
    recBtn.textContent = 'Stop';
    recBtn.classList.add('active');

    const sec = parseFloat(intervalInput.value) || 2;
    await snapFrame();
    timer = setInterval(snapFrame, sec * 1000);
  }
});

initCam();
renderGallery();