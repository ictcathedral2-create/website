const MAX_DIMENSION = 1000;
const JPEG_QUALITY = 0.82;
const MAX_PDF_BYTES = 3 * 1024 * 1024; // 3MB — PDFs can't be compressed like images, so cap the size directly.

// Resizes/compresses an image file in the browser and returns a JPEG data URI,
// so uploads stay small enough to store directly in Firebase (no storage
// service/account needed).
export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round(height * (MAX_DIMENSION / width));
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round(width * (MAX_DIMENSION / height));
          height = MAX_DIMENSION;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.onerror = () => reject(new Error("Couldn't read that image file."));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsDataURL(file);
  });
}

// Reads a PDF file as-is into a data URI (no compression possible), capped at
// MAX_PDF_BYTES so a single upload can't bloat the database.
export function readPdfAsDataUri(file) {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_PDF_BYTES) {
      reject(new Error(`PDF is too large (max ${MAX_PDF_BYTES / (1024 * 1024)}MB). Try compressing it first.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsDataURL(file);
  });
}
