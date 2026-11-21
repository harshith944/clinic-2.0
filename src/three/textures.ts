import * as THREE from 'three';

export function createLimestoneTileTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#F3F5F8';
    ctx.fillRect(0, 0, 512, 512);

    const tileSize = 128;
    for (let x = 0; x < 512; x += tileSize) {
      for (let y = 0; y < 512; y += tileSize) {
        const shade = ((x + y) / tileSize) % 2 === 0 ? '#F7F9FC' : '#EEF2F7';
        ctx.fillStyle = shade;
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
      }
    }

    ctx.strokeStyle = '#DCE3EE';
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
    ctx.fillStyle = '#C89E72';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 64; i++) {
      const y = i * 4;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(145, 98, 55, 0.12)' : 'rgba(235, 200, 160, 0.1)';
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

export function createMonitorScreenTexture(mode: 'vitals' | 'schedule' | 'ultrasound'): THREE.CanvasTexture {
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

    ctx.fillStyle = '#93C5FD';
    ctx.font = 'bold 18px sans-serif';
    const title =
      mode === 'vitals'
        ? 'PATIENT VITALS · BARNABY'
        : mode === 'ultrasound'
          ? 'DOPPLER IMAGING · LIVE'
          : 'CITYVET CHECK-IN QUEUE';
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
      ctx.fillStyle = '#60A5FA';
      ctx.fillText('TEMP 101.2 F', 260, 260);
    } else if (mode === 'ultrasound') {
      // Fan scan sector
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.moveTo(256, 70);
      ctx.arc(256, 70, 200, Math.PI * 0.25, Math.PI * 0.75);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#60A5FA';
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

export function createClinicSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#1E3A8A';
    ctx.fillRect(0, 0, 512, 128);

    // Simple medical cross mark
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(36, 48, 44, 14);
    ctx.fillRect(51, 33, 14, 44);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 46px sans-serif';
    ctx.fillText('CITYVET CLINIC', 102, 78);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
