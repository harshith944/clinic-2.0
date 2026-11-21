import * as THREE from 'three';

export function createLimestoneTileTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#F6F7FB';
    ctx.fillRect(0, 0, 512, 512);

    const tileSize = 128;
    for (let x = 0; x < 512; x += tileSize) {
      for (let y = 0; y < 512; y += tileSize) {
        const isEven = ((x + y) / tileSize) % 2 === 0;
        ctx.fillStyle = isEven ? '#FBFBFD' : '#EEF3FA';
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
      }
    }

    ctx.strokeStyle = '#D7E0EE';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 512; i += tileSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 3);
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export function createOakWoodTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#D4A373';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 64; i++) {
      const y = i * 4;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(145, 92, 46, 0.14)' : 'rgba(248, 219, 185, 0.14)';
      ctx.fillRect(0, y, 256, 2);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.42)');
    grad.addColorStop(0.6, 'rgba(15, 23, 42, 0.14)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createMonitorScreenTexture(
  mode: 'vitals' | 'schedule' | 'ultrasound',
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, 512, 320);

    // Top bar
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 0, 512, 42);

    ctx.fillStyle = '#5EEAD4';
    ctx.font = 'bold 18px sans-serif';
    const title =
      mode === 'vitals'
        ? 'PATIENT VITALS · BARNABY'
        : mode === 'ultrasound'
          ? 'DOPPLER IMAGING · LIVE'
          : 'AJITH CLINIC · CHECK-IN';
    ctx.fillText(title, 20, 27);

    if (mode === 'vitals') {
      // ECG waveform
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(24, 150);
      for (let x = 24; x < 488; x += 58) {
        ctx.lineTo(x + 14, 150);
        ctx.lineTo(x + 22, 118);
        ctx.lineTo(x + 28, 185);
        ctx.lineTo(x + 36, 95);
        ctx.lineTo(x + 44, 150);
      }
      ctx.stroke();

      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 28px monospace';
      ctx.fillText('HR 92 BPM', 24, 260);
      ctx.fillStyle = '#38BDF8';
      ctx.fillText('TEMP 101.2 F', 260, 260);
    } else if (mode === 'ultrasound') {
      // Fan scan sector
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.moveTo(256, 70);
      ctx.arc(256, 70, 200, Math.PI * 0.25, Math.PI * 0.75);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#2DD4BF';
      ctx.lineWidth = 2;
      for (let r = 55; r <= 185; r += 40) {
        ctx.beginPath();
        ctx.arc(256, 70, r, Math.PI * 0.28, Math.PI * 0.72);
        ctx.stroke();
      }

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '16px monospace';
      ctx.fillText('DEPTH 12cm   GAIN 64dB', 148, 294);
    } else {
      const rows = [
        { id: '#Apt0001', pet: 'Barnaby · Checkup', color: '#3B82F6' },
        { id: '#Apt0007', pet: 'Mochi · Video Consult', color: '#F59E0B' },
        { id: '#Apt0009', pet: 'Oliver · Vaccine', color: '#10B981' },
      ];
      rows.forEach((row, idx) => {
        const y = 70 + idx * 72;
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(24, y, 464, 56);
        ctx.fillStyle = row.color;
        ctx.fillRect(24, y, 8, 56);
        ctx.fillStyle = '#F8FAFC';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(`${row.id}   ${row.pet}`, 48, y + 35);
      });
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createClinicSignTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const bgGrad = ctx.createLinearGradient(0, 0, 512, 128);
    bgGrad.addColorStop(0, '#1D4ED8');
    bgGrad.addColorStop(0.55, '#1E40AF');
    bgGrad.addColorStop(1, '#0F766E');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 512, 128);

    // Subtle top warm amber highlight bar
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(0, 0, 512, 7);

    // Rounded emblem mark matching Ajith Clinic SVG logo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.beginPath();
    ctx.roundRect(26, 26, 76, 76, 18);
    ctx.fill();

    // Medical Cross
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(42, 56, 44, 16);
    ctx.fillRect(56, 42, 16, 44);

    // Warm Amber Center Care Dot
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(64, 64, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText('AJITH CLINIC', 120, 74);

    ctx.fillStyle = '#BAE6FD';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('VETERINARY CARE · DR. ELENA VANCE', 122, 100);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export function createWallArtTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#FFF7ED';
    ctx.fillRect(0, 0, 256, 256);

    // Botanical teal & coral shapes
    ctx.fillStyle = '#99F6E4';
    ctx.beginPath();
    ctx.arc(178, 86, 56, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FDBA74';
    ctx.beginPath();
    ctx.arc(82, 168, 48, 0, Math.PI * 2);
    ctx.fill();

    // Stylized Pet Paw Accent
    ctx.fillStyle = '#0F766E';
    ctx.beginPath();
    ctx.ellipse(128, 144, 30, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    [
      [94, 104],
      [116, 88],
      [142, 88],
      [162, 104],
    ].forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 11, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}
