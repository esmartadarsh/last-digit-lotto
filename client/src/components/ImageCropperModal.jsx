import { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { FiUpload, FiX, FiCheck } from 'react-icons/fi';

// Target fixed dimensions
const TARGET_WIDTH = 1920;
const TARGET_HEIGHT = 1080;
const ASPECT_RATIO = TARGET_WIDTH / TARGET_HEIGHT; // 16/9

/**
 * Generates a cropped canvas from the original image and crop area pixels.
 * Returns a Blob (WebP format).
 */
async function getCroppedBlob(imageSrc, pixelCrop) {
  const image = await createImageBitmap(await fetch(imageSrc).then(r => r.blob()));
  const canvas = document.createElement('canvas');
  canvas.width = TARGET_WIDTH;
  canvas.height = TARGET_HEIGHT;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    TARGET_WIDTH,
    TARGET_HEIGHT
  );

  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/webp', 0.92);
  });
}

/**
 * A reusable image cropper modal.
 * Props:
 *   onCropped(blob, previewUrl) — called when admin confirms the crop
 *   onCancel() — called when admin dismisses without saving
 */
export default function ImageCropperModal({ onCropped, onCancel }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef(null);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      const previewUrl = URL.createObjectURL(blob);
      onCropped(blob, previewUrl);
    } catch (err) {
      console.error('Crop failed:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1e293b] border border-[#334155] rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#334155]">
          <div>
            <h2 className="text-lg font-bold text-white">Upload & Crop Banner</h2>
            <p className="text-xs text-slate-400 mt-0.5">Output: 1920 × 1080 px (WebP)</p>
          </div>
          <button onClick={onCancel} className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700">
            <FiX size={20} />
          </button>
        </div>

        {/* Upload area or Cropper */}
        {!imageSrc ? (
          <div
            className="flex flex-col items-center justify-center gap-4 m-6 border-2 border-dashed border-slate-600 hover:border-red-500 rounded-xl p-16 cursor-pointer transition-colors group"
            onClick={() => inputRef.current.click()}
          >
            <FiUpload size={36} className="text-slate-500 group-hover:text-red-400 transition-colors" />
            <p className="text-slate-400 font-medium group-hover:text-white transition-colors">
              Click to select an image
            </p>
            <p className="text-xs text-slate-600">PNG, JPG, WebP — any size (will be cropped to 16:9)</p>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          </div>
        ) : (
          <>
            {/* Crop canvas */}
            <div className="relative w-full" style={{ height: '420px', background: '#0f172a' }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={ASPECT_RATIO}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{
                  containerStyle: { borderRadius: 0 },
                  cropAreaStyle: { border: '2px solid rgba(220,38,38,0.8)' },
                }}
              />
            </div>

            {/* Zoom slider */}
            <div className="px-6 pt-4 flex items-center gap-4">
              <span className="text-xs text-slate-400 font-semibold w-12">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                className="flex-1 accent-red-500"
              />
              <span className="text-xs text-slate-400 w-10 text-right">{zoom.toFixed(1)}x</span>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center gap-3 px-6 py-4 border-t border-[#334155] mt-3">
              <button
                onClick={() => { setImageSrc(null); setCrop({ x: 0, y: 0 }); setZoom(1); }}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                ← Choose different image
              </button>
              <button
                onClick={handleConfirm}
                disabled={processing}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-60 shadow-lg shadow-red-500/20"
              >
                {processing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiCheck size={16} />
                )}
                {processing ? 'Processing...' : 'Use This Crop'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
