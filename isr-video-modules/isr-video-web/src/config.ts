export interface VideoConfig {
  remote: {
    streamServer: string;
    thumbnailServer: string;
  };
  player: {
    autoplay: boolean;
    initialVolume: number;
  };
  cache: {
    staleTimeMs: number;
    gcTimeMs: number;
  };
}

export const videoConfig: VideoConfig = {
  remote: {
    streamServer: import.meta.env?.VITE_VIDEO_STREAM_SERVER ?? 'https://stream.example.com',
    thumbnailServer:
      import.meta.env?.VITE_VIDEO_THUMBNAIL_SERVER ?? 'https://thumbs.example.com',
  },
  player: {
    autoplay: false,
    initialVolume: 0.7,
  },
  cache: {
    staleTimeMs: 30_000,
    gcTimeMs: 5 * 60_000,
  },
};
