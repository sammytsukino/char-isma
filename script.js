const loadingOverlay = document.createElement('div');
loadingOverlay.className = 'loading-overlay';
loadingOverlay.innerHTML = '<div class="spinner"></div><p>Processing...</p>';
document.body.appendChild(loadingOverlay);

function showLoading(message = 'Processing...') {
    loadingOverlay.querySelector('p').textContent = message;
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

let previousFileURL = null; 
const THUMBNAIL_WIDTH = 160;  const THUMBNAIL_HEIGHT = 90;  const thumbnailCanvas = document.createElement('canvas');
const thumbnailCtx = thumbnailCanvas.getContext('2d');
thumbnailCanvas.width = THUMBNAIL_WIDTH;
thumbnailCanvas.height = THUMBNAIL_HEIGHT;

const mediaInput            = document.getElementById('media-upload');
const useWebcamButton       = document.getElementById('use-webcam');
const sourceVideo           = document.getElementById('source-video');
const canvas                = document.getElementById('canvas');
const ctx                   = canvas.getContext('2d');
const applyButton           = document.getElementById('apply-effect');
const resetButton           = document.getElementById('reset-effect');
const captureFrameLink      = document.getElementById('capture-frame');
const thumbnail             = document.getElementById('thumbnail');
const videoThumbnail        = document.getElementById('video-thumbnail');

const char0Input            = document.getElementById('char0');
const textColor0Input       = document.getElementById('textColor0');
const backgroundColor0Input = document.getElementById('backgroundColor0');
const icon0Input            = document.getElementById('icon0-upload');
const cellTypeRadiosDark    = document.querySelectorAll('input[name="cellTypeDark"]');
const characterControlsDark = document.getElementById('character-controls-dark');
const iconControlsDark      = document.getElementById('icon-controls-dark');
const gradientControlsDark  = document.getElementById('gradient-controls-dark');
const gradient0Color1Input  = document.getElementById('gradient0Color1');
const gradient0Color2Input  = document.getElementById('gradient0Color2');
const gradient0DirectionInput = document.getElementById('gradient0Direction');
const gradientPreview0Canvas= document.getElementById('gradient-preview-0');
const ctxGradientPreview0   = gradientPreview0Canvas.getContext('2d');
const solid0ColorInput      = document.getElementById('solid0Color');
const solidControlsDark     = document.getElementById('solid-controls-dark');

const char1Input            = document.getElementById('char1');
const textColor1Input       = document.getElementById('textColor1');
const backgroundColor1Input = document.getElementById('backgroundColor1');
const icon1Input            = document.getElementById('icon1-upload');
const cellTypeRadiosBright  = document.querySelectorAll('input[name="cellTypeBright"]');
const characterControlsBright = document.getElementById('character-controls-bright');
const iconControlsBright    = document.getElementById('icon-controls-bright');
const gradientControlsBright= document.getElementById('gradient-controls-bright');
const gradient1Color1Input  = document.getElementById('gradient1Color1');
const gradient1Color2Input  = document.getElementById('gradient1Color2');
const gradient1DirectionInput = document.getElementById('gradient1Direction');
const gradientPreview1Canvas= document.getElementById('gradient-preview-1');
const ctxGradientPreview1   = gradientPreview1Canvas.getContext('2d');
const solid1ColorInput      = document.getElementById('solid1Color');
const solidControlsBright   = document.getElementById('solid-controls-bright');

const bgColorInput          = document.getElementById('bgColor');
const gridSizeInput         = document.getElementById('gridSize');
const gridSizeDisplay       = document.getElementById('gridSizeDisplay');
const thresholdInput        = document.getElementById('threshold');
const playButton            = document.getElementById('play-button');
const pauseButton           = document.getElementById('pause-button');

const startRecordingButton  = document.getElementById('start-recording');
const stopRecordingButton   = document.getElementById('stop-recording');

const invertStylesButton = document.getElementById('invert-cell-styles');

const loopVideoCheckbox = document.getElementById('loop-video');

const gradientSize = 10;

let originalImage = new Image();
let imageLoaded = false;
let icon0Image = new Image();
let icon0Loaded = false;
let icon1Image = new Image();
let icon1Loaded = false;
let sourceType = null;
let isVideoPlaying = false;
let animationFrameId = null;
let stream = null;

let mediaRecorder = null;
let recordedChunks = [];

const tempCanvas = document.createElement('canvas');
const tempCtx = tempCanvas.getContext('2d');


const downscaledSourceCanvas = document.createElement('canvas');
const downscaledSourceCtx = downscaledSourceCanvas.getContext('2d');

let canvasAspectRatio = 16 / 9;
let sourceWidth = 0;
let sourceHeight = 0;

function resizeCanvas() {
    const isMobile = window.innerWidth <= 768;
    let availableWidth, availableHeight;
    
    if (isMobile) {
        availableWidth = window.innerWidth;
        availableHeight = window.innerHeight * 0.4;
    } else {
        availableWidth = window.innerWidth - 300;
        availableHeight = window.innerHeight;
    }
    
    if ((sourceType === 'image' && imageLoaded) || 
        (sourceType === 'video' || sourceType === 'webcam') && sourceVideo.readyState >= 2) {
        
        if (sourceType === 'image') {
            canvasAspectRatio = originalImage.width / originalImage.height;
            sourceWidth = originalImage.width;
            sourceHeight = originalImage.height;
        } else {
            canvasAspectRatio = sourceVideo.videoWidth / sourceVideo.videoHeight;
            sourceWidth = sourceVideo.videoWidth;
            sourceHeight = sourceVideo.videoHeight;
        }
    }
    
    let canvasWidth, canvasHeight;
    const containerAspect = availableWidth / availableHeight;
    
    if (containerAspect > canvasAspectRatio) {
        canvasHeight = availableHeight;
        canvasWidth = canvasHeight * canvasAspectRatio;
    } else {
        canvasWidth = availableWidth;
        canvasHeight = canvasWidth / canvasAspectRatio;
    }
    
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    
    let minHeight = window.innerHeight;
    let minWidth = Math.ceil(minHeight * canvasAspectRatio);
    
    if (sourceWidth > 0 && sourceHeight > 0) {
        canvas.width = Math.max(sourceWidth, minWidth);
        canvas.height = Math.max(sourceHeight, minHeight);
        
        if (canvas.width / canvas.height !== canvasAspectRatio) {
            if (canvas.width / canvas.height > canvasAspectRatio) {
                canvas.width = Math.ceil(canvas.height * canvasAspectRatio);
            } else {
                canvas.height = Math.ceil(canvas.width / canvasAspectRatio);
            }
        }
    } else {
        canvas.width = minWidth;
        canvas.height = minHeight;
    }
    
    console.log(`Canvas redimensionado a: ${canvas.width}x${canvas.height} (visual: ${canvasWidth}x${canvasHeight})`);
    
    if (sourceType === 'image' && imageLoaded) {
        drawOriginalImage();
    }
    updateGridSizeDisplay();
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function stopCurrentSource() {
    console.log("Deteniendo fuente actual...");
    if (mediaRecorder && mediaRecorder.state === "recording") {
        console.log("Deteniendo grabación activa debido al cambio de fuente...");
        try {
             mediaRecorder.stop();
        } catch (e) {
             console.error("Error al detener MediaRecorder en stopCurrentSource:", e);
             mediaRecorder = null;
             recordedChunks = [];
        }
    }

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    if (stream) {
        try {
            stream.getTracks().forEach(track => {
                track.stop();
                stream.removeTrack(track);
            });
        } catch (e) {
            console.error("Error al detener tracks de stream:", e);
        }
        stream = null;
        console.log("Stream de webcam detenido.");
    }
    
        try {
        sourceVideo.pause();
        sourceVideo.removeAttribute('src');
        sourceVideo.load();
        sourceVideo.srcObject = null;
        isVideoPlaying = false;
    } catch (e) {
        console.error("Error al limpiar el elemento de vídeo:", e);
    }
    sourceType = null;

        try {
        videoThumbnail.pause();
        videoThumbnail.removeAttribute('src');
        videoThumbnail.load();
        videoThumbnail.srcObject = null;
        thumbnail.style.display = 'none';
        videoThumbnail.style.display = 'none';
    } catch (e) {
        console.error("Error al limpiar miniatura de vídeo:", e);
    }

    playButton.disabled = true;
    pauseButton.disabled = true;
    captureFrameLink.style.display = 'none';
    startRecordingButton.disabled = true;
    stopRecordingButton.disabled = true;
    stopRecordingButton.textContent = "STOP & DOWNLOAD";
    applyButton.disabled = false;

    console.log("Fuente de vídeo detenida y limpiada.");
}

function openNextAccordion(currentStepNumber) {
    const accordions = document.querySelectorAll('.step-accordion');
        accordions.forEach(acc => acc.open = false);
    
        const nextStep = accordions[currentStepNumber];
    if (nextStep) nextStep.open = true;
}

mediaInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

        stopCurrentSource();
    
        if (previousFileURL) {
        URL.revokeObjectURL(previousFileURL);
        previousFileURL = null;
    }
    
        setTimeout(() => {
        const fileURL = URL.createObjectURL(file);
        previousFileURL = fileURL; 
        if (file.type.startsWith('image/')) {
            sourceType = 'image';
            originalImage = new Image();
            imageLoaded = false;

            originalImage.onload = function() {
                imageLoaded = true;
                thumbnail.src = fileURL;
                thumbnail.style.display = 'block';
                console.log("Imagen cargada:", file.name);
                
                canvasAspectRatio = originalImage.width / originalImage.height;
                sourceWidth = originalImage.width;
                sourceHeight = originalImage.height;
                resizeCanvas();
                
                drawOriginalImage();
                applyButton.disabled = false;
                playButton.disabled = true;
                pauseButton.disabled = true;
                startRecordingButton.disabled = true;
                stopRecordingButton.disabled = true;

                                openNextAccordion(1);             };
            originalImage.onerror = function() {
                alert("Error al cargar la imagen.");
                resetApp();
            }
            originalImage.src = fileURL;

        } else if (file.type.startsWith('video/')) {
            sourceType = 'video';
            imageLoaded = false;
            
                        videoThumbnail.onloadeddata = null;
            videoThumbnail.onerror = null;
            sourceVideo.onloadedmetadata = null;
            sourceVideo.oncanplay = null;
            sourceVideo.onerror = null;
            sourceVideo.onended = null;
            
                        thumbnail.style.display = 'none';
            videoThumbnail.style.display = 'block';
            videoThumbnail.onerror = function() {
                console.error("Error al cargar la miniatura del vídeo");
            };

                        videoThumbnail.width = THUMBNAIL_WIDTH;
            videoThumbnail.height = THUMBNAIL_HEIGHT;
            videoThumbnail.src = fileURL;
            videoThumbnail.load();
            
                        sourceVideo.onerror = function() {
                console.error("Error al cargar el vídeo:", sourceVideo.error);
                alert("Error al cargar el vídeo.");
                resetApp();
            };
            
            sourceVideo.src = fileURL;
            sourceVideo.load();
            
                        if (mediaRecorder) {
                if (mediaRecorder.state === "recording") {
                    try { mediaRecorder.stop(); } catch(e) {}
                }
                mediaRecorder = null;
                recordedChunks = [];
            }

            sourceVideo.onloadedmetadata = () => {
                console.log("Metadata del vídeo cargada. Dimensiones:", sourceVideo.videoWidth, "x", sourceVideo.videoHeight);
                
                canvasAspectRatio = sourceVideo.videoWidth / sourceVideo.videoHeight;
                sourceWidth = sourceVideo.videoWidth;
                sourceHeight = sourceVideo.videoHeight;
                resizeCanvas();
                
                tempCanvas.width = sourceVideo.videoWidth;
                tempCanvas.height = sourceVideo.videoHeight;
                
                                setupVideoEvents();

                                if (sourceType === 'video') {
                    videoScrubber.max = sourceVideo.duration;
                    videoTimeline.style.display = 'block';
                    totalTimeDisplay.textContent = formatTime(sourceVideo.duration);
                } else {
                    videoTimeline.style.display = 'none';
                }

                                sourceVideo.loop = loopVideoCheckbox.checked;
                videoThumbnail.loop = loopVideoCheckbox.checked;
            };

            sourceVideo.oncanplay = () => {
                console.log("Vídeo listo para reproducir:", file.name);
                updateButtonStates();              };
        } else {
            alert("Tipo de archivo no soportado. Por favor, selecciona una imagen o un vídeo.");
            resetApp();
        }
    }, 100); });

useWebcamButton.addEventListener('click', async () => {
    stopCurrentSource();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Tu navegador no soporta el acceso a la webcam.");
        return;
    }

    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        sourceType = 'webcam';
        imageLoaded = false;
        
                thumbnail.style.display = 'none';
        videoThumbnail.width = THUMBNAIL_WIDTH;
        videoThumbnail.height = THUMBNAIL_HEIGHT;
        videoThumbnail.srcObject = stream;
        videoThumbnail.style.display = 'block';
        
        sourceVideo.srcObject = stream;
        console.log("Acceso a webcam concedido.");

        sourceVideo.onloadedmetadata = () => {
            console.log("Stream de webcam iniciado. Dimensiones:", sourceVideo.videoWidth, "x", sourceVideo.videoHeight);
            
            canvasAspectRatio = sourceVideo.videoWidth / sourceVideo.videoHeight;
            sourceWidth = sourceVideo.videoWidth;
            sourceHeight = sourceVideo.videoHeight;
            resizeCanvas();
            
            tempCanvas.width = sourceVideo.videoWidth;
            tempCanvas.height = sourceVideo.videoHeight;
            sourceVideo.play();
        };

        setupVideoEvents();
    } catch (err) {
        console.error("Error al acceder a la webcam:", err);
        alert(`No se pudo acceder a la webcam: ${err.name} - ${err.message}`);
        resetApp();
    }
});

function drawOriginalImage() {
    if (!imageLoaded || sourceType !== 'image') return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    
    console.log("Imagen original dibujada en canvas respetando proporciones.");
}

function generateGradient(colorStart, colorEnd, direction) {
    const gradCanvas = document.createElement('canvas');
    const gradCtx = gradCanvas.getContext('2d');
    gradCanvas.width = gradientSize;
    gradCanvas.height = gradientSize;
    let gradient;
    switch (direction) {
        case "horizontal": gradient = gradCtx.createLinearGradient(0, 0, gradientSize, 0); break;
        case "vertical": gradient = gradCtx.createLinearGradient(0, 0, 0, gradientSize); break;
        case "diagonal": gradient = gradCtx.createLinearGradient(0, 0, gradientSize, gradientSize); break;
        default: gradient = gradCtx.createLinearGradient(0, 0, gradientSize, 0); break;
    }
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    gradCtx.fillStyle = gradient;
    gradCtx.fillRect(0, 0, gradientSize, gradientSize);
    return gradCanvas;
}

function updateGradientPreviews() {
    const grad0 = generateGradient(gradient0Color1Input.value, gradient0Color2Input.value, gradient0DirectionInput.value);
    ctxGradientPreview0.clearRect(0,0, gradientPreview0Canvas.width, gradientPreview0Canvas.height);
    ctxGradientPreview0.drawImage(grad0, 0, 0, gradientPreview0Canvas.width, gradientPreview0Canvas.height);
    const grad1 = generateGradient(gradient1Color1Input.value, gradient1Color2Input.value, gradient1DirectionInput.value);
    ctxGradientPreview1.clearRect(0,0, gradientPreview1Canvas.width, gradientPreview1Canvas.height);
    ctxGradientPreview1.drawImage(grad1, 0, 0, gradientPreview1Canvas.width, gradientPreview1Canvas.height);
}

function updateGridSizeDisplay() {
    const gridSize = parseInt(gridSizeInput.value, 10);
    const aspectRatio = canvas.height / canvas.width;
    const numCols = gridSize;
    const numRows = Math.round(gridSize * aspectRatio);
    gridSizeDisplay.textContent = `${numCols} x ${numRows}`;
}

gridSizeInput.addEventListener('input', updateGridSizeDisplay);

icon0Input.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileURL = URL.createObjectURL(file);
    icon0Image = new Image();
    icon0Loaded = false;
    
    icon0Image.onload = function() {
        icon0Loaded = true;
        console.log("Icono oscuro cargado correctamente");
    };
    
    icon0Image.onerror = function() {
        console.error("Error al cargar el icono oscuro");
        icon0Loaded = false;
    };
    
    icon0Image.src = fileURL;
    
    if (sourceType === 'image' && imageLoaded) {
        drawProcessedEffect();
    }
});

icon1Input.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileURL = URL.createObjectURL(file);
    icon1Image = new Image();
    icon1Loaded = false;
    
    icon1Image.onload = function() {
        icon1Loaded = true;
        console.log("Icono claro cargado correctamente");
    };
    
    icon1Image.onerror = function() {
        console.error("Error al cargar el icono claro");
        icon1Loaded = false;
    };
    
    icon1Image.src = fileURL;
    
    if (sourceType === 'image' && imageLoaded) {
        drawProcessedEffect();
    }
});

let lastRenderTime = 0;
const RENDER_THROTTLE = 20; 
let frameCount = 0;
let lastFpsTime = 0;
let fps = 0;

function updateFPS() {
    frameCount++;
    const now = Date.now();
    if (now - lastFpsTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastFpsTime = now;
        console.log(`Render FPS: ${fps}`);
    }
}

function drawProcessedEffect() {
          const now = Date.now();
     if (now - lastRenderTime < RENDER_THROTTLE && sourceType === 'image') {
                  if (!window._pendingRender) {
             window._pendingRender = setTimeout(() => {
                 window._pendingRender = null;
                 drawProcessedEffect();
             }, RENDER_THROTTLE);
         }
         return;
     }
     lastRenderTime = now;
     
     if (!sourceType || (sourceType === 'image' && !imageLoaded)) {
         return;
     }
     
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const gridSize = parseInt(gridSizeInput.value, 10);
    const currentAspectRatio = canvasHeight / canvasWidth; 
    const numCols = gridSize;
    const numRows = Math.round(gridSize * currentAspectRatio);
    const threshold = parseInt(thresholdInput.value, 10) || 128;
    const blockWidth = canvasWidth / numCols;
    const blockHeight = canvasHeight / numRows;

    
    downscaledSourceCanvas.width = numCols;
    downscaledSourceCanvas.height = numRows;

    let currentSourceElement;
    let sourceElementOriginalWidth = 0;
    let sourceElementOriginalHeight = 0;

    if (sourceType === 'image' && imageLoaded) {
        currentSourceElement = originalImage;
        sourceElementOriginalWidth = originalImage.naturalWidth;
        sourceElementOriginalHeight = originalImage.naturalHeight;
    } else if ((sourceType === 'video' || sourceType === 'webcam') && sourceVideo.readyState >= 2) {
        currentSourceElement = sourceVideo;
        sourceElementOriginalWidth = sourceVideo.videoWidth;
        sourceElementOriginalHeight = sourceVideo.videoHeight;
    } else {
        return; 
    }
    
    if (!currentSourceElement || sourceElementOriginalWidth === 0 || sourceElementOriginalHeight === 0) {
        console.warn("Fuente no válida o dimensiones cero para drawProcessedEffect");
        return;
    }

    downscaledSourceCtx.imageSmoothingEnabled = true; 
    downscaledSourceCtx.drawImage(currentSourceElement, 0, 0, sourceElementOriginalWidth, sourceElementOriginalHeight, 0, 0, numCols, numRows);
    
    let downscaledPixelData;
    try {
        downscaledPixelData = downscaledSourceCtx.getImageData(0, 0, numCols, numRows).data;
    } catch (e) {
        console.error("Error obteniendo ImageData del canvas downscaled:", e);
        
        if (e.name === 'SecurityError') {
             console.warn("SecurityError con getImageData en canvas downscaled. Esto puede ocurrir con fuentes cross-origin sin CORS.");
             
             downscaledSourceCtx.fillStyle = 'black';
             downscaledSourceCtx.fillRect(0,0,numCols, numRows);
             downscaledPixelData = downscaledSourceCtx.getImageData(0, 0, numCols, numRows).data;
        } else {
            
            return;
        }
    }
    

    ctx.fillStyle = bgColorInput.value;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.font = `${Math.min(blockWidth, blockHeight) * 0.9}px monospace`;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.imageSmoothingEnabled = false; 

    const selectedCellTypeDark = document.querySelector('input[name="cellTypeDark"]:checked').value;
    const selectedCellTypeBright = document.querySelector('input[name="cellTypeBright"]:checked').value;
    const charsDark = char0Input.value || "@%#*+=-:. ";
    const colorValueDark = textColor0Input.value;
    const bgCellColorDark = backgroundColor0Input.value;
    const charsBright = char1Input.value || "@%#*+=-:. ";
    const colorValueBright = textColor1Input.value;
    const bgCellColorBright = backgroundColor1Input.value;
    const solidColorDark = solid0ColorInput.value;
    const solidColorBright = solid1ColorInput.value;

    let gradient0Canvas, gradient1Canvas;
    if (selectedCellTypeDark === 'gradient') {
        gradient0Canvas = generateGradient(gradient0Color1Input.value, gradient0Color2Input.value, gradient0DirectionInput.value);
    }
    if (selectedCellTypeBright === 'gradient') {
        gradient1Canvas = generateGradient(gradient1Color1Input.value, gradient1Color2Input.value, gradient1DirectionInput.value);
    }

    for (let row = 0; row < numRows; row++) {
        const startY = Math.round(row * blockHeight);
        const cellH = Math.round((row + 1) * blockHeight) - startY;

        for (let col = 0; col < numCols; col++) {
            const startX = Math.round(col * blockWidth);
            const cellW = Math.round((col + 1) * blockWidth) - startX;

            
            const pixelIndex = (row * numCols + col) * 4;
            const r = downscaledPixelData[pixelIndex];
            const g = downscaledPixelData[pixelIndex + 1];
            const b = downscaledPixelData[pixelIndex + 2];
            
            const avgBrightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            

            if (avgBrightness > threshold) {
                switch (selectedCellTypeBright) {
                    case 'character':
                        ctx.fillStyle = bgCellColorBright;
                        ctx.fillRect(startX, startY, cellW, cellH);
                        
                        ctx.save();
                        ctx.beginPath();
                        ctx.rect(startX, startY, cellW, cellH);
                        ctx.clip();
                        
                        let idxBright = Math.round(((avgBrightness - threshold) / (255 - threshold)) * (charsBright.length - 1));
                        idxBright = Math.max(0, Math.min(charsBright.length - 1, idxBright));
                        ctx.fillStyle = colorValueBright;
                        ctx.fillText(charsBright[idxBright], startX, startY);
                        
                        ctx.restore();
                        break;
                    case 'icon':
                        if (icon1Loaded) {
                            ctx.drawImage(icon1Image, startX, startY, cellW, cellH);
                        } else {
                            
                            ctx.fillStyle = bgCellColorBright; 
                            ctx.fillRect(startX, startY, cellW, cellH);
                            ctx.save();
                            ctx.beginPath();
                            ctx.rect(startX, startY, cellW, cellH);
                            ctx.clip();
                            ctx.fillStyle = colorValueBright; 
                            
                            const placeholderBright = charsBright.length > 0 ? charsBright[0] : '?';
                            ctx.fillText(placeholderBright, startX, startY);
                            ctx.restore();
                        }
                        break;
                    case 'gradient':
                         if (gradient1Canvas) {
                             ctx.drawImage(gradient1Canvas, startX, startY, cellW, cellH);
                         } else {
                            ctx.fillStyle = colorValueBright;
                            ctx.fillRect(startX, startY, cellW, cellH);
                         }
                         break;
                    case 'solid':
                        ctx.fillStyle = solidColorBright;
                        ctx.fillRect(startX, startY, cellW, cellH);
                        break;
                }
            } else {
                switch (selectedCellTypeDark) {
                    case 'character':
                        ctx.fillStyle = bgCellColorDark;
                        ctx.fillRect(startX, startY, cellW, cellH);

                        ctx.save();
                        ctx.beginPath();
                        ctx.rect(startX, startY, cellW, cellH);
                        ctx.clip();

                        let idxDark = Math.round((avgBrightness / threshold) * (charsDark.length - 1));
                        idxDark = Math.max(0, Math.min(charsDark.length - 1, idxDark));
                        ctx.fillStyle = colorValueDark;
                        ctx.fillText(charsDark[idxDark], startX, startY);

                        ctx.restore();
                        break;
                    case 'icon':
                        if (icon0Loaded) {
                            ctx.drawImage(icon0Image, startX, startY, cellW, cellH);
                        } else {
                             
                            ctx.fillStyle = bgCellColorDark; 
                            ctx.fillRect(startX, startY, cellW, cellH);
                            ctx.save();
                            ctx.beginPath();
                            ctx.rect(startX, startY, cellW, cellH);
                            ctx.clip();
                            ctx.fillStyle = colorValueDark; 
                            const placeholderDark = charsDark.length > 0 ? charsDark[0] : '?';
                            ctx.fillText(placeholderDark, startX, startY);
                            ctx.restore();
                        }
                        break;
                    case 'gradient':
                         if (gradient0Canvas) {
                             ctx.drawImage(gradient0Canvas, startX, startY, cellW, cellH);
                         } else {
                            ctx.fillStyle = colorValueDark;
                            ctx.fillRect(startX, startY, cellW, cellH);
                         }
                         break;
                    case 'solid':
                        ctx.fillStyle = solidColorDark;
                        ctx.fillRect(startX, startY, cellW, cellH);
                        break;
                }
            }
        }
    }
    if (sourceType === 'image' || sourceType === 'video' || sourceType === 'webcam') {
        captureFrameLink.style.display = 'inline-block';
        captureFrameLink.href = '#';

        
        const iconElement = captureFrameLink.querySelector('i');
        if (iconElement) {
            iconElement.className = 'fas fa-camera';
        } else {
            const newIcon = document.createElement('i');
            newIcon.className = 'fas fa-camera';
            captureFrameLink.insertBefore(newIcon, captureFrameLink.firstChild);
            captureFrameLink.innerHTML = captureFrameLink.innerHTML + ' CAPTURE IN HIGH-RES';
        }
    }

    if (sourceType === 'image') {
        updateFPS();
    }
}

function processFrame() {
    if (!isVideoPlaying || (sourceType !== 'video' && sourceType !== 'webcam')) {
        animationFrameId = null;
        return;
    }
    drawProcessedEffect();
    animationFrameId = requestAnimationFrame(processFrame);
}

function startProcessingLoop() {
    if (!animationFrameId) {
        console.log("Iniciando bucle de procesamiento...");
        ctx.fillStyle = bgColorInput.value;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        processFrame();
    }
}

function stopProcessingLoop() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        console.log("Bucle de procesamiento detenido.");
    }
}

playButton.addEventListener('click', () => {
    if (sourceType === 'video' && sourceVideo.src) {
                if (sourceVideo.ended) {
            sourceVideo.currentTime = 0;
        }
        
                if (mediaRecorder) {
            if (mediaRecorder.state === "recording") {
                try {
                    mediaRecorder.stop();
                } catch (e) {
                    console.error("Error al detener grabación existente:", e);
                }
            }
            mediaRecorder = null;
            recordedChunks = [];
        }
        
        sourceVideo.play()
            .then(() => {
                console.log("Reproducción iniciada por botón.");
            })
            .catch(err => {
                console.error("Error al iniciar reproducción:", err);
                                isVideoPlaying = false;
                updateButtonStates();
            });
    }
});

pauseButton.addEventListener('click', () => {
    if (sourceType === 'video' && !sourceVideo.paused) {
        sourceVideo.pause();
        console.log("Reproducción pausada por botón.");
    }
});

applyButton.addEventListener('click', () => {
    if (sourceType === 'image' && imageLoaded) {
        showLoading();
        setTimeout(() => {
            drawProcessedEffect();
            hideLoading();
        }, 100);
    } else if (sourceType === 'video' || sourceType === 'webcam') {
        console.warn("El botón 'Aplicar Efecto' no tiene acción en modo vídeo/webcam.");
    } else {
        alert("Por favor, carga una imagen o inicia una fuente de vídeo primero.");
    }
});

captureFrameLink.addEventListener('click', (event) => {
    if (sourceType === 'video' || sourceType === 'webcam' || sourceType === 'image') {
        showLoading('Generating high-resolution image...');
        showStatusMessage('Capturing high-resolution frame...'); 
        
        event.preventDefault();
        
        const hiResCanvas = document.createElement('canvas');
        hiResCanvas.width = canvas.width * 2;
        hiResCanvas.height = canvas.height * 2;
        const hiResCtx = hiResCanvas.getContext('2d');
        
        hiResCtx.fillStyle = bgColorInput.value;
        hiResCtx.fillRect(0, 0, hiResCanvas.width, hiResCanvas.height);
        hiResCtx.font = `${Math.min(canvas.width/parseInt(gridSizeInput.value), canvas.height/(parseInt(gridSizeInput.value) * canvas.height/canvas.width)) * 0.9 * 2}px monospace`;
        hiResCtx.textBaseline = "top";
        hiResCtx.textAlign = "left";
        hiResCtx.imageSmoothingEnabled = false;
        
        renderHighResolutionImage(hiResCanvas, hiResCtx);
        
        const hiResUrl = hiResCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = hiResUrl;
        a.download = sourceType === 'image' ? 'processed_image_hires.png' : 'processed_frame_hires.png';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(hiResUrl);
            hideLoading();
            showStatusMessage('Frame captured and saved successfully!');
        }, 100);
    }
});

function renderHighResolutionImage(hiResCanvas, hiResCtx) {
    if (!sourceType || (sourceType === 'image' && !imageLoaded)) {
        return;
    }
    
    const canvasWidth = hiResCanvas.width;
    const canvasHeight = hiResCanvas.height;
    const gridSize = parseInt(gridSizeInput.value, 10);
    const currentHiResAspectRatio = canvasHeight / canvasWidth; 
    const numCols = gridSize;
    const numRows = Math.round(gridSize * currentHiResAspectRatio);
    const threshold = parseInt(thresholdInput.value, 10) || 128;
    const blockWidth = canvasWidth / numCols;
    const blockHeight = canvasHeight / numRows;

    
    downscaledSourceCanvas.width = numCols; 
    downscaledSourceCanvas.height = numRows; 

    let currentSourceElement;
    let sourceElementOriginalWidth = 0;
    let sourceElementOriginalHeight = 0;

    if (sourceType === 'image' && imageLoaded) {
        currentSourceElement = originalImage;
        sourceElementOriginalWidth = originalImage.naturalWidth; 
        sourceElementOriginalHeight = originalImage.naturalHeight;
    } else if ((sourceType === 'video' || sourceType === 'webcam') && sourceVideo.readyState >= 2) {
        currentSourceElement = sourceVideo;
        sourceElementOriginalWidth = sourceVideo.videoWidth;
        sourceElementOriginalHeight = sourceVideo.videoHeight;
    } else {
        return; 
    }

    if (!currentSourceElement || sourceElementOriginalWidth === 0 || sourceElementOriginalHeight === 0) {
        console.warn("Fuente no válida o dimensiones cero para renderHighResolutionImage");
        return;
    }
    
    downscaledSourceCtx.imageSmoothingEnabled = true; 
    downscaledSourceCtx.drawImage(currentSourceElement, 0, 0, sourceElementOriginalWidth, sourceElementOriginalHeight, 0, 0, numCols, numRows);
    
    let downscaledPixelData;
    try {
        downscaledPixelData = downscaledSourceCtx.getImageData(0, 0, numCols, numRows).data;
    } catch (e) {
        console.error("Error obteniendo ImageData del canvas downscaled (hi-res):", e);
        if (e.name === 'SecurityError') {
             console.warn("SecurityError con getImageData en canvas downscaled (hi-res).");
             downscaledSourceCtx.fillStyle = 'black';
             downscaledSourceCtx.fillRect(0,0,numCols, numRows);
             downscaledPixelData = downscaledSourceCtx.getImageData(0, 0, numCols, numRows).data;
        } else {
            return;
        }
    }
    

    hiResCtx.fillStyle = bgColorInput.value;
    hiResCtx.fillRect(0, 0, canvasWidth, canvasHeight);
    hiResCtx.font = `${Math.min(blockWidth, blockHeight) * 0.9}px monospace`;
    hiResCtx.textBaseline = "top";
    hiResCtx.textAlign = "left";
    hiResCtx.imageSmoothingEnabled = false; 

    const selectedCellTypeDark = document.querySelector('input[name="cellTypeDark"]:checked').value;
    const selectedCellTypeBright = document.querySelector('input[name="cellTypeBright"]:checked').value;
    const charsDark = char0Input.value || "@%#*+=-:. ";
    const colorValueDark = textColor0Input.value;
    const bgCellColorDark = backgroundColor0Input.value;
    const charsBright = char1Input.value || "@%#*+=-:. ";
    const colorValueBright = textColor1Input.value;
    const bgCellColorBright = backgroundColor1Input.value;
    const solidColorDark = solid0ColorInput.value;
    const solidColorBright = solid1ColorInput.value;

    let gradient0Canvas, gradient1Canvas;
    if (selectedCellTypeDark === 'gradient') {
        const tmpGradientCanvas = document.createElement('canvas');
        const tmpGradCtx = tmpGradientCanvas.getContext('2d');
        tmpGradientCanvas.width = gradientSize * 2;
        tmpGradientCanvas.height = gradientSize * 2;
        let gradient;
        const dir = gradient0DirectionInput.value;
        switch (dir) {
            case "horizontal": gradient = tmpGradCtx.createLinearGradient(0, 0, tmpGradientCanvas.width, 0); break;
            case "vertical": gradient = tmpGradCtx.createLinearGradient(0, 0, 0, tmpGradientCanvas.height); break;
            case "diagonal": gradient = tmpGradCtx.createLinearGradient(0, 0, tmpGradientCanvas.width, tmpGradientCanvas.height); break;
            default: gradient = tmpGradCtx.createLinearGradient(0, 0, tmpGradientCanvas.width, 0); break;
        }
        gradient.addColorStop(0, gradient0Color1Input.value);
        gradient.addColorStop(1, gradient0Color2Input.value);
        tmpGradCtx.fillStyle = gradient;
        tmpGradCtx.fillRect(0, 0, tmpGradientCanvas.width, tmpGradientCanvas.height);
        gradient0Canvas = tmpGradientCanvas;
    }
    
    if (selectedCellTypeBright === 'gradient') {
        const tmpGradientCanvas = document.createElement('canvas');
        const tmpGradCtx = tmpGradientCanvas.getContext('2d');
        tmpGradientCanvas.width = gradientSize * 2;
        tmpGradientCanvas.height = gradientSize * 2;
        let gradient;
        const dir = gradient1DirectionInput.value;
        switch (dir) {
            case "horizontal": gradient = tmpGradCtx.createLinearGradient(0, 0, tmpGradientCanvas.width, 0); break;
            case "vertical": gradient = tmpGradCtx.createLinearGradient(0, 0, 0, tmpGradientCanvas.height); break;
            case "diagonal": gradient = tmpGradCtx.createLinearGradient(0, 0, tmpGradientCanvas.width, tmpGradientCanvas.height); break;
            default: gradient = tmpGradCtx.createLinearGradient(0, 0, tmpGradientCanvas.width, 0); break;
        }
        gradient.addColorStop(0, gradient1Color1Input.value);
        gradient.addColorStop(1, gradient1Color2Input.value);
        tmpGradCtx.fillStyle = gradient;
        tmpGradCtx.fillRect(0, 0, tmpGradientCanvas.width, tmpGradientCanvas.height);
        gradient1Canvas = tmpGradientCanvas;
    }

    let hiResIcon0Image, hiResIcon1Image;
    if (selectedCellTypeDark === 'icon' && icon0Loaded) {
        hiResIcon0Image = new Image();
        hiResIcon0Image.src = icon0Image.src;
    }
    
    if (selectedCellTypeBright === 'icon' && icon1Loaded) {
        hiResIcon1Image = new Image();
        hiResIcon1Image.src = icon1Image.src;
    }

    for (let row = 0; row < numRows; row++) {
        const startY = Math.round(row * blockHeight);
        const cellH = Math.round((row + 1) * blockHeight) - startY;

        for (let col = 0; col < numCols; col++) {
            const startX = Math.round(col * blockWidth);
            const cellW = Math.round((col + 1) * blockWidth) - startX;

            
            const pixelIndex = (row * numCols + col) * 4; 
            const r = downscaledPixelData[pixelIndex];
            const g = downscaledPixelData[pixelIndex + 1];
            const b = downscaledPixelData[pixelIndex + 2];
            const avgBrightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            

            if (avgBrightness > threshold) {
                switch (selectedCellTypeBright) {
                    case 'character':
                        hiResCtx.fillStyle = bgCellColorBright;
                        hiResCtx.fillRect(startX, startY, cellW, cellH);

                        hiResCtx.save();
                        hiResCtx.beginPath();
                        hiResCtx.rect(startX, startY, cellW, cellH);
                        hiResCtx.clip();
                        
                        let idxBright = Math.round(((avgBrightness - threshold) / (255 - threshold)) * (charsBright.length - 1));
                        idxBright = Math.max(0, Math.min(charsBright.length - 1, idxBright));
                        hiResCtx.fillStyle = colorValueBright;
                        hiResCtx.fillText(charsBright[idxBright], startX, startY);

                        hiResCtx.restore();
                        break;
                    case 'icon':
                        if (icon1Loaded) {
                            hiResCtx.drawImage(hiResIcon1Image || icon1Image, startX, startY, cellW, cellH);
                        } else {
                            
                            hiResCtx.fillStyle = bgCellColorBright;
                            hiResCtx.fillRect(startX, startY, cellW, cellH);
                            hiResCtx.save();
                            hiResCtx.beginPath();
                            hiResCtx.rect(startX, startY, cellW, cellH);
                            hiResCtx.clip();
                            hiResCtx.fillStyle = colorValueBright;
                            const placeholderBright = charsBright.length > 0 ? charsBright[0] : '?';
                            hiResCtx.fillText(placeholderBright, startX, startY);
                            hiResCtx.restore();
                        }
                        break;
                    case 'gradient':
                         if (gradient1Canvas) {
                             hiResCtx.drawImage(gradient1Canvas, startX, startY, cellW, cellH);
                         } else {
                            hiResCtx.fillStyle = colorValueBright;
                            hiResCtx.fillRect(startX, startY, cellW, cellH);
                         }
                         break;
                    case 'solid':
                        hiResCtx.fillStyle = solidColorBright;
                        hiResCtx.fillRect(startX, startY, cellW, cellH);
                        break;
                }
            } else {
                switch (selectedCellTypeDark) {
                    case 'character':
                        hiResCtx.fillStyle = bgCellColorDark;
                        hiResCtx.fillRect(startX, startY, cellW, cellH);

                        hiResCtx.save();
                        hiResCtx.beginPath();
                        hiResCtx.rect(startX, startY, cellW, cellH);
                        hiResCtx.clip();

                        let idxDark = Math.round((avgBrightness / threshold) * (charsDark.length - 1));
                        idxDark = Math.max(0, Math.min(charsDark.length - 1, idxDark));
                        hiResCtx.fillStyle = colorValueDark;
                        hiResCtx.fillText(charsDark[idxDark], startX, startY);
                        
                        hiResCtx.restore();
                        break;
                    case 'icon':
                        if (icon0Loaded) {
                            hiResCtx.drawImage(hiResIcon0Image || icon0Image, startX, startY, cellW, cellH);
                        } else {
                            
                            hiResCtx.fillStyle = bgCellColorDark;
                            hiResCtx.fillRect(startX, startY, cellW, cellH);
                            hiResCtx.save();
                            hiResCtx.beginPath();
                            hiResCtx.rect(startX, startY, cellW, cellH);
                            hiResCtx.clip();
                            hiResCtx.fillStyle = colorValueDark;
                            const placeholderDark = charsDark.length > 0 ? charsDark[0] : '?';
                            hiResCtx.fillText(placeholderDark, startX, startY);
                            hiResCtx.restore();
                        }
                        break;
                    case 'gradient':
                         if (gradient0Canvas) {
                             hiResCtx.drawImage(gradient0Canvas, startX, startY, cellW, cellH);
                         } else {
                            hiResCtx.fillStyle = colorValueDark;
                            hiResCtx.fillRect(startX, startY, cellW, cellH);
                         }
                         break;
                    case 'solid':
                        hiResCtx.fillStyle = solidColorDark;
                        hiResCtx.fillRect(startX, startY, cellW, cellH);
                        break;
                }
            }
        }
    }
}

function resetApp() {
    console.log("Reseteando aplicación...");
    if (mediaRecorder && mediaRecorder.state === "recording") {
        console.log("Deteniendo grabación activa debido al reset...");
         try {
            mediaRecorder.stop();
         } catch(e){ console.error("Error forzando parada de recorder en reset:", e); }
        mediaRecorder = null;
        recordedChunks = [];
    }

    stopCurrentSource();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    originalImage = new Image();
    imageLoaded = false;
    mediaInput.value = "";
    thumbnail.style.display = 'none';
    videoThumbnail.style.display = 'none';
    videoThumbnail.pause();
    videoThumbnail.srcObject = null;
    videoThumbnail.src = '';
    icon0Input.value = "";
    icon1Input.value = "";
    icon0Loaded = false;
    icon1Loaded = false;
    icon0Image = new Image();
    icon1Image = new Image();

    document.querySelector('input[name="cellTypeDark"][value="character"]').checked = true;
    setupCellTypeToggle('cellTypeDark', 'character-controls-dark', 'icon-controls-dark', 'gradient-controls-dark', 'solid-controls-dark');
    document.querySelector('input[name="cellTypeBright"][value="character"]').checked = true;
    setupCellTypeToggle('cellTypeBright', 'character-controls-bright', 'icon-controls-bright', 'gradient-controls-bright', 'solid-controls-bright');

    char0Input.value = "1";
    char1Input.value = "0";
    textColor0Input.value = "#000000";
    textColor1Input.value = "#000000";
    bgColorInput.value = "#FFFFFF";
    gradient0Color1Input.value = "#ff0000";
    gradient0Color2Input.value = "#0000ff";
    gradient0DirectionInput.value = "horizontal";
    gradient1Color1Input.value = "#00ff00";
    gradient1Color2Input.value = "#0000ff";
    gradient1DirectionInput.value = "horizontal";
    solid0ColorInput.value = "#000000";
    solid1ColorInput.value = "#ffffff";
    updateGradientPreviews();

    gridSizeInput.value = 80;
    updateGridSizeDisplay();
    thresholdInput.value = 128;

    captureFrameLink.style.display = 'none';
    captureFrameLink.href="#";

    playButton.disabled = true;
    pauseButton.disabled = true;
    applyButton.disabled = false;
    startRecordingButton.disabled = true;
    stopRecordingButton.disabled = true;
    stopRecordingButton.textContent = "STOP & DOWNLOAD";

    const livePreviewCheckbox = document.getElementById('live-preview');
    if (livePreviewCheckbox && livePreviewCheckbox.checked) {
        setTimeout(() => {
            if (sourceType === 'image' && imageLoaded) {
                drawProcessedEffect();
            }
        }, 100);
    }

    console.log("Aplicación reseteada.");
}
resetButton.addEventListener('click', resetApp);

function setupCellTypeToggle(radioGroupName, charControlsId, iconControlsId, gradControlsId, solidControlsId) {
    const radios = document.querySelectorAll(`input[name="${radioGroupName}"]`);
    const charControls = document.getElementById(charControlsId);
    const iconControls = document.getElementById(iconControlsId);
    const gradControls = document.getElementById(gradControlsId);
    const solidControls = document.getElementById(solidControlsId);

    radios.forEach(radio => {
        radio.addEventListener('change', function() {
            charControls.style.display = 'none';
            iconControls.style.display = 'none';
            gradControls.style.display = 'none';
            solidControls.style.display = 'none';
            if (this.value === 'character') {
                charControls.style.display = 'block';
            } else if (this.value === 'icon') {
                iconControls.style.display = 'block';
            } else if (this.value === 'gradient') {
                gradControls.style.display = 'block';
                updateGradientPreviews();
            } else if (this.value === 'solid') {
                solidControls.style.display = 'block';
            }
        });
    });
     const checkedRadio = document.querySelector(`input[name="${radioGroupName}"]:checked`);
     if (checkedRadio) {
         charControls.style.display = checkedRadio.value === 'character' ? 'block' : 'none';
         iconControls.style.display = checkedRadio.value === 'icon' ? 'block' : 'none';
         gradControls.style.display = checkedRadio.value === 'gradient' ? 'block' : 'none';
         solidControls.style.display = checkedRadio.value === 'solid' ? 'block' : 'none';
         if (checkedRadio.value === 'gradient') updateGradientPreviews();
     } else {
         charControls.style.display = 'none';
         iconControls.style.display = 'none';
         gradControls.style.display = 'none';
         solidControls.style.display = 'none';
     }
}

setupCellTypeToggle('cellTypeDark', 'character-controls-dark', 'icon-controls-dark', 'gradient-controls-dark', 'solid-controls-dark');
setupCellTypeToggle('cellTypeBright', 'character-controls-bright', 'icon-controls-bright', 'gradient-controls-bright', 'solid-controls-bright');

gradient0Color1Input.addEventListener('input', updateGradientPreviews);
gradient0Color2Input.addEventListener('input', updateGradientPreviews);
gradient0DirectionInput.addEventListener('change', updateGradientPreviews);
gradient1Color1Input.addEventListener('input', updateGradientPreviews);
gradient1Color2Input.addEventListener('input', updateGradientPreviews);
gradient1DirectionInput.addEventListener('change', updateGradientPreviews);

function invertCellStyles() {
    console.log("Invirtiendo estilos entre zonas claras y oscuras...");
    
    const darkType = document.querySelector('input[name="cellTypeDark"]:checked').value;
    const brightType = document.querySelector('input[name="cellTypeBright"]:checked').value;
    
    const darkChar = char0Input.value;
    const brightChar = char1Input.value;
    
    const darkTextColor = textColor0Input.value;
    const brightTextColor = textColor1Input.value;
    
    let darkIconURL = null;
    let brightIconURL = null;
    
    if (icon0Loaded && icon0Image.src) {
        darkIconURL = icon0Image.src;
    }
    
    if (icon1Loaded && icon1Image.src) {
        brightIconURL = icon1Image.src;
    }
    
    const darkGradient = {
        color1: gradient0Color1Input.value,
        color2: gradient0Color2Input.value,
        direction: gradient0DirectionInput.value
    };
    
    const brightGradient = {
        color1: gradient1Color1Input.value,
        color2: gradient1Color2Input.value,
        direction: gradient1DirectionInput.value
    };
    
    const solidDarkColor = solid0ColorInput.value;
    const solidBrightColor = solid1ColorInput.value;
    
    document.querySelector(`input[name="cellTypeDark"][value="${brightType}"]`).checked = true;
    document.querySelector(`input[name="cellTypeBright"][value="${darkType}"]`).checked = true;
    
    char0Input.value = brightChar;
    char1Input.value = darkChar;
    
    textColor0Input.value = brightTextColor;
    textColor1Input.value = darkTextColor;

    const tempBgColor = backgroundColor0Input.value;
    backgroundColor0Input.value = backgroundColor1Input.value;
    backgroundColor1Input.value = tempBgColor;
    
    gradient0Color1Input.value = brightGradient.color1;
    gradient0Color2Input.value = brightGradient.color2;
    gradient0DirectionInput.value = brightGradient.direction;
    
    gradient1Color1Input.value = darkGradient.color1;
    gradient1Color2Input.value = darkGradient.color2;
    gradient1DirectionInput.value = darkGradient.direction;
    
    solid0ColorInput.value = solidBrightColor;
    solid1ColorInput.value = solidDarkColor;
    
    updateGradientPreviews();
    
    const tempImage = icon0Image;
    icon0Image = icon1Image;
    icon1Image = tempImage;
    
    const tempLoaded = icon0Loaded;
    icon0Loaded = icon1Loaded;
    icon1Loaded = tempLoaded;
    
    setupCellTypeToggle('cellTypeDark', 'character-controls-dark', 'icon-controls-dark', 'gradient-controls-dark', 'solid-controls-dark');
    setupCellTypeToggle('cellTypeBright', 'character-controls-bright', 'icon-controls-bright', 'gradient-controls-bright', 'solid-controls-bright');
    
    if (sourceType === 'image' && imageLoaded) {
        drawProcessedEffect();
    }
    
    console.log("Estilos invertidos correctamente.");
}

invertStylesButton.addEventListener('click', invertCellStyles);

function startRecording() {
        if (mediaRecorder) {
        if (mediaRecorder.state === "recording") {
            try { mediaRecorder.stop(); } catch (e) {}
        }
        mediaRecorder = null;
        recordedChunks = [];
    }
    
    if (canvas.captureStream && typeof MediaRecorder !== 'undefined') {
        console.log("Iniciando grabación del canvas...");
        recordedChunks = [];
        const frameRate = 25;
        let stream;
        try {
            stream = canvas.captureStream(frameRate);
            if (!stream) throw new Error("canvas.captureStream() devolvió null o undefined");
        } catch(e) {
            console.error("Error al obtener stream del canvas:", e);
            alert("No se pudo iniciar la grabación: error al obtener stream del canvas.");
            updateButtonStates();
            return;
        }

                        
        try {
            mediaRecorder.start();
            console.log("MediaRecorder iniciado, estado:", mediaRecorder.state);
            updateButtonStates();          } catch (e) {
            console.error("Error al llamar a mediaRecorder.start():", e);
            alert("No se pudo iniciar la grabación: " + e.message);
            mediaRecorder = null;
            recordedChunks = [];
            updateButtonStates();              return;
        }
    } else {
        alert("Tu navegador no soporta la grabación de canvas (captureStream o MediaRecorder).");
        updateButtonStates();
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        console.log("Deteniendo grabación solicitada...");
        try {
            mediaRecorder.stop();
        } catch(e) {
            console.error("Error llamando a mediaRecorder.stop():", e);
             stopRecordingButton.textContent = "Detener y Descargar";
             stopRecordingButton.disabled = true;
             startRecordingButton.disabled = !(sourceType === 'video' || sourceType === 'webcam') || !isVideoPlaying;
             mediaRecorder = null;
             recordedChunks = [];
        }
    } else {
        console.warn("Se intentó detener grabación pero no estaba activa o ya se había detenido.");
         stopRecordingButton.textContent = "Detener y Descargar";
         stopRecordingButton.disabled = true;
         startRecordingButton.disabled = !(sourceType === 'video' || sourceType === 'webcam') || !isVideoPlaying;
    }
}

startRecordingButton.addEventListener('click', startRecording);
stopRecordingButton.addEventListener('click', stopRecording);

document.getElementById('force-reset').addEventListener('click', function() {
    if (confirm("Are you sure? Doing this will completely reset the app.")) {
                if (previousFileURL) {
            URL.revokeObjectURL(previousFileURL);
        }
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
                window.location.reload();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    updateGradientPreviews();
    updateGridSizeDisplay();
    setupVideoEvents();      updateButtonStates();     setupCellTypeToggle('cellTypeDark', 'character-controls-dark', 'icon-controls-dark', 'gradient-controls-dark', 'solid-controls-dark');
    setupCellTypeToggle('cellTypeBright', 'character-controls-bright', 'icon-controls-bright', 'gradient-controls-bright', 'solid-controls-bright');
    resizeCanvas();
    loadUserPreferences();
    enableLivePreviewForImage();
});

window.addEventListener('beforeunload', () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
         console.warn("Cerrando página con grabación activa. Intentando detener (sin guardar)...");
         try { mediaRecorder.stop(); } catch(e) {}
    }
    stopCurrentSource();
});

function updateButtonStates() {
    if (!sourceType) {
                playButton.disabled = true;
        pauseButton.disabled = true;
        startRecordingButton.disabled = true;
        stopRecordingButton.disabled = true;
        captureFrameLink.style.display = 'none';
        applyButton.disabled = false;
        return;
    }
    
    if (sourceType === 'image') {
                playButton.disabled = true;
        pauseButton.disabled = true;
        startRecordingButton.disabled = true;
        stopRecordingButton.disabled = true;
        captureFrameLink.style.display = imageLoaded ? 'inline-block' : 'none';
        applyButton.disabled = !imageLoaded;
    } 
    else if (sourceType === 'video') {
                const isPlaying = !sourceVideo.paused && !sourceVideo.ended && sourceVideo.readyState > 2;
        const videoReady = sourceVideo.readyState >= 2;
        
                playButton.disabled = isPlaying;
        pauseButton.disabled = !isPlaying;
        applyButton.disabled = true;
        
                captureFrameLink.style.display = videoReady ? 'inline-block' : 'none';
        
        if (mediaRecorder && mediaRecorder.state === "recording") {
            startRecordingButton.disabled = true;
            stopRecordingButton.disabled = false;
        } else {
            startRecordingButton.disabled = !isPlaying;
            stopRecordingButton.disabled = true;
        }
    } 
    else if (sourceType === 'webcam') {
                playButton.disabled = true;
        pauseButton.disabled = true;
        applyButton.disabled = true;
        captureFrameLink.style.display = isVideoPlaying ? 'inline-block' : 'none';
        
        if (mediaRecorder && mediaRecorder.state === "recording") {
            startRecordingButton.disabled = true;
            stopRecordingButton.disabled = false;
        } else {
            startRecordingButton.disabled = !isVideoPlaying;
            stopRecordingButton.disabled = true;
        }
    }
}

function setupVideoEvents() {
        sourceVideo.onplay = null;
    sourceVideo.onpause = null;
    sourceVideo.ontimeupdate = null;
    sourceVideo.onended = null;

        sourceVideo.addEventListener('play', () => {
        console.log(`Evento 'play' detectado en fuente: ${sourceType}`);
        isVideoPlaying = true;
        
                if (sourceType === 'video') {
            videoThumbnail.currentTime = sourceVideo.currentTime;
                        videoThumbnail.playbackRate = 1.0;              videoThumbnail.play().catch(e => console.error("Error reproduciendo miniatura:", e));
        }
        
        startProcessingLoop();
        updateButtonStates();
    });

    sourceVideo.addEventListener('pause', () => {
        console.log(`Evento 'pause' detectado en fuente: ${sourceType}`);
        isVideoPlaying = false;
        
                if (sourceType === 'video') {
            videoThumbnail.pause();
        }
        
        stopProcessingLoop();

        if (mediaRecorder && mediaRecorder.state === "recording") {
            console.log("Fuente pausada, deteniendo grabación...");
            stopRecording();
        }
        
        updateButtonStates();
    });

    sourceVideo.addEventListener('timeupdate', () => {
        if (sourceType === 'video') {
                        videoScrubber.value = sourceVideo.currentTime;
            currentTimeDisplay.textContent = formatTime(sourceVideo.currentTime);
            
                                    if (videoThumbnail.style.display === 'block') {
                const timeDiff = Math.abs(videoThumbnail.currentTime - sourceVideo.currentTime);
                if (timeDiff > 1.0 || (Math.floor(sourceVideo.currentTime) !== Math.floor(videoThumbnail.currentTime))) {
                    videoThumbnail.currentTime = sourceVideo.currentTime;
                }
            }
            
                        if (sourceVideo.paused) {
                drawProcessedEffect();
            }
        }
    });

    sourceVideo.addEventListener('ended', () => {
        console.log("Vídeo finalizado.");
        
                if (loopVideoCheckbox.checked && sourceType === 'video') {
            console.log("Reiniciando vídeo (modo bucle)");
            sourceVideo.currentTime = 0;
            sourceVideo.play()
                .then(() => console.log("Vídeo reiniciado en bucle"))
                .catch(err => console.error("Error al reiniciar vídeo en bucle:", err));
            return;
        }
        
        isVideoPlaying = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        if (mediaRecorder && mediaRecorder.state === "recording") {
            stopRecording();
        }
        
        updateButtonStates();
    });
}

const videoScrubber = document.getElementById('video-scrubber');
const videoTimeline = document.getElementById('video-timeline');
const currentTimeDisplay = document.getElementById('current-time');
const totalTimeDisplay = document.getElementById('total-time');

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

videoScrubber.addEventListener('input', () => {
    if (sourceType === 'video') {
        sourceVideo.currentTime = videoScrubber.value;
        currentTimeDisplay.textContent = formatTime(sourceVideo.currentTime);
        
        if (sourceVideo.paused) {
                        videoThumbnail.currentTime = sourceVideo.currentTime;
                        drawProcessedEffect();
        }
    }
});

document.addEventListener('keydown', function(event) {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT') return;
    
    switch(event.key) {
        case ' ':             if (sourceType === 'video') {
                if (sourceVideo.paused) {
                    playButton.click();
                } else {
                    pauseButton.click();
                }
                event.preventDefault();
            }
            break;
        case 'c':             if (captureFrameLink.style.display !== 'none') {
                captureFrameLink.click();
                event.preventDefault();
            }
            break;
        case 'r':             if (!startRecordingButton.disabled) {
                startRecordingButton.click();
                event.preventDefault();
            } else if (!stopRecordingButton.disabled) {
                stopRecordingButton.click();
                event.preventDefault();
            }
            break;
    }
});

const shortcutInfo = document.createElement('div');
shortcutInfo.className = 'shortcut-info';
shortcutInfo.innerHTML = `
    <h4>KEYBOARD SHORTCUTS</h4>
    <ul>
        <li><strong>Space</strong> - Play/Pause video</li>
        <li><strong>C</strong> - Capture current frame</li>
        <li><strong>R</strong> - Start/Stop recording</li>
    </ul>
`;
document.querySelector('.controls').appendChild(shortcutInfo);

function saveUserPreferences() {
    const preferences = {
        char0: char0Input.value,
        char1: char1Input.value, 
        textColor0: textColor0Input.value,
        textColor1: textColor1Input.value,
        backgroundColor0: backgroundColor0Input.value,
        backgroundColor1: backgroundColor1Input.value,
        bgColor: bgColorInput.value,
        gridSize: gridSizeInput.value,
        threshold: thresholdInput.value,
        cellTypeDark: document.querySelector('input[name="cellTypeDark"]:checked').value,
        cellTypeBright: document.querySelector('input[name="cellTypeBright"]:checked').value,
        solid0Color: solid0ColorInput.value,
        solid1Color: solid1ColorInput.value,
        gradient0Color1: gradient0Color1Input.value,
        gradient0Color2: gradient0Color2Input.value,
        gradient0Direction: gradient0DirectionInput.value,
        gradient1Color1: gradient1Color1Input.value,
        gradient1Color2: gradient1Color2Input.value,
        gradient1Direction: gradient1DirectionInput.value,
        loopVideo: loopVideoCheckbox.checked,
        livePreview: document.getElementById('live-preview')?.checked || false
    };
    
    localStorage.setItem('charismaPreferences', JSON.stringify(preferences));
}

function loadUserPreferences() {
    const savedPrefs = localStorage.getItem('charismaPreferences');
    let prefs = {};
    
    if (savedPrefs) {
        try {
            prefs = JSON.parse(savedPrefs);
        } catch (e) {
            console.error('Error loading preferences:', e);
            prefs = {};
        }
    }
    
    if (prefs.char0) char0Input.value = prefs.char0;
    if (prefs.char1) char1Input.value = prefs.char1;
    if (prefs.textColor0) textColor0Input.value = prefs.textColor0;
    if (prefs.textColor1) textColor1Input.value = prefs.textColor1;
    if (prefs.backgroundColor0) backgroundColor0Input.value = prefs.backgroundColor0;
    if (prefs.backgroundColor1) backgroundColor1Input.value = prefs.backgroundColor1;
    if (prefs.bgColor) bgColorInput.value = prefs.bgColor;
    if (prefs.gridSize) gridSizeInput.value = prefs.gridSize;
    if (prefs.threshold) thresholdInput.value = prefs.threshold;
    if (prefs.cellTypeDark) {
        document.querySelector(`input[name="cellTypeDark"][value="${prefs.cellTypeDark}"]`).checked = true;
    }
    if (prefs.cellTypeBright) {
        document.querySelector(`input[name="cellTypeBright"][value="${prefs.cellTypeBright}"]`).checked = true; 
    }
    if (prefs.solid0Color) solid0ColorInput.value = prefs.solid0Color;
    if (prefs.solid1Color) solid1ColorInput.value = prefs.solid1Color;
    if (prefs.gradient0Color1) gradient0Color1Input.value = prefs.gradient0Color1;
    if (prefs.gradient0Color2) gradient0Color2Input.value = prefs.gradient0Color2;
    if (prefs.gradient0Direction) gradient0DirectionInput.value = prefs.gradient0Direction;
    if (prefs.gradient1Color1) gradient1Color1Input.value = prefs.gradient1Color1;
    if (prefs.gradient1Color2) gradient1Color2Input.value = prefs.gradient1Color2;
    if (prefs.gradient1Direction) gradient1DirectionInput.value = prefs.gradient1Direction;
    
    if (prefs.hasOwnProperty('loopVideo')) {
        loopVideoCheckbox.checked = prefs.loopVideo;
        sourceVideo.loop = prefs.loopVideo;
        videoThumbnail.loop = prefs.loopVideo;
    }

    const livePreviewCheckbox = document.getElementById('live-preview');
    if (livePreviewCheckbox) {
        livePreviewCheckbox.checked = prefs.hasOwnProperty('livePreview') ? prefs.livePreview : true;
    }
    
    updateGradientPreviews();
    setupCellTypeToggle('cellTypeDark', 'character-controls-dark', 'icon-controls-dark', 'gradient-controls-dark', 'solid-controls-dark');
    setupCellTypeToggle('cellTypeBright', 'character-controls-bright', 'icon-controls-bright', 'gradient-controls-bright', 'solid-controls-bright');
    updateGridSizeDisplay();
}

[char0Input, char1Input, textColor0Input, textColor1Input, bgColorInput, 
 backgroundColor0Input, backgroundColor1Input,
 gridSizeInput, thresholdInput, solid0ColorInput, solid1ColorInput,
 gradient0Color1Input, gradient0Color2Input, gradient0DirectionInput,
 gradient1Color1Input, gradient1Color2Input, gradient1DirectionInput,
 loopVideoCheckbox
].forEach(element => {
    element.addEventListener('change', saveUserPreferences);
});

document.querySelectorAll('input[name="cellTypeDark"], input[name="cellTypeBright"]')
    .forEach(radio => radio.addEventListener('change', saveUserPreferences));

function showStatusMessage(message, isError = false) {
    const statusBar = document.getElementById('status-bar') || createStatusBar();
    statusBar.textContent = message;
    statusBar.className = isError ? 'status-bar error' : 'status-bar';
    statusBar.style.opacity = 1;
    
        clearTimeout(statusBar._timeout);
    statusBar._timeout = setTimeout(() => {
        statusBar.style.opacity = 0;
    }, 3000);
}

function createStatusBar() {
    const statusBar = document.createElement('div');
    statusBar.id = 'status-bar';
    statusBar.className = 'status-bar';
    document.body.appendChild(statusBar);
    return statusBar;
}

loopVideoCheckbox.addEventListener('change', () => {
        sourceVideo.loop = loopVideoCheckbox.checked;
    videoThumbnail.loop = loopVideoCheckbox.checked;
    
        if (typeof saveUserPreferences === 'function') {
        saveUserPreferences();
    }
});

function enableLivePreviewForImage() {
    
    if (document.getElementById('live-preview')) {
        
        
        
        return;
    }

    const livePreviewContainer = document.createElement('div');
    livePreviewContainer.className = 'video-controls-option';
    livePreviewContainer.innerHTML = `
        <label for="live-preview" class="loop-control">
            <input type="checkbox" id="live-preview" checked> LIVE PREVIEW
        </label>
    `;
    
    const applyEffectButton = document.getElementById('apply-effect');
    applyEffectButton.parentNode.parentNode.appendChild(livePreviewContainer);
    
    const livePreviewCheckbox = document.getElementById('live-preview');
    
    function updateLivePreview() {
        if (sourceType === 'image' && imageLoaded && livePreviewCheckbox.checked) {
            drawProcessedEffect();
        }
    }
    
    const controlInputs = [
        gridSizeInput, thresholdInput, bgColorInput, 
        char0Input, textColor0Input, char1Input, textColor1Input,
        solid0ColorInput, solid1ColorInput, 
        gradient0Color1Input, gradient0Color2Input, gradient0DirectionInput,
        gradient1Color1Input, gradient1Color2Input, gradient1DirectionInput
    ];
    
    controlInputs.forEach(input => {
        input.addEventListener('input', updateLivePreview);
    });
    
    document.querySelectorAll('input[name="cellTypeDark"], input[name="cellTypeBright"]')
        .forEach(radio => {
            radio.addEventListener('change', () => {
                setTimeout(updateLivePreview, 10);
            });
        });
    
    icon0Input.addEventListener('change', () => {
        if (!icon0Image.onload) {
            icon0Image.onload = updateLivePreview;
        }
    });
    
    icon1Input.addEventListener('change', () => {
        if (!icon1Image.onload) {
            icon1Image.onload = updateLivePreview;
        }
    });
    
    invertStylesButton.addEventListener('click', () => {
        setTimeout(updateLivePreview, 10);
    });
    
    livePreviewCheckbox.addEventListener('change', () => {
        if (livePreviewCheckbox.checked) {
            updateLivePreview();
        }
        
        if (typeof saveUserPreferences === 'function') {
            saveUserPreferences();
        }
    });
    
    livePreviewCheckbox.checked = true;
    
    if (sourceType === 'image' && imageLoaded) {
        updateLivePreview();
    }
}


const tutorialOverlay = document.getElementById('tutorial-overlay');
const tutorialPopover = document.getElementById('tutorial-popover');
const tutorialContent = document.getElementById('tutorial-content');
const tutorialPrevBtn = document.getElementById('tutorial-prev');
const tutorialNextBtn = document.getElementById('tutorial-next');
const tutorialSkipBtn = document.getElementById('tutorial-skip');
const showTutorialButton = document.getElementById('show-tutorial-button');

const tutorialSteps = [
    {
        element: '.controls .step-accordion:nth-of-type(1)', 
        title: 'Step 1: Select Source',
        text: 'Welcome to CHAR/ISMA! Start by uploading an image or video, or use your webcam. This will be the source for your artwork.',
        position: 'right' 
    },
    {
        element: '.controls .step-accordion:nth-of-type(2)', 
        title: 'Step 2: Adjust Grid',
        text: 'Next, define the grid. "Grid Resolution" controls how many cells your artwork will have. "Light/Dark Threshold" determines what\'s considered a light or dark area.',
        position: 'right'
    },
    {
        element: '.controls .step-accordion:nth-of-type(3)', 
        title: 'Step 3: Design Style',
        text: 'This is where the magic happens! Customize how dark and light areas are represented. You can use characters, upload custom icons, create gradients, or use solid colors.',
        position: 'right'
    },
    {
        element: '.controls .step-accordion:nth-of-type(3) #invert-cell-styles', 
        title: 'Swap Styles',
        text: 'Quickly swap the styles you\'ve defined for dark and light areas with this button.',
        position: 'bottom'
    },
    {
        element: '.controls .step-accordion:nth-of-type(4)', 
        title: 'Step 4: Preview & Process',
        text: 'For images, click "Apply Effect" to see your changes. For videos, controls for play/pause will appear here once a video is loaded. Live preview is on for images by default.',
        position: 'right'
    },
    {
        element: '.controls .step-accordion:nth-of-type(5)', 
        title: 'Step 5: Export & Share',
        text: 'Once you\'re happy, capture the current frame as a high-resolution image or record your processed video.',
        position: 'right'
    },
    {
        element: '#show-tutorial-button', 
        title: 'Revisit Tutorial',
        text: 'You can always click this button to see the tutorial again. Enjoy creating with CHAR/ISMA!',
        position: 'top'
    }
];

let currentTutorialStep = 0;
let highlightedElement = null;

function positionPopover(elementRect) {
    const popoverRect = tutorialPopover.getBoundingClientRect();
    const step = tutorialSteps[currentTutorialStep];
    const controlsPanel = document.querySelector('.controls');
    const targetElement = document.querySelector(step.element);
    
    // Always position relative to the controls panel
    let top = elementRect.top;
    let left = controlsPanel.offsetWidth + 15; // 15px padding from controls panel

    // Adjust if popover goes too far down
    if (top + popoverRect.height > window.innerHeight - 10) {
        top = window.innerHeight - popoverRect.height - 10;
    }
    // Adjust if popover tries to go above the viewport
    if (top < 10) {
        top = 10;
    }

    // If popover goes off-screen to the right, position it to the left of the controls
    if (left + popoverRect.width > window.innerWidth - 10) {
        left = controlsPanel.offsetLeft - popoverRect.width - 15;
    }

    tutorialPopover.style.top = `${top}px`;
    tutorialPopover.style.left = `${left}px`;
}


function showTutorialStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= tutorialSteps.length) {
        endTutorial();
        return;
    }
    currentTutorialStep = stepIndex;
    const step = tutorialSteps[stepIndex];

    if (highlightedElement) {
        highlightedElement.classList.remove('tutorial-highlight');
        if (highlightedElement.tagName === 'DETAILS') {
            highlightedElement.open = false; 
        }
    }
    
    const elementToHighlight = document.querySelector(step.element);

    if (elementToHighlight) {
        highlightedElement = elementToHighlight;
        highlightedElement.classList.add('tutorial-highlight');
        
        if (highlightedElement.tagName === 'DETAILS') {
            highlightedElement.open = true; 
        }
        
        elementToHighlight.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        
        
        setTimeout(() => {
            const rect = elementToHighlight.getBoundingClientRect();
            positionPopover(rect);
        }, 300); 
        
    } else {
        
        const dummyRect = { top: window.innerHeight/2, left: window.innerWidth/2, width:0, height:0, right: window.innerWidth/2, bottom: window.innerHeight/2 };
        positionPopover(dummyRect);
    }
    
    tutorialContent.innerHTML = `<h3>${step.title}</h3><p>${step.text}</p>`;
    tutorialPrevBtn.disabled = stepIndex === 0;
    tutorialNextBtn.textContent = stepIndex === tutorialSteps.length - 1 ? 'FINISH' : 'NEXT';
    
    tutorialOverlay.style.display = 'flex';
}

function startTutorial() {
    tutorialOverlay.style.display = 'flex';
    currentTutorialStep = 0;
    showTutorialStep(currentTutorialStep);
    
    const controlsPanel = document.querySelector('.controls');
    if (controlsPanel && tutorialSteps[0].element.startsWith('.controls')) {
        controlsPanel.scrollTop = 0;
    }
}

function endTutorial() {
    tutorialOverlay.style.display = 'none';
    if (highlightedElement) {
        highlightedElement.classList.remove('tutorial-highlight');
        if (highlightedElement.tagName === 'DETAILS' && highlightedElement.open) {
             
        }
    }
    highlightedElement = null;
    localStorage.setItem('charismaTutorialSeen', 'true');
}

tutorialNextBtn.addEventListener('click', () => {
    showTutorialStep(currentTutorialStep + 1);
});

tutorialPrevBtn.addEventListener('click', () => {
    showTutorialStep(currentTutorialStep - 1);
});

tutorialSkipBtn.addEventListener('click', endTutorial);
showTutorialButton.addEventListener('click', startTutorial);


document.addEventListener('DOMContentLoaded', () => {
    
    updateGradientPreviews();
    updateGridSizeDisplay();
    setupVideoEvents();      
    updateButtonStates();     
    setupCellTypeToggle('cellTypeDark', 'character-controls-dark', 'icon-controls-dark', 'gradient-controls-dark', 'solid-controls-dark');
    setupCellTypeToggle('cellTypeBright', 'character-controls-bright', 'icon-controls-bright', 'gradient-controls-bright', 'solid-controls-bright');
    resizeCanvas();
    loadUserPreferences();
    enableLivePreviewForImage(); 

    
    if (localStorage.getItem('charismaTutorialSeen') !== 'true') {
        
        setTimeout(startTutorial, 500);
    }

    
    const tooltipContainer = document.getElementById('tooltip-container');
    const tooltipTriggers = document.querySelectorAll('.tooltip-trigger');

    tooltipTriggers.forEach(trigger => {
        trigger.addEventListener('mouseover', (event) => {
            const tooltipText = trigger.dataset.tooltipText;
            if (!tooltipText) return;

            tooltipContainer.innerHTML = tooltipText;
            tooltipContainer.style.display = 'block';

            const triggerRect = trigger.getBoundingClientRect();
            const containerRect = tooltipContainer.getBoundingClientRect();
            
            let top = triggerRect.bottom + 5; 
            let left = triggerRect.left + (triggerRect.width / 2) - (containerRect.width / 2); 

            
            if (left < 0) {
                left = 5;
            }
            if (left + containerRect.width > window.innerWidth) {
                left = window.innerWidth - containerRect.width - 5;
            }
            if (top + containerRect.height > window.innerHeight) {
                top = triggerRect.top - containerRect.height - 5; 
            }
            
            tooltipContainer.style.top = `${top + window.scrollY}px`;
            tooltipContainer.style.left = `${left + window.scrollX}px`;
        });

        trigger.addEventListener('mouseout', () => {
            tooltipContainer.style.display = 'none';
        });
        
        
        trigger.addEventListener('click', (event) => {
            event.preventDefault(); 
            const tooltipText = trigger.dataset.tooltipText;
            if (!tooltipText) return;

            if (tooltipContainer.style.display === 'block' && tooltipContainer.innerHTML === tooltipText) {
                 tooltipContainer.style.display = 'none';
                 return;
            }

            tooltipContainer.innerHTML = tooltipText;
            tooltipContainer.style.display = 'block';

            const triggerRect = trigger.getBoundingClientRect();
            const containerRect = tooltipContainer.getBoundingClientRect();
            let top = triggerRect.bottom + 8;
            let left = triggerRect.left + (triggerRect.width / 2) - (containerRect.width / 2);

            if (left < 0) left = 5;
            if (left + containerRect.width > window.innerWidth) left = window.innerWidth - containerRect.width - 5;
            if (top + containerRect.height > window.innerHeight) top = triggerRect.top - containerRect.height - 8;
            
            tooltipContainer.style.top = `${top + window.scrollY}px`;
            tooltipContainer.style.left = `${left + window.scrollX}px`;
        });
    });
    
    
    document.addEventListener('click', function(event) {
        let targetElement = event.target;
        let isTooltipTrigger = false;
        while (targetElement) {
            if (targetElement.classList && targetElement.classList.contains('tooltip-trigger')) {
                isTooltipTrigger = true;
                break;
            }
            targetElement = targetElement.parentElement;
        }

        if (!isTooltipTrigger && tooltipContainer.style.display === 'block') {
            tooltipContainer.style.display = 'none';
        }
    });

});