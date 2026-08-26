/**
 * Conversor Audio V2 - Audio Encoder Service
 * 
 * Implementa codificadores puros e assíncronos no navegador:
 * 1. MP3 (LameJS via Web Worker em thread separada para não travar a UI)
 * 2. WAV (16-bit PCM Linear Stereo/Mono)
 * 3. AAC / FLAC / OGG (WebCodecs com fallback transparente)
 */

import { Mp3BitrateV2, WavChannelsV2, WavSampleRateV2 } from "../types";

// Código do Web Worker LameJS empacotado como string
const LAME_WORKER_SCRIPT = `
  self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.all.min.js');

  self.onmessage = function(e) {
    const { left, right, channels, sampleRate, kbps } = e.data;
    
    var lameInstance = typeof lamejs !== 'undefined' ? lamejs : (typeof lame !== 'undefined' ? lame : null);
    if (!lameInstance) {
      self.postMessage({ type: 'error', error: 'Não foi possível carregar a biblioteca de codificação MP3 (LameJS).' });
      return;
    }
    
    function floatTo16BitPCM(float32Array) {
      var len = float32Array.length;
      var buffer = new Int16Array(len);
      for (var i = 0; i < len; i++) {
        var s = Math.max(-1, Math.min(1, float32Array[i]));
        buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      return buffer;
    }
    
    var leftPCM = floatTo16BitPCM(left);
    var rightPCM = (channels === 2 && right) ? floatTo16BitPCM(right) : null;
    
    var mp3encoder = new lameInstance.Mp3Encoder(channels, sampleRate, kbps);
    var mp3Data = [];
    var sampleBlockSize = 1152;
    var totalSamples = leftPCM.length;
    
    for (var i = 0; i < totalSamples; i += sampleBlockSize) {
      var leftChunk = leftPCM.subarray(i, i + sampleBlockSize);
      var mp3buf;
      
      if (channels === 2 && rightPCM) {
        var rightChunk = rightPCM.subarray(i, i + sampleBlockSize);
        mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
      } else {
        mp3buf = mp3encoder.encodeBuffer(leftChunk);
      }
      
      if (mp3buf.length > 0) {
        mp3Data.push(new Uint8Array(mp3buf));
      }
      
      if (i % (sampleBlockSize * 25) === 0 || i + sampleBlockSize >= totalSamples) {
        var progress = Math.min(100, Math.round((i / totalSamples) * 100));
        self.postMessage({ type: 'progress', progress: progress });
      }
    }
    
    var mp3bufFlush = mp3encoder.flush();
    if (mp3bufFlush.length > 0) {
      mp3Data.push(new Uint8Array(mp3bufFlush));
    }
    
    var totalLength = 0;
    for (var j = 0; j < mp3Data.length; j++) {
      totalLength += mp3Data[j].length;
    }
    var result = new Uint8Array(totalLength);
    var offset = 0;
    for (var j = 0; j < mp3Data.length; j++) {
      result.set(mp3Data[j], offset);
      offset += mp3Data[j].length;
    }
    
    self.postMessage({ type: 'complete', data: result.buffer }, [result.buffer]);
  };
`;

/**
 * Reamostrador de canais e taxa de amostragem usando OfflineAudioContext
 */
export async function resampleAndMixAudio(
  buffer: AudioBuffer,
  targetSampleRate: number,
  targetChannels: number
): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(
    targetChannels,
    Math.round(targetSampleRate * buffer.duration),
    targetSampleRate
  );

  const bufferSource = offlineCtx.createBufferSource();
  bufferSource.buffer = buffer;
  bufferSource.connect(offlineCtx.destination);
  bufferSource.start();

  return await offlineCtx.startRendering();
}

/**
 * Codificador WAV PCM (16-bit, 24-bit PCM ou 32-bit Float)
 */
export function encodeWavBlob(buffer: AudioBuffer, bitDepth: 16 | 24 | 32 = 16): Blob {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = bitDepth === 32 ? 3 : 1; // 1 = PCM, 3 = IEEE Float
  const bytesPerSample = bitDepth / 8;
  
  let result: Float32Array;
  if (numOfChan === 2) {
    const length = buffer.getChannelData(0).length + buffer.getChannelData(1).length;
    result = new Float32Array(length);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    let index = 0;
    let inputIndex = 0;
    while (index < length) {
      result[index++] = left[inputIndex];
      result[index++] = right[inputIndex];
      inputIndex++;
    }
  } else {
    result = buffer.getChannelData(0);
  }
  
  const bufferLength = result.length * bytesPerSample;
  const arrayBuffer = new ArrayBuffer(44 + bufferLength);
  const view = new DataView(arrayBuffer);
  
  const writeString = (v: DataView, offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      v.setUint8(offset + i, str.charCodeAt(i));
    }
  };
  
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + bufferLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numOfChan * bytesPerSample, true);
  view.setUint16(32, numOfChan * bytesPerSample, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, bufferLength, true);
  
  let offset = 44;
  for (let i = 0; i < result.length; i++) {
    const s = Math.max(-1, Math.min(1, result[i]));
    if (bitDepth === 16) {
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    } else if (bitDepth === 24) {
      const val = Math.max(-0x800000, Math.min(0x7FFFFF, Math.round(s * 0x7FFFFF)));
      const uval = val < 0 ? val + 0x1000000 : val;
      view.setUint8(offset, uval & 0xFF);
      view.setUint8(offset + 1, (uval >> 8) & 0xFF);
      view.setUint8(offset + 2, (uval >> 16) & 0xFF);
      offset += 3;
    } else if (bitDepth === 32) {
      view.setFloat32(offset, s, true);
      offset += 4;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Codificador MP3 em Web Worker
 */
export async function encodeMp3BlobWithWorker(
  buffer: AudioBuffer,
  kbps: Mp3BitrateV2,
  onProgress: (prog: number) => void,
  workerRefCarrier?: { current: Worker | null }
): Promise<Blob> {
  // Reamostra para 44.1kHz (padrão LAME)
  const resampledBuffer = await resampleAndMixAudio(
    buffer,
    44100,
    Math.min(buffer.numberOfChannels, 2)
  );

  return new Promise<Blob>((resolve, reject) => {
    const workerBlob = new Blob([LAME_WORKER_SCRIPT], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(workerBlob);
    const worker = new Worker(workerUrl);
    
    if (workerRefCarrier) {
      workerRefCarrier.current = worker;
    }

    const cleanUpWorker = () => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      if (workerRefCarrier) {
        workerRefCarrier.current = null;
      }
    };

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === "progress") {
        onProgress(msg.progress);
      } else if (msg.type === "error") {
        cleanUpWorker();
        reject(new Error(msg.error));
      } else if (msg.type === "complete") {
        const mp3Buffer = msg.data;
        const mp3Blob = new Blob([mp3Buffer], { type: "audio/mp3" });
        cleanUpWorker();
        resolve(mp3Blob);
      }
    };

    worker.onerror = (err) => {
      cleanUpWorker();
      reject(new Error("Falha no processo de codificação MP3: " + err.message));
    };

    const leftData = resampledBuffer.getChannelData(0);
    const rightData = resampledBuffer.numberOfChannels > 1 ? resampledBuffer.getChannelData(1) : null;

    const workerLeft = new Float32Array(leftData);
    const workerRight = rightData ? new Float32Array(rightData) : null;

    const transfers: Transferable[] = [workerLeft.buffer];
    if (workerRight) {
      transfers.push(workerRight.buffer);
    }

    worker.postMessage({
      left: workerLeft,
      right: workerRight,
      channels: resampledBuffer.numberOfChannels,
      sampleRate: 44100,
      kbps: kbps
    }, transfers);
  });
}

function createADTSHeader(sampleRate: number, channels: number, frameLength: number): Uint8Array {
  const samplingFrequencies = [
    96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350
  ];
  let sampleRateIndex = samplingFrequencies.indexOf(sampleRate);
  if (sampleRateIndex === -1) sampleRateIndex = 4;
  
  const adts = new Uint8Array(7);
  const totalLength = frameLength + 7;
  
  adts[0] = 0xFF;
  adts[1] = 0xF1;
  adts[2] = ((1 << 6) | (sampleRateIndex << 2) | (channels >> 2)) & 0xFF;
  adts[3] = (((channels & 3) << 6) | (totalLength >> 11)) & 0xFF;
  adts[4] = (totalLength >> 3) & 0xFF;
  adts[5] = (((totalLength & 7) << 5) | 0x1F) & 0xFF;
  adts[6] = 0xFC;
  
  return adts;
}

/**
 * Codificador WebCodecs (AAC, FLAC, OGG)
 */
export async function encodeWithWebCodecs(
  buffer: AudioBuffer,
  codecName: "aac" | "flac" | "ogg",
  bitrate: number,
  onProgress: (prog: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    let encoder: any;
    
    try {
      const AudioEncoderClass = (window as any).AudioEncoder;
      const AudioDataClass = (window as any).AudioData;
      
      if (!AudioEncoderClass || !AudioDataClass) {
        throw new Error("WebCodecs não suportado neste navegador.");
      }
      
      encoder = new AudioEncoderClass({
        output: (chunk: any) => {
          const buf = new Uint8Array(chunk.byteLength);
          chunk.copyTo(buf);
          
          if (codecName === "aac") {
            const adtsHeader = createADTSHeader(buffer.sampleRate, buffer.numberOfChannels, chunk.byteLength);
            chunks.push(adtsHeader);
          }
          chunks.push(buf);
        },
        error: (e: any) => {
          reject(e);
        }
      });
      
      let codecString = "mp4a.40.2";
      if (codecName === "flac") codecString = "flac";
      else if (codecName === "ogg") codecString = "opus";
      
      encoder.configure({
        codec: codecString,
        sampleRate: buffer.sampleRate,
        numberOfChannels: buffer.numberOfChannels,
        bitrate: bitrate,
      });
      
      const blockSize = 4096;
      const totalSamples = buffer.length;
      let offset = 0;
      
      const encodeNext = () => {
        if (offset >= totalSamples) {
          encoder.flush().then(() => {
            encoder.close();
            const mime = codecName === "aac" ? "audio/aac" : codecName === "flac" ? "audio/flac" : "audio/ogg";
            resolve(new Blob(chunks, { type: mime }));
          }).catch(reject);
          return;
        }
        
        const size = Math.min(blockSize, totalSamples - offset);
        const planes: Float32Array[] = [];
        for (let c = 0; c < buffer.numberOfChannels; c++) {
          const plane = new Float32Array(size);
          buffer.copyFromChannel(plane, c, offset);
          planes.push(plane);
        }
        
        const totalPlanesLength = planes.reduce((sum, p) => sum + p.length, 0);
        const rawData = new Float32Array(totalPlanesLength);
        let rawOffset = 0;
        for (const plane of planes) {
          rawData.set(plane, rawOffset);
          rawOffset += plane.length;
        }
        
        const audioData = new AudioDataClass({
          format: "f32-planar",
          sampleRate: buffer.sampleRate,
          numberOfFrames: size,
          numberOfChannels: buffer.numberOfChannels,
          timestamp: Math.round((offset / buffer.sampleRate) * 1000000),
          data: rawData
        });
        
        encoder.encode(audioData);
        audioData.close();
        
        offset += size;
        onProgress(Math.min(95, Math.round((offset / totalSamples) * 100)));
        setTimeout(encodeNext, 0);
      };
      
      encodeNext();
    } catch (err) {
      console.warn("WebCodecs falhou, codificando em WAV:", err);
      const wav = encodeWavBlob(buffer);
      resolve(wav);
    }
  });
}
