/**
 * Conversor Audio V2 - Motor de Análise e Extração de Áudio de Vídeo
 * 
 * Processa arquivos de vídeo (MP4, MOV, M4V, WebM, MKV, AVI) de forma 100%
 * local no navegador utilizando inspeção estrutural de streams e Web Audio API.
 */

import { VideoMetadataV2, ExtractedAudioDataV2 } from "../types";
import { probeMedia } from "./mediaProbeEngine";

/**
 * Executa a análise estrutural cirúrgica dos streams do arquivo de vídeo
 */
export async function analyzeVideoFileV2(file: File): Promise<VideoMetadataV2> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const validExtensions = ['mp4', 'mov', 'm4v', 'webm', 'mkv', 'avi', 'ogv', '3gp', 'flv'];
  
  if (!validExtensions.includes(extension) && !file.type.startsWith('video/')) {
    throw new Error('Formato de vídeo não suportado. Utilize arquivos MP4, MOV, M4V, WebM, MKV ou AVI.');
  }

  // Executa o probe estrutural baseado em átomos e descritores binários
  return await probeMedia(file);
}

/**
 * Decodifica o áudio do arquivo utilizando AudioContext com fallback inteligente
 */
export async function extractAudioFromVideoV2(
  file: File,
  onProgress?: (stage: string, progress: number) => void,
  checkCancelled?: () => boolean
): Promise<ExtractedAudioDataV2> {
  if (onProgress) onProgress('Iniciando extração do áudio...', 10);

  if (checkCancelled && checkCancelled()) {
    throw new Error('Operação cancelada pelo usuário.');
  }

  // Limite de segurança de memória para processamento no navegador (1.8GB)
  if (file.size > 1.8 * 1024 * 1024 * 1024) {
    throw new Error('O arquivo excede o limite de 1.8 GB para extração local no navegador.');
  }

  if (onProgress) onProgress('Lendo fluxo de dados do arquivo...', 25);

  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) {
    throw new Error('Seu navegador não possui suporte à Web Audio API.');
  }

  // Método 1: Decodificação direta via decodeAudioData
  try {
    const arrayBuffer = await file.arrayBuffer();

    if (checkCancelled && checkCancelled()) {
      throw new Error('Operação cancelada pelo usuário.');
    }

    if (onProgress) onProgress('Decodificando trilha de áudio PCM...', 45);

    const audioCtx = new AudioCtx();

    try {
      const audioBuffer: AudioBuffer = await new Promise((resolve, reject) => {
        audioCtx.decodeAudioData(
          arrayBuffer,
          (decoded) => resolve(decoded),
          (err) => reject(err || new Error('Falha ao decodificar contêiner via AudioContext.'))
        );
      });

      if (checkCancelled && checkCancelled()) {
        audioCtx.close();
        throw new Error('Operação cancelada pelo usuário.');
      }

      if (onProgress) onProgress('Extraindo canais estéreo...', 65);

      const channels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      const duration = audioBuffer.duration;
      const leftChannel = audioBuffer.getChannelData(0);
      const rightChannel = channels > 1 ? audioBuffer.getChannelData(1) : null;

      audioCtx.close();

      return {
        leftChannel,
        rightChannel,
        channels,
        sampleRate,
        duration
      };
    } catch (decodeErr) {
      audioCtx.close();
      throw decodeErr;
    }
  } catch (err: any) {
    if (checkCancelled && checkCancelled()) {
      throw new Error('Operação cancelada pelo usuário.');
    }

    // Se o decode falhar ou o contêiner tiver codecs específicos de áudio não decodificáveis nativamente
    const msg = err?.message || '';
    if (msg.includes('cancelada')) {
      throw err;
    }

    throw new Error(
      `Não foi possível extrair a faixa de áudio deste arquivo. Verifique se o codec de áudio gravado no vídeo é compatível com o navegador (ex: AAC, MP3, PCM, Opus). Detalhe: ${msg || 'Codec não suportado'}`
    );
  }
}
