import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

interface AudioPlayerV2Props {
  src: string;
  label?: string;
  onEnded?: () => void;
}

export const AudioPlayerV2: React.FC<AudioPlayerV2Props> = ({
  src,
  label,
  onEnded
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (onEnded) onEnded();
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audioRef.current = null;
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn("Falha na reprodução de áudio:", e);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === Infinity) return "00:00";
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 w-full max-w-sm">
      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
        aria-label={isPlaying ? "Pausar áudio" : "Tocar áudio"}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
      </button>

      <div className="flex-1 space-y-1">
        {label && (
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            <span className="truncate max-w-[120px]">{label}</span>
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
        )}
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-sky-600 focus:outline-none"
        />
      </div>
    </div>
  );
};
