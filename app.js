const cam = document.getElementById('cam');
const camWrap = document.getElementById('camWrap');
const toggleBtn = document.getElementById('toggleBtn');
const statText = document.getElementById('statText');

let stream = null;

async function initCam() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    cam.srcObject = stream;
  } catch (err) {
    statText.textContent = 'Camera access denied';
  }
}

toggleBtn.addEventListener('click', () => {
  const isHidden = camWrap.classList.toggle('hidden');
  toggleBtn.textContent = isHidden ? 'Show Preview' : 'Hide Preview';
  toggleBtn.classList.toggle('active', isHidden);
});

initCam();

