const cam = document.getElementById('cam');
const camWrap = document.getElementById('camWrap');
const toggleBtn = document.getElementById('toggleBtn');
const statText = document.getElementById('statText');
const recBtn = document.getElementById('recBtn');
const intervalInput = document.getElementById('interval');

let stream = null;
let isRec = false;
let timer = null;
let frames = [];

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

async function initCam() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    cam.srcObject = stream;
  } catch (err) {
    statText.textContent = 'Camera access denied';
  }
}

function snapFrame() {
  if (!cam.videoWidth) return;
  canvas.width = cam.videoWidth;
  canvas.height = cam.videoHeight;
  ctx.drawImage(cam, 0, 0);
  frames.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  statText.textContent = `Captured ${frames.length} frames`;
}

toggleBtn.addEventListener('click', () => {
  const isHidden = camWrap.classList.toggle('hidden');
  toggleBtn.textContent = isHidden ? 'Show Preview' : 'Hide Preview';
  toggleBtn.classList.toggle('active', isHidden);
});

recBtn.addEventListener('click', () => {
  if (isRec) {
    clearInterval(timer);
    isRec = false;
    recBtn.textContent = 'Start';
    recBtn.classList.remove('active');
    statText.textContent = `Stopped. Total frames: ${frames.length}`;
  } else {
    frames = [];
    isRec = true;
    recBtn.textContent = 'Stop';
    recBtn.classList.add('active');
    
    const sec = parseFloat(intervalInput.value) || 2;
    snapFrame();
    timer = setInterval(snapFrame, sec * 1000);
  }
});

initCam();
