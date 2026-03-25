// ─── Global state ────────────────────────────────────────────────────────────
let currentEnhancedBlob = null;
let currentTTSBlob = null;
let currentBgRemovedBlob = null;
let currentConvertedBlobs = [];
let currentGifBlob = null;
let ttsUtterance = null;
let audioChunks = [];
let mediaRecorder = null;

// Set pdf.js worker path
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}
// ─────────────────────────────────────────────────────────────────────────────

function openTool(toolName) {
    trackToolUse(toolName);
    if (typeof gtag === 'function') {
        gtag('event', 'page_view', { page_title: toolName, page_path: '/#' + toolName });
    }
    const modal = document.getElementById('toolModal');
    const modalBody = document.getElementById('modalBody');
    
    // Tool-specific content
    const toolContent = {
        'image-enhancer': `
            <h2>🖼️ AI Image Enhancer</h2>
            <div class="tool-interface">
                <div class="upload-area" id="uploadArea">
                    <p>🖼️ Drop your image here or click to upload</p>
                    <input type="file" id="imageInput" accept="image/*" style="display: none;">
                    <button class="btn btn-primary" onclick="document.getElementById('imageInput').click()">Choose Image</button>
                </div>
                <div id="preview" style="margin-top: 2rem; display: none;">
                    <img id="previewImage" style="max-width: 100%; border-radius: 8px;">
                    <div style="margin-top: 1rem;">
                        <label>Upscale &amp; Enhancement Strength: <span id="enhanceLevelVal">2x</span></label>
                        <input type="range" min="1" max="4" value="2" id="enhanceLevel" style="width: 100%;"
                            oninput="document.getElementById('enhanceLevelVal').textContent=this.value+'x'">
                        <button class="btn btn-primary" onclick="enhanceImage()" style="margin-top:0.75rem; width:100%;">Enhance &amp; Upscale Image</button>
                    </div>
                </div>
                <div id="result" style="margin-top: 2rem; display: none;">
                    <p style="color: #10B981; font-weight: 600;">✓ Image enhanced successfully!</p>
                    <img id="enhancedPreview" style="max-width: 100%; border-radius: 8px; margin-bottom: 1rem;">
                    <button class="btn btn-primary" onclick="downloadResult()" style="width:100%;">⬇ Download Enhanced Image</button>
                </div>
            </div>
        `,
        'text-to-speech': `
            <h2>🔊 Text to Speech AI</h2>
            <div class="tool-interface">
                <textarea id="ttsText" placeholder="Enter your text here..." 
                    style="width: 100%; min-height: 150px; padding: 1rem; border: 2px solid #E5E7EB; border-radius: 8px; font-size: 1rem;"></textarea>
                <div style="margin-top: 1rem;">
                    <label>Voice:</label>
                    <select id="voice" style="width: 100%; padding: 0.75rem; border: 2px solid #E5E7EB; border-radius: 8px; margin-top: 0.5rem;">
                        <option>English (US) - Female</option>
                        <option>English (US) - Male</option>
                        <option>English (UK) - Female</option>
                        <option>English (UK) - Male</option>
                        <option>Spanish - Female</option>
                        <option>French - Female</option>
                        <option>German - Male</option>
                        <option>Japanese - Female</option>
                    </select>
                </div>
                <div style="margin-top: 1rem;">
                    <label>Speed: <span id="speedValue">1.0x</span></label>
                    <input type="range" min="0.5" max="2" step="0.1" value="1" id="speed" 
                        style="width: 100%;" onchange="document.getElementById('speedValue').textContent = this.value + 'x'">
                </div>
                <button class="btn btn-primary" onclick="generateSpeech()" style="margin-top: 1rem; width: 100%;">▶ Speak &amp; Generate Audio</button>
                <p id="ttsStatus" style="display:none; margin-top:0.75rem; font-weight:600; color:#6366F1;"></p>
                <div id="audioResult" style="margin-top: 1rem; display: none;">
                    <audio controls style="width: 100%;"></audio>
                    <button class="btn btn-primary" onclick="downloadAudio()" style="margin-top: 1rem; width: 100%;">⬇ Download Audio</button>
                </div>
            </div>
        `,
        'pdf-converter': `
            <h2>📄 PDF Converter</h2>
            <div class="tool-interface">
                <p style="color:#6B7280; font-size:0.9rem; margin-bottom:1rem;">✅ Supported: <strong>Image → PDF</strong>, <strong>PDF → Image</strong>, <strong>PDF → Text</strong>, <strong>Text → PDF</strong></p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <label>Convert From:</label>
                        <select id="fromFormat" style="width: 100%; padding: 0.75rem; border: 2px solid #E5E7EB; border-radius: 8px; margin-top: 0.5rem;" onchange="updatePdfToOptions()">
                            <option>Image (JPG/PNG)</option>
                            <option>PDF</option>
                            <option>Text / Other</option>
                        </select>
                    </div>
                    <div>
                        <label>Convert To:</label>
                        <select id="toFormat" style="width: 100%; padding: 0.75rem; border: 2px solid #E5E7EB; border-radius: 8px; margin-top: 0.5rem;">
                            <option>PDF</option>
                        </select>
                    </div>
                </div>
                <div class="upload-area" id="pdfUploadArea">
                    <p>📄 Drop your file here or click to upload</p>
                    <input type="file" id="pdfInput" style="display: none;">
                    <button class="btn btn-primary" onclick="document.getElementById('pdfInput').click()">Choose File</button>
                </div>
                <p id="pdfFileName" style="margin-top:0.5rem; color:#6B7280; font-size:0.9rem;"></p>
                <button id="convertPDFBtn" class="btn btn-primary" onclick="convertPDF()" style="margin-top:1rem; width:100%;">🔄 Convert File</button>
                <div id="conversionResult" style="margin-top: 2rem; display: none;">
                    <p style="color: #10B981; font-weight: 600;">✓ File converted &amp; downloaded!</p>
                </div>
            </div>
        `,
        'qr-generator': `
            <h2>📱 QR Code Generator</h2>
            <div class="tool-interface">
                <div>
                    <label>Type:</label>
                    <select id="qrType" style="width: 100%; padding: 0.75rem; border: 2px solid #E5E7EB; border-radius: 8px; margin-top: 0.5rem;">
                        <option>URL</option>
                        <option>Text</option>
                        <option>Email</option>
                        <option>Phone</option>
                        <option>WiFi</option>
                        <option>vCard</option>
                    </select>
                </div>
                <div style="margin-top: 1rem;">
                    <label>Content:</label>
                    <input type="text" id="qrContent" placeholder="Enter URL, text, or data..." 
                        style="width: 100%; padding: 0.75rem; border: 2px solid #E5E7EB; border-radius: 8px; margin-top: 0.5rem; box-sizing: border-box;">
                </div>
                <div style="margin-top: 1rem;">
                    <label>Size:</label>
                    <select id="qrSize" style="width: 100%; padding: 0.75rem; border: 2px solid #E5E7EB; border-radius: 8px; margin-top: 0.5rem;">
                        <option>256x256</option>
                        <option>512x512</option>
                        <option>1024x1024</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="generateQR()" style="margin-top: 1rem; width: 100%;">Generate QR Code</button>
                <div id="qrResult" style="margin-top: 2rem; display: none; text-align: center;">
                    <div style="display: inline-block; padding: 1.5rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <div id="qrPreview"></div>
                    </div>
                    <br>
                    <button class="btn btn-primary" onclick="downloadQR()" style="margin-top: 1rem;">⬇ Download QR Code</button>
                </div>
            </div>
        `,
        'bg-remover': `
            <h2>✂️ Background Remover</h2>
            <div class="tool-interface">
                <p style="color:#6B7280; font-size:0.9rem; margin-bottom:1rem;">🤖 Powered by AI — works on people, products, and complex backgrounds. First run downloads the model (~10MB) and caches it.</p>
                <div class="upload-area" id="bgUploadArea">
                    <p>✂️ Drop your image here or click to upload</p>
                    <input type="file" id="bgInput" accept="image/*" style="display: none;">
                    <button class="btn btn-primary" onclick="document.getElementById('bgInput').click()">Choose Image</button>
                </div>
                <div id="bgPreview" style="margin-top: 2rem; display: none;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <h4>Original</h4>
                            <img id="bgOriginal" style="max-width: 100%; border-radius: 8px;">
                        </div>
                        <div>
                            <h4>Result</h4>
                            <img id="bgRemoved" style="max-width: 100%; border-radius: 8px; background: repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 0 0/16px 16px;">
                        </div>
                    </div>
                    <button id="bgRemoveBtn" class="btn btn-primary" onclick="processBackground()" style="margin-top: 1rem; width: 100%;">✂️ Remove Background</button>
                    <div id="bgStatus" style="display:none; margin-top:0.75rem; padding:0.75rem 1rem; background:#EEF2FF; border-radius:8px;">
                        <p id="bgStatusText" style="margin:0; color:#6366F1; font-weight:600; font-size:0.9rem;"></p>
                        <div style="margin-top:0.5rem; height:6px; background:#C7D2FE; border-radius:3px; overflow:hidden;">
                            <div id="bgProgressBar" style="height:100%; width:0%; background:#6366F1; transition:width 0.3s;"></div>
                        </div>
                    </div>
                </div>
                <div id="bgResult" style="margin-top: 1rem; display: none;">
                    <p style="color: #10B981; font-weight: 600;">✓ Background removed!</p>
                    <button class="btn btn-primary" onclick="downloadBgRemoved()" style="width:100%;">⬇ Download PNG (transparent)</button>
                </div>
            </div>
        `,
        'image-converter': `
            <h2>🔄 Image Format Converter</h2>
            <div class="tool-interface">
                <div>
                    <label>Convert To:</label>
                    <select id="targetFormat" style="width: 100%; padding: 0.75rem; border: 2px solid #E5E7EB; border-radius: 8px; margin-top: 0.5rem;">
                        <option>JPG</option>
                        <option>PNG</option>
                        <option>WebP</option>
                        <option>BMP</option>
                    </select>
                </div>
                <div class="upload-area" id="imgUploadArea" style="margin-top: 1rem;">
                    <p>🔄 Drop images here or click to upload (multiple supported)</p>
                    <input type="file" id="imgInput" accept="image/*" multiple style="display: none;">
                    <button class="btn btn-primary" onclick="document.getElementById('imgInput').click()">Choose Images</button>
                </div>
                <p id="imgFileList" style="margin-top:0.5rem; color:#6B7280; font-size:0.9rem;"></p>
                <button id="convertImagesBtn" class="btn btn-primary" onclick="convertImages()" style="margin-top:1rem; width:100%;">🔄 Convert Images</button>
                <div id="imgResult" style="margin-top: 2rem; display: none;">
                    <p style="color: #10B981; font-weight: 600;">✓ <span id="convertedCount"></span></p>
                    <button class="btn btn-primary" onclick="downloadConverted()" style="width:100%;">⬇ Download All</button>
                </div>
            </div>
        `,
        'video-to-gif': `
            <h2>🎬 Video to GIF Converter</h2>
            <div class="tool-interface">
                <div class="upload-area" id="videoUploadArea">
                    <p>🎬 Drop your video here or click to upload</p>
                    <input type="file" id="videoInput" accept="video/*" style="display: none;">
                    <button class="btn btn-primary" onclick="document.getElementById('videoInput').click()">Choose Video</button>
                </div>
                <div id="videoPreview" style="margin-top: 2rem; display: none;">
                    <video id="videoElement" controls style="max-width: 100%; border-radius: 8px;"></video>
                    <div style="margin-top: 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <label>Start Time (seconds):</label>
                            <input type="number" id="startTime" value="0" min="0" 
                                style="width: 100%; padding: 0.75rem; border: 2px solid #E5E7EB; border-radius: 8px; margin-top: 0.5rem;">
                        </div>
                        <div>
                            <label>Duration (seconds, max 10):</label>
                            <input type="number" id="duration" value="3" min="1" max="10" 
                                style="width: 100%; padding: 0.75rem; border: 2px solid #E5E7EB; border-radius: 8px; margin-top: 0.5rem;">
                        </div>
                    </div>
                    <div style="margin-top: 1rem;">
                        <label>Quality:</label>
                        <select id="gifQuality" style="width: 100%; padding: 0.75rem; border: 2px solid #E5E7EB; border-radius: 8px; margin-top: 0.5rem;">
                            <option>High (larger file)</option>
                            <option>Medium</option>
                            <option>Low (smaller file)</option>
                        </select>
                    </div>
                    <button id="convertGifBtn" class="btn btn-primary" onclick="convertToGif()" style="margin-top: 1rem; width: 100%;">🎬 Convert to GIF</button>
                    <div id="gifProgress" style="display:none; margin-top:1rem; padding:1rem; background:#f3f4f6; border-radius:8px;">
                        <p id="gifProgressText" style="margin:0; color:#6366F1; font-weight:600;">Starting…</p>
                    </div>
                </div>
                <div id="gifResult" style="margin-top: 2rem; display: none;">
                    <p style="color: #10B981; font-weight: 600;">✓ GIF created successfully!</p>
                    <img id="gifPreview" style="max-width: 100%; border-radius: 8px; margin-top: 1rem;">
                    <button class="btn btn-primary" onclick="downloadGif()" style="margin-top: 1rem; width: 100%;">⬇ Download GIF</button>
                </div>
            </div>
        `
    };
    
    modalBody.innerHTML = toolContent[toolName] || '<p>Tool coming soon!</p>';
    modal.classList.add('active');
    
    // Initialize file input listeners
    initializeFileUploads();
}

function closeModal() {
    const modal = document.getElementById('toolModal');
    modal.classList.remove('active');
}

function initializeFileUploads() {
    // Image enhancer
    const imageInput = document.getElementById('imageInput');
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('previewImage').src = e.target.result;
                    document.getElementById('preview').style.display = 'block';
                    document.getElementById('result').style.display = 'none';
                    currentEnhancedBlob = null;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Background remover
    const bgInput = document.getElementById('bgInput');
    if (bgInput) {
        bgInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    document.getElementById('bgOriginal').src = ev.target.result;
                    document.getElementById('bgPreview').style.display = 'block';
                    document.getElementById('bgResult').style.display = 'none';
                    currentBgRemovedBlob = null;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Image converter
    const imgInput = document.getElementById('imgInput');
    if (imgInput) {
        imgInput.addEventListener('change', function(e) {
            const files = e.target.files;
            if (files.length > 0) {
                const names = Array.from(files).map(f => f.name).join(', ');
                document.getElementById('imgFileList').textContent = `Selected: ${names}`;
                document.getElementById('imgResult').style.display = 'none';
                currentConvertedBlobs = [];
            }
        });
    }

    // Video to GIF
    const videoInput = document.getElementById('videoInput');
    if (videoInput) {
        videoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const url = URL.createObjectURL(file);
                const vid = document.getElementById('videoElement');
                vid.src = url;
                document.getElementById('videoPreview').style.display = 'block';
                document.getElementById('gifResult').style.display = 'none';
            }
        });
    }

    // PDF converter
    const pdfInput = document.getElementById('pdfInput');
    if (pdfInput) {
        pdfInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                document.getElementById('pdfFileName').textContent = `Selected: ${file.name}`;
                document.getElementById('conversionResult').style.display = 'none';
            }
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE ENHANCER — Canvas-based sharpening, brightness, contrast + real download
// ═══════════════════════════════════════════════════════════════════════════════
function enhanceImage() {
    const img = document.getElementById('previewImage');
    if (!img.src || img.src === window.location.href) {
        alert('Please upload an image first!');
        return;
    }
    const level = parseInt(document.getElementById('enhanceLevel').value);
    const btn = document.querySelector('#preview .btn-primary');
    btn.textContent = 'Enhancing…';
    btn.disabled = true;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const image = new Image();
    image.onload = function() {
        // Upscale based on level
        const scale = level;
        canvas.width = image.naturalWidth * scale;
        canvas.height = image.naturalHeight * scale;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Apply sharpening convolution kernel
        applySharpening(ctx, canvas.width, canvas.height, level);

        // Apply brightness/contrast boost
        applyBrightnessContrast(ctx, canvas.width, canvas.height, 10, 20);

        canvas.toBlob(function(blob) {
            currentEnhancedBlob = blob;
            const url = URL.createObjectURL(blob);
            // Show enhanced preview
            const resultImg = document.getElementById('enhancedPreview');
            if (resultImg) resultImg.src = url;
            document.getElementById('result').style.display = 'block';
            btn.textContent = 'Enhance Image';
            btn.disabled = false;
        }, 'image/png');
    };
    image.src = img.src;
}

function applySharpening(ctx, width, height, level) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const strength = 0.3 * level;
    // Unsharp mask kernel
    const kernel = [
        0, -strength, 0,
        -strength, 1 + 4 * strength, -strength,
        0, -strength, 0
    ];
    const copy = new Uint8ClampedArray(data);
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            for (let c = 0; c < 3; c++) {
                const i = (y * width + x) * 4 + c;
                let val = 0;
                val += kernel[0] * copy[((y-1)*width+(x-1))*4+c];
                val += kernel[1] * copy[((y-1)*width+x)*4+c];
                val += kernel[2] * copy[((y-1)*width+(x+1))*4+c];
                val += kernel[3] * copy[(y*width+(x-1))*4+c];
                val += kernel[4] * copy[(y*width+x)*4+c];
                val += kernel[5] * copy[(y*width+(x+1))*4+c];
                val += kernel[6] * copy[((y+1)*width+(x-1))*4+c];
                val += kernel[7] * copy[((y+1)*width+x)*4+c];
                val += kernel[8] * copy[((y+1)*width+(x+1))*4+c];
                data[i] = Math.min(255, Math.max(0, val));
            }
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

function applyBrightnessContrast(ctx, width, height, brightness, contrast) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    for (let i = 0; i < data.length; i += 4) {
        for (let c = 0; c < 3; c++) {
            data[i+c] = Math.min(255, Math.max(0, factor * (data[i+c] - 128) + 128 + brightness));
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

function downloadResult() {
    if (!currentEnhancedBlob) {
        alert('Please enhance an image first!');
        return;
    }
    triggerDownload(currentEnhancedBlob, 'enhanced-image.png');
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEXT TO SPEECH — Web Speech API with audio capture for download
// ═══════════════════════════════════════════════════════════════════════════════
function generateSpeech() {
    const text = document.getElementById('ttsText').value.trim();
    if (!text) {
        alert('Please enter some text first!');
        return;
    }

    const voiceSelect = document.getElementById('voice').value;
    const speed = parseFloat(document.getElementById('speed').value);
    const btn = document.querySelector('#modalBody .btn-primary');

    // Stop any previous speech
    window.speechSynthesis.cancel();
    currentTTSBlob = null;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed;

    // Match selected voice: accent-normalised gender scoring + quality ranking
    const voices = window.speechSynthesis.getVoices();
    const langMap = {
        'English (US) - Female': { lang: 'en-US', gender: 'female' },
        'English (US) - Male':   { lang: 'en-US', gender: 'male' },
        'English (UK) - Female': { lang: 'en-GB', gender: 'female' },
        'English (UK) - Male':   { lang: 'en-GB', gender: 'male' },
        'Spanish - Female':      { lang: 'es',    gender: 'female' },
        'French - Female':       { lang: 'fr',    gender: 'female' },
        'German - Male':         { lang: 'de',    gender: 'male' },
        'Japanese - Female':     { lang: 'ja',    gender: 'female' }
    };
    const deaccent = s => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const femaleNames = ['female','woman','girl','zira','hazel','susan','karen',
        'victoria','samantha','moira','fiona','nicky','aria','jenny','sara','jane',
        'siri','cortana','elvira','lucia','helena','laura','isabel','carmen',
        'paloma','pilar','raquel','lola','mia','rosa','sofia','julia','silvia',
        'beatriz','esther','nuria','ines','monica','paulina','sabina','camila',
        'conchita','amelie','hortense','anna','lekha','mei-jia','sin-ji','kyoko',
        'mizuki','yuna','heami','naayf','zeynep','filiz','yelda',
        'ivy','joanna','kendra','kimberly','salli','nicole','emma','amy',
        'olivia','kate','tessa','naja','helle','ioana','haruka','ayumi','nanami'];
    const maleNames = ['male','man','guy','david','mark','george','rishi',
        'daniel','james','alex','tom','fred','junior','jorge','enrique','diego',
        'pablo','carlos','antonio','miguel','thomas','otto','yannick','luca',
        'takeshi','ichiro','kangkang','zhiwei','huihui','matthew','brian','joey'];

    const target = langMap[voiceSelect];
    if (target) {
        utterance.lang = target.lang;
        const langMatch = v => target.lang.includes('-')
            ? v.lang === target.lang
            : v.lang.startsWith(target.lang);
        const wantFemale = target.gender === 'female';
        const seekNames = wantFemale ? femaleNames : maleNames;
        const avoidNames = wantFemale ? maleNames : femaleNames;
        const langVoices = voices.filter(v => langMatch(v));
        // Score: gender (0=match,1=unknown,2=wrong) × 4  +  quality (0=neural/premium,1=normal)
        const scored = langVoices.map(v => {
            const n = deaccent(v.name);
            const quality = /neural|premium|natural|enhanced/i.test(v.name) ? 0 : 1;
            const genderScore = seekNames.some(k => n.includes(deaccent(k))) ? 0
                              : avoidNames.some(k => n.includes(deaccent(k))) ? 2 : 1;
            return { voice: v, score: genderScore * 4 + quality };
        });
        scored.sort((a, b) => a.score - b.score);
        if (scored.length > 0) utterance.voice = scored[0].voice;
    }

    utterance.onstart = () => {
        document.getElementById('ttsStatus').textContent = '🔊 Speaking…';
        document.getElementById('ttsStatus').style.display = 'block';
    };

    utterance.onend = () => {
        document.getElementById('ttsStatus').textContent = '✓ Done! Use your browser\'s audio or download below.';
        document.getElementById('ttsStatus').style.color = '#10B981';
        // Show a download button that re-speaks and offers a note
        document.getElementById('audioResult').style.display = 'block';
        // Encode to WAV via AudioContext if available
        encodeTextToAudio(text, utterance.voice, speed);
    };

    utterance.onerror = (e) => {
        document.getElementById('ttsStatus').textContent = 'Error: ' + e.error;
    };

    window.speechSynthesis.speak(utterance);
}

function encodeTextToAudio(text, voice, rate) {
    // We replay the speech into a MediaStream via AudioContext to capture it
    // as a downloadable file. This is the standard browser-native approach.
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const dest = ctx.createMediaStreamDestination();
        const recorder = new MediaRecorder(dest.stream);
        const chunks = [];

        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
            currentTTSBlob = new Blob(chunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(currentTTSBlob);
            const audioEl = document.querySelector('#audioResult audio');
            if (audioEl) audioEl.src = url;
        };

        recorder.start();
        const utter2 = new SpeechSynthesisUtterance(text);
        utter2.rate = rate;
        if (voice) utter2.voice = voice;
        utter2.onend = () => { setTimeout(() => recorder.stop(), 300); ctx.close(); };
        window.speechSynthesis.speak(utter2);
    } catch(e) {
        // AudioContext capture not supported — still let them play in browser
        console.warn('Audio capture unavailable:', e);
    }
}

function downloadAudio() {
    if (currentTTSBlob) {
        triggerDownload(currentTTSBlob, 'speech.webm');
    } else {
        // Fallback: re-speak
        alert('Please generate speech first, then wait for it to finish before downloading.');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// QR CODE GENERATOR — qrcode.js library (real scannable QR codes)
// ═══════════════════════════════════════════════════════════════════════════════
function generateQR() {
    const content = document.getElementById('qrContent').value.trim();
    if (!content) {
        alert('Please enter content first!');
        return;
    }
    const sizeVal = document.getElementById('qrSize').value;
    const size = parseInt(sizeVal.split('x')[0]);
    const qrType = document.getElementById('qrType').value;

    let qrData = content;
    if (qrType === 'Email') qrData = `mailto:${content}`;
    else if (qrType === 'Phone') qrData = `tel:${content}`;
    else if (qrType === 'WiFi') qrData = `WIFI:T:WPA;S:${content};P:;;`;

    const container = document.getElementById('qrPreview');
    container.innerHTML = '';

    if (typeof QRCode === 'undefined') {
        alert('QR library not loaded. Please refresh the page.');
        return;
    }

    new QRCode(container, {
        text: qrData,
        width: Math.min(size, 512),
        height: Math.min(size, 512),
        correctLevel: QRCode.CorrectLevel.H
    });

    document.getElementById('qrResult').style.display = 'block';
}

function downloadQR() {
    const canvas = document.querySelector('#qrPreview canvas');
    const img = document.querySelector('#qrPreview img');
    if (canvas) {
        canvas.toBlob(blob => triggerDownload(blob, 'qrcode.png'));
    } else if (img) {
        fetch(img.src).then(r => r.blob()).then(blob => triggerDownload(blob, 'qrcode.png'));
    } else {
        alert('Please generate a QR code first!');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BACKGROUND REMOVER — @xenova/transformers + RMBG-1.4 (ONNX, fully in-browser)
// ═══════════════════════════════════════════════════════════════════════════════
const TRANSFORMERS_CDN = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

async function processBackground() {
    const bgInput = document.getElementById('bgInput');
    if (!bgInput.files[0]) {
        alert('Please upload an image first!');
        return;
    }
    const btn = document.getElementById('bgRemoveBtn');
    const statusBox = document.getElementById('bgStatus');
    const statusText = document.getElementById('bgStatusText');
    const progressBar = document.getElementById('bgProgressBar');

    btn.disabled = true;
    statusBox.style.display = 'block';
    statusText.textContent = '⏳ Loading AI model… (first run ~44MB, instant on repeat visits)';
    progressBar.style.width = '0%';
    document.getElementById('bgResult').style.display = 'none';
    currentBgRemovedBlob = null;

    const file = bgInput.files[0];

    try {
        const { AutoModel, AutoProcessor, RawImage, env } = await import(TRANSFORMERS_CDN);
        env.allowRemoteModels = true;
        env.allowLocalModels = false;

        progressBar.style.width = '10%';
        const onProgress = (p) => {
            if (p.status === 'downloading') {
                const pct = Math.min(65, 10 + Math.round((p.loaded / (p.total || p.loaded * 2)) * 55));
                progressBar.style.width = pct + '%';
                statusText.textContent = `⬇ Downloading AI model: ${(p.loaded / 1048576).toFixed(1)}MB…`;
            } else if (p.status === 'loading') {
                progressBar.style.width = '70%';
                statusText.textContent = '⚙ Initialising AI…';
            }
        };

        const [model, processor] = await Promise.all([
            AutoModel.from_pretrained('briaai/RMBG-1.4', {
                config: { model_type: 'custom' },
                quantized: true,
                progress_callback: onProgress
            }),
            AutoProcessor.from_pretrained('briaai/RMBG-1.4', {
                config: {
                    do_normalize: true, do_pad: false, do_rescale: true, do_resize: true,
                    image_mean: [0.5, 0.5, 0.5], image_std: [1, 1, 1],
                    resample: 2, rescale_factor: 0.00392156862745098,
                    size: { width: 1024, height: 1024 }
                }
            })
        ]);

        statusText.textContent = '🤖 Running AI segmentation…';
        progressBar.style.width = '75%';

        const imageURL = URL.createObjectURL(file);
        const image = await RawImage.fromURL(imageURL);
        URL.revokeObjectURL(imageURL);

        const { pixel_values } = await processor(image);
        const { output } = await model({ input: pixel_values });

        // Scale the mask back to original image dimensions
        const mask = await RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(image.width, image.height);

        progressBar.style.width = '90%';
        statusText.textContent = '🎨 Compositing…';

        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        const bitmap = await createImageBitmap(file);
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < mask.data.length; i++) {
            imgData.data[4 * i + 3] = mask.data[i];
        }
        ctx.putImageData(imgData, 0, 0);

        const resultBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
        currentBgRemovedBlob = resultBlob;
        const url = URL.createObjectURL(resultBlob);
        document.getElementById('bgRemoved').src = url;
        document.getElementById('bgResult').style.display = 'block';
        progressBar.style.width = '100%';
        statusText.textContent = '✓ Done!';
        statusText.style.color = '#10B981';
        setTimeout(() => { statusBox.style.display = 'none'; statusText.style.color = ''; }, 2000);
    } catch (err) {
        console.error('AI background removal error:', err);
        statusText.textContent = '⚠ Error: ' + (err.message || 'AI failed. Open browser console (F12) for details.');
        statusText.style.color = '#EF4444';
        progressBar.style.width = '0%';
    } finally {
        btn.disabled = false;
    }
}

function downloadBgRemoved() {
    if (!currentBgRemovedBlob) {
        alert('Please process an image first!');
        return;
    }
    triggerDownload(currentBgRemovedBlob, 'background-removed.png');
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE FORMAT CONVERTER — Canvas API (JPG, PNG, WebP, BMP, GIF)
// ═══════════════════════════════════════════════════════════════════════════════
function convertImages() {
    const imgInput = document.getElementById('imgInput');
    if (!imgInput.files.length) {
        alert('Please select image files first!');
        return;
    }
    const targetFormat = document.getElementById('targetFormat').value.toLowerCase();
    const mimeMap = {
        'jpg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'svg': 'image/svg+xml'
    };
    const mime = mimeMap[targetFormat] || 'image/png';
    const ext = targetFormat === 'jpg' ? 'jpg' : targetFormat;

    const btn = document.getElementById('convertImagesBtn');
    btn.textContent = 'Converting…';
    btn.disabled = true;
    currentConvertedBlobs = [];

    const files = Array.from(imgInput.files);
    let done = 0;

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const image = new Image();
            image.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
                const ctx = canvas.getContext('2d');
                // White background for formats that don't support transparency
                if (mime === 'image/jpeg' || mime === 'image/bmp') {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                ctx.drawImage(image, 0, 0);
                canvas.toBlob(function(blob) {
                    const baseName = file.name.replace(/\.[^.]+$/, '');
                    currentConvertedBlobs.push({ blob, name: `${baseName}.${ext}` });
                    done++;
                    if (done === files.length) {
                        document.getElementById('imgResult').style.display = 'block';
                        document.getElementById('convertedCount').textContent =
                            `${done} file${done > 1 ? 's' : ''} converted to ${targetFormat.toUpperCase()}`;
                        btn.textContent = 'Convert Images';
                        btn.disabled = false;
                    }
                }, mime, 0.92);
            };
            image.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function downloadConverted() {
    if (!currentConvertedBlobs.length) {
        alert('Please convert images first!');
        return;
    }
    if (currentConvertedBlobs.length === 1) {
        triggerDownload(currentConvertedBlobs[0].blob, currentConvertedBlobs[0].name);
    } else {
        // Download all one by one with a small delay
        currentConvertedBlobs.forEach((item, i) => {
            setTimeout(() => triggerDownload(item.blob, item.name), i * 300);
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PDF CONVERTER — text/docx content extracted and repacked using jsPDF
// ═══════════════════════════════════════════════════════════════════════════════
function updatePdfToOptions() {
    const from = document.getElementById('fromFormat').value;
    const toSel = document.getElementById('toFormat');
    toSel.innerHTML = '';
    const opts = {
        'Image (JPG/PNG)': ['PDF'],
        'PDF': ['Image (PNG)', 'Text (.txt)'],
        'Text / Other': ['PDF']
    };
    (opts[from] || ['PDF']).forEach(opt => {
        const o = document.createElement('option');
        o.textContent = opt;
        toSel.appendChild(o);
    });
}

function convertPDF() {
    const pdfInput = document.getElementById('pdfInput');
    if (!pdfInput.files[0]) {
        alert('Please select a file first!');
        return;
    }
    const fromFormat = document.getElementById('fromFormat').value;
    const toFormat = document.getElementById('toFormat').value;
    const file = pdfInput.files[0];
    const btn = document.getElementById('convertPDFBtn');
    btn.textContent = 'Converting…';
    btn.disabled = true;

    // Image → PDF
    if (fromFormat === 'Image (JPG/PNG)' && toFormat === 'PDF') {
        imageFileToPDF(file, btn);
        return;
    }

    // PDF → Text
    if (fromFormat === 'PDF' && toFormat === 'Text (.txt)') {
        pdfToText(file, btn);
        return;
    }

    // PDF → Image
    if (fromFormat === 'PDF' && toFormat === 'Image (PNG)') {
        pdfToImages(file, btn);
        return;
    }

    // Text / Other → PDF
    if (toFormat === 'PDF') {
        readFileAsText(file).then(text => {
            textToPDF(text, file.name, btn);
        }).catch(() => {
            readFileAsArrayBuffer(file).then(buffer => {
                binaryToPDF(buffer, file.name, file.type, btn);
            });
        });
        return;
    }

    btn.textContent = 'Convert File';
    btn.disabled = false;
    alert('This conversion is not supported in the browser.');
}

function imageFileToPDF(file, btn) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
                alert('PDF library not loaded. Please refresh.');
                btn.textContent = 'Convert File'; btn.disabled = false;
                return;
            }
            const { jsPDF } = window.jspdf;
            const orientation = img.width > img.height ? 'landscape' : 'portrait';
            const pdf = new jsPDF({ orientation, unit: 'px', format: [img.width, img.height] });
            pdf.addImage(e.target.result, 'JPEG', 0, 0, img.width, img.height);
            const blob = pdf.output('blob');
            const outName = file.name.replace(/\.[^.]+$/, '') + '.pdf';
            triggerDownload(blob, outName);
            document.getElementById('conversionResult').style.display = 'block';
            btn.textContent = 'Convert File'; btn.disabled = false;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function textToPDF(text, originalName, btn) {
    if (typeof window.jspdf === 'undefined') {
        alert('PDF library not loaded. Please refresh the page.');
        btn.textContent = 'Convert File'; btn.disabled = false;
        return;
    }
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
    const lineHeight = 14;
    pdf.setFontSize(11);
    // Split into lines fitting the page width
    const lines = pdf.splitTextToSize(text, pageWidth);
    let y = margin;
    lines.forEach(line => {
        if (y + lineHeight > pdf.internal.pageSize.getHeight() - margin) {
            pdf.addPage();
            y = margin;
        }
        pdf.text(line, margin, y);
        y += lineHeight;
    });
    const blob = pdf.output('blob');
    const outName = originalName.replace(/\.[^.]+$/, '') + '.pdf';
    triggerDownload(blob, outName);
    document.getElementById('conversionResult').style.display = 'block';
    btn.textContent = 'Convert File'; btn.disabled = false;
}

function binaryToPDF(buffer, originalName, mimeType, btn) {
    textToPDF(`[Binary file: ${originalName}]\nMIME type: ${mimeType}\nSize: ${buffer.byteLength} bytes\n\nThis file type cannot be fully converted in-browser. Please use specialised software for full conversion.`, originalName, btn);
}

function pdfToText(file, btn) {
    if (typeof pdfjsLib === 'undefined') {
        btn.textContent = 'Convert File'; btn.disabled = false;
        alert('PDF library not loaded. Please refresh the page.');
        return;
    }
    const url = URL.createObjectURL(file);
    pdfjsLib.getDocument(url).promise.then(pdf => {
        const pagePromises = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            pagePromises.push(
                pdf.getPage(i).then(page =>
                    page.getTextContent().then(tc =>
                        tc.items.map(s => s.str).join(' ')
                    )
                )
            );
        }
        return Promise.all(pagePromises);
    }).then(pages => {
        const fullText = pages.join('\n\n--- Page Break ---\n\n');
        const blob = new Blob([fullText], { type: 'text/plain' });
        const outName = file.name.replace(/\.pdf$/i, '') + '.txt';
        triggerDownload(blob, outName);
        document.getElementById('conversionResult').style.display = 'block';
        btn.textContent = 'Convert File'; btn.disabled = false;
        URL.revokeObjectURL(url);
    }).then(pages => {
        const fullText = pages.join('\n\n--- Page Break ---\n\n').trim();
        if (fullText.replace(/[\s-]/g, '').length < 20) {
            // Virtually no text found — likely a scanned PDF, try OCR
            ocrPdf(file, btn, url);
        } else {
            const blob = new Blob([fullText], { type: 'text/plain' });
            const outName = file.name.replace(/\.pdf$/i, '') + '.txt';
            triggerDownload(blob, outName);
            document.getElementById('conversionResult').style.display = 'block';
            btn.textContent = 'Convert File'; btn.disabled = false;
            URL.revokeObjectURL(url);
        }
    }).catch(() => {
        ocrPdf(file, btn, url);
    });
}

async function ocrPdf(file, btn, objectUrl) {
    if (typeof Tesseract === 'undefined') {
        btn.textContent = 'Convert File'; btn.disabled = false;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        alert('This PDF appears to be scanned. OCR library not loaded — please refresh and try again.');
        return;
    }
    const statusEl = document.getElementById('conversionResult');
    statusEl.style.display = 'block';
    statusEl.querySelector('p').textContent = '⏳ Scanned PDF detected — running OCR… this may take a moment';
    statusEl.querySelector('p').style.color = '#6366F1';

    try {
        // Render each PDF page to a canvas and OCR it
        const pdf = await pdfjsLib.getDocument(objectUrl || URL.createObjectURL(file)).promise;
        let allText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            statusEl.querySelector('p').textContent = `⏳ OCR: processing page ${i} of ${pdf.numPages}…`;
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
            const { data: { text } } = await Tesseract.recognize(canvas, 'eng');
            allText += (i > 1 ? '\n\n--- Page Break ---\n\n' : '') + text;
        }
        const blob = new Blob([allText], { type: 'text/plain' });
        triggerDownload(blob, file.name.replace(/\.pdf$/i, '') + '.txt');
        statusEl.querySelector('p').textContent = '✓ OCR complete — file downloaded!';
        statusEl.querySelector('p').style.color = '#10B981';
    } catch (err) {
        console.error('OCR error:', err);
        statusEl.querySelector('p').textContent = '⚠ OCR failed. The PDF may be encrypted.';
        statusEl.querySelector('p').style.color = '#EF4444';
    } finally {
        btn.textContent = 'Convert File'; btn.disabled = false;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
}

function pdfToImages(file, btn) {
    if (typeof pdfjsLib === 'undefined') {
        // Fallback: can't render PDF without pdf.js
        btn.textContent = 'Convert File'; btn.disabled = false;
        alert('PDF rendering requires the pdf.js library (not loaded). Try Image→PDF instead.');
        return;
    }
    const url = URL.createObjectURL(file);
    pdfjsLib.getDocument(url).promise.then(pdf => {
        const pagePromises = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            pagePromises.push(pdf.getPage(i).then(page => {
                const viewport = page.getViewport({ scale: 2 });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext('2d');
                return page.render({ canvasContext: ctx, viewport }).promise.then(() => {
                    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                });
            }));
        }
        return Promise.all(pagePromises);
    }).then(blobs => {
        blobs.forEach((blob, i) => {
            const outName = file.name.replace(/\.[^.]+$/, '') + `-page${i+1}.png`;
            setTimeout(() => triggerDownload(blob, outName), i * 400);
        });
        document.getElementById('conversionResult').style.display = 'block';
        btn.textContent = 'Convert File'; btn.disabled = false;
        URL.revokeObjectURL(url);
    }).catch(() => {
        btn.textContent = 'Convert File'; btn.disabled = false;
        alert('Could not parse PDF. It may be password-protected or corrupted.');
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO TO GIF — gif.js library + canvas frame extraction
// ═══════════════════════════════════════════════════════════════════════════════
function convertToGif() {
    const videoEl = document.getElementById('videoElement');
    if (!videoEl.src) {
        alert('Please upload a video first!');
        return;
    }
    if (typeof GIF === 'undefined') {
        alert('GIF library not loaded. Please refresh the page.');
        return;
    }

    const startTime = parseFloat(document.getElementById('startTime').value) || 0;
    const duration = Math.min(parseFloat(document.getElementById('duration').value) || 3, 10);
    const quality = document.getElementById('gifQuality').value;
    const qualityMap = { 'High (larger file)': 1, 'Medium': 5, 'Low (smaller file)': 10 };
    const gifQuality = qualityMap[quality] || 5;

    const btn = document.getElementById('convertGifBtn');
    btn.textContent = 'Converting… (this may take a moment)';
    btn.disabled = true;
    document.getElementById('gifProgress').style.display = 'block';

    const canvas = document.createElement('canvas');
    const maxW = 480;
    const ratio = videoEl.videoWidth / videoEl.videoHeight;
    canvas.width = Math.min(videoEl.videoWidth, maxW);
    canvas.height = Math.round(canvas.width / ratio);
    const ctx = canvas.getContext('2d');

    const fps = quality === 'Low (smaller file)' ? 8 : quality === 'Medium' ? 12 : 15;
    const frameInterval = 1 / fps;
    const totalFrames = Math.ceil(duration * fps);

    const gif = new GIF({
        workers: 2,
        quality: gifQuality,
        width: canvas.width,
        height: canvas.height,
        workerScript: 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js'
    });

    let capturedFrames = 0;

    function captureFrame(time) {
        return new Promise(resolve => {
            videoEl.currentTime = time;
            videoEl.onseeked = () => {
                ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                gif.addFrame(ctx, { copy: true, delay: Math.round(1000 / fps) });
                capturedFrames++;
                document.getElementById('gifProgressText').textContent =
                    `Capturing frames: ${capturedFrames}/${totalFrames}`;
                resolve();
            };
        });
    }

    async function captureAllFrames() {
        for (let i = 0; i < totalFrames; i++) {
            await captureFrame(startTime + i * frameInterval);
        }
        document.getElementById('gifProgressText').textContent = 'Encoding GIF…';
        gif.render();
    }

    gif.on('finished', function(blob) {
        currentGifBlob = blob;
        const url = URL.createObjectURL(blob);
        document.getElementById('gifPreview').src = url;
        document.getElementById('gifResult').style.display = 'block';
        document.getElementById('gifProgress').style.display = 'none';
        btn.textContent = 'Convert to GIF';
        btn.disabled = false;
    });

    gif.on('progress', p => {
        document.getElementById('gifProgressText').textContent =
            `Encoding GIF: ${Math.round(p * 100)}%`;
    });

    captureAllFrames();
}

function downloadGif() {
    if (!currentGifBlob) {
        alert('Please convert a video first!');
        return;
    }
    triggerDownload(currentGifBlob, 'converted.gif');
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════════════════════════
function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// Close modal on outside click
window.onclick = function(event) {
    const modal = document.getElementById('toolModal');
    if (event.target == modal) {
        closeModal();
    }
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Pre-load speech synthesis voices
if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

// Set pdf.js worker once DOM is ready (library may load after this script)
window.addEventListener('load', () => {
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    }
    renderRecentTools();
    initCookieConsent();
    handleHashNavigation();
});

// Handle direct deep-links e.g. kaynai.co.uk/#bg-remover → auto-open that tool
const TOOL_IDS = ['image-enhancer', 'text-to-speech', 'pdf-converter', 'qr-generator', 'bg-remover', 'image-converter', 'video-to-gif'];

function handleHashNavigation() {
    const hash = window.location.hash.replace('#', '');
    if (TOOL_IDS.includes(hash)) {
        // Scroll to the tool card first so the page position is correct, then open modal
        const card = document.getElementById(hash);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => openTool(hash), 400);
    }
}

window.addEventListener('hashchange', handleHashNavigation);

// ─── Tool labels for Recently Used strip ─────────────────────────────────────────────
const TOOL_LABELS = {
    'image-enhancer':  '\uD83D\uDDBC\uFE0F Image Enhancer',
    'text-to-speech':  '\uD83D\uDD0A Text to Speech',
    'pdf-converter':   '\uD83D\uDCC4 PDF Converter',
    'qr-generator':    '\uD83D\uDCF1 QR Generator',
    'bg-remover':      '\u2702\uFE0F Background Remover',
    'image-converter': '\uD83D\uDD04 Image Converter',
    'video-to-gif':    '\uD83C\uDFA6 Video to GIF'
};

// ─── Recently Used Tools ─────────────────────────────────────────────────────────────
function trackToolUse(toolName) {
    const KEY = 'aitoolbox_recent';
    let recent = JSON.parse(localStorage.getItem(KEY) || '[]');
    recent = [toolName, ...recent.filter(t => t !== toolName)].slice(0, 3);
    localStorage.setItem(KEY, JSON.stringify(recent));
    renderRecentTools();
}

function renderRecentTools() {
    const strip = document.getElementById('recentStrip');
    const buttons = document.getElementById('recentButtons');
    if (!strip || !buttons) return;
    const recent = JSON.parse(localStorage.getItem('aitoolbox_recent') || '[]');
    if (recent.length === 0) { strip.style.display = 'none'; return; }
    buttons.innerHTML = recent
        .map(t => `<button class="recent-btn" onclick="openTool('${t}')">${TOOL_LABELS[t] || t}</button>`)
        .join('');
    strip.style.display = '';
}

// ─── Cookie Consent & Analytics ────────────────────────────────────────────────────
function initCookieConsent() {
    const consent = localStorage.getItem('aitoolbox_consent');
    if (consent === null) {
        const banner = document.getElementById('cookieBanner');
        if (banner) banner.style.display = 'flex';
    } else if (consent === 'true') {
        loadAnalytics();
    }
}

function acceptCookies() {
    localStorage.setItem('aitoolbox_consent', 'true');
    const banner = document.getElementById('cookieBanner');
    if (banner) banner.style.display = 'none';
    loadAnalytics();
}

function declineCookies() {
    localStorage.setItem('aitoolbox_consent', 'false');
    const banner = document.getElementById('cookieBanner');
    if (banner) banner.style.display = 'none';
}

function revokeConsent() {
    localStorage.removeItem('aitoolbox_consent');
    const banner = document.getElementById('cookieBanner');
    if (banner) banner.style.display = 'flex';
}

function loadAnalytics() {
    // Replace G-XXXXXXXXXX with your Measurement ID from analytics.google.com
    const GA_ID = 'G-XXXXXXXXXX';
    if (GA_ID === 'G-XXXXXXXXXX') return; // placeholder — swap ID before deploying
    if (document.querySelector(`script[src*="${GA_ID}"]`)) return; // already loaded
    const s = document.createElement('script');
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    s.async = true;
    document.head.appendChild(s);
    s.onload = () => {
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { dataLayer.push(arguments); };
        gtag('js', new Date());
        gtag('config', GA_ID, { anonymize_ip: true });
    };
}

// ─── Legal Modals ────────────────────────────────────────────────────────────────────
const LEGAL_CONTENT = {
    privacy: `
        <h2>Privacy Policy</h2>
        <p><strong>Last updated: March 2026</strong></p>
        <h3>Who we are</h3>
        <p>AIToolBox (kaynai.co.uk) provides free, browser-based AI tools. We are committed to protecting your privacy.</p>
        <h3>Your files &mdash; 100% private</h3>
        <p>Every tool processes your files entirely within your browser using your own device. Your photos, PDFs, videos and other files are <strong>never uploaded to any server</strong>. We never see them.</p>
        <h3>What we store locally</h3>
        <p>We write two items to your browser's localStorage only:</p>
        <ul>
            <li><strong>aitoolbox_consent</strong> &mdash; your cookie preference (accept or decline).</li>
            <li><strong>aitoolbox_recent</strong> &mdash; the last 3 tools you opened, for the "Welcome back" strip. This never leaves your device.</li>
        </ul>
        <h3>Analytics (with consent)</h3>
        <p>If you accept cookies, we load Google Analytics 4 to understand how people use the site. Data is anonymised and aggregated &mdash; we cannot identify individual users. See <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google's Privacy Policy</a>.</p>
        <h3>Advertising (with consent)</h3>
        <p>We display ads via Google AdSense. Google may use cookies to show ads relevant to your interests. You can opt out at <a href="https://adssettings.google.com" target="_blank" rel="noopener">Google Ad Settings</a>.</p>
        <h3>Third-party CDNs</h3>
        <p>JavaScript libraries are loaded from Cloudflare CDN and jsDelivr. These services may log technical data (IP address, browser type) per their own privacy policies.</p>
        <h3>Your rights</h3>
        <p>Delete all locally stored data at any time by clicking "Revoke cookie consent" in the footer, or by clearing your browser's site data (Settings &rarr; Privacy &rarr; Clear site data). There is no server-side account to delete.</p>
        <h3>Contact</h3>
        <p>Questions? Email <a href="mailto:hello@kaynai.co.uk">hello@kaynai.co.uk</a></p>
    `,
    terms: `
        <h2>Terms of Service</h2>
        <p><strong>Last updated: March 2026</strong></p>
        <h3>Acceptance</h3>
        <p>By using AIToolBox you agree to these terms. If you do not agree, please do not use the service.</p>
        <h3>The service</h3>
        <p>AIToolBox provides free, browser-based AI tools on an "as is" basis. We make no guarantees about uptime, accuracy of results or suitability for any particular purpose.</p>
        <h3>Acceptable use</h3>
        <p>You agree not to use AIToolBox to process content that is unlawful, infringes third-party intellectual property, or that could be used to harm others. You are solely responsible for all content you process.</p>
        <h3>Your files</h3>
        <p>All processing happens in your own browser. We never receive, store or have any access to files you work with. You retain full ownership of everything you process.</p>
        <h3>Limitation of liability</h3>
        <p>To the maximum extent permitted by applicable law, AIToolBox is not liable for any damages arising from use of the service, including loss of data, loss of profits, or any indirect or consequential losses.</p>
        <h3>Changes</h3>
        <p>We may update these terms at any time. Continued use of the service after changes constitutes acceptance.</p>
        <h3>Contact</h3>
        <p>Questions? Email <a href="mailto:hello@kaynai.co.uk">hello@kaynai.co.uk</a></p>
    `,
    cookies: `
        <h2>Cookie Policy</h2>
        <p><strong>Last updated: March 2026</strong></p>
        <h3>What are cookies?</h3>
        <p>Cookies and similar technologies (here, browser localStorage) store small pieces of information on your device to improve your experience.</p>
        <h3>Essential storage &mdash; no consent required</h3>
        <table>
            <tr><th>Name</th><th>Purpose</th><th>Duration</th></tr>
            <tr><td>aitoolbox_consent</td><td>Remembers your cookie preference</td><td>Until you clear browser data</td></tr>
            <tr><td>aitoolbox_recent</td><td>Shows recently used tools on return visits</td><td>Until you clear browser data</td></tr>
        </table>
        <h3>Analytics cookies &mdash; consent required</h3>
        <p>If you accept, we load Google Analytics 4 which sets <em>_ga</em> and <em>_ga_*</em> cookies to measure site usage. All data is anonymised. Duration: up to 13 months.</p>
        <h3>Advertising cookies &mdash; consent required</h3>
        <p>If you accept, Google AdSense may use cookies to personalise ads. Duration: up to 13 months. See <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener">Google's advertising policy</a>.</p>
        <h3>Managing your consent</h3>
        <p>Click <strong>"Revoke cookie consent"</strong> in the footer at any time to reset your preference. You can also clear all site data via browser settings.</p>
        <h3>Browser opt-out</h3>
        <p>Use the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">Google Analytics Opt-out Add-on</a> or your browser's privacy settings to block analytics cookies entirely.</p>
    `
};

function openLegal(type) {
    const box = document.getElementById('legalContent');
    const overlay = document.getElementById('legalModal');
    if (!box || !overlay) return;
    box.innerHTML = LEGAL_CONTENT[type] || '';
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeLegalModal() {
    const overlay = document.getElementById('legalModal');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
}