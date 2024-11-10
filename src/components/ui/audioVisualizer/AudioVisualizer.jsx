import { Pause, Play } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";
import WaveLoadingAnimation from "../waveAnimation/WaveAnimation";

const WaveformPlayer = ({ src }) => {
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [audioFile, setAudioFile] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!waveformRef.current) return;

    const createWaveSurfer = async () => {
      setIsLoading(true);

      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }

      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#508C9B",
        progressColor: "#134B70",
        cursorColor: "#508C9B",
        barWidth: 3,
        barRadius: 3,
        cursorWidth: 1,
        width: 500,
        height: 70,
        barGap: 3,
      });

      wavesurfer.current.on("ready", () => {
        setIsLoading(false);
      });

      wavesurfer.current.on("audioprocess", () => {
        if (wavesurfer.current) {
          const currentTime = wavesurfer.current.getCurrentTime();
          setCurrentTime(formatTime(currentTime));
        }
      });

      try {
        await wavesurfer.current.load(audioFile);
      } catch (error) {
        console.error("Error loading audio:", error);
        // setIsLoading(false);
      }
    };

    createWaveSurfer();

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
    };
  }, [audioFile]);

  const handlePlayPause = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
      setIsPlaying(wavesurfer.current.isPlaying());
    }
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const WaveLoadingAnimation2 = () => (
    <div className="flex items-center  justify-start space-x-1 h-full animate-pulse">
      <div>Initializing...</div>
      {[...Array(60)].map((_, index) => (
        <div
          key={index}
          className="w-1 bg-agent rounded-full animate-wave"
          style={{
            height: `${40 + Math.random() * 60}%`,
            animationDelay: `${index * 0.1}s`,
          }}
        ></div>
      ))}
    </div>
  );

  return (
    <div className="w-full mx-auto p-4 rounded-lg ">
      {isLoading && (
        <>
          <WaveLoadingAnimation2 />
        </>
      )}
      <div className="flex flex-row-reverse gap-4 justify-between items-center">
        <div className="flex w-full justify-between items-center">
          <div
            ref={waveformRef}
            style={{
              display: isLoading ? "none" : "block",
            }}
            className="w-full"
          />
        </div>
        {!isLoading && (
          <button
            onClick={handlePlayPause}
            className="px-[5px] py-[5px] bg-customer text-white rounded hover:bg-agent transition-colors"
          >
            {isPlaying ? <Pause /> : <Play />}
          </button>
        )}
      </div>
    </div>
  );
};

export default WaveformPlayer;
