const env = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};

export interface VideoConfig {
  streamServerUrl: string;
  hlsBufferSeconds: number;
}

export const videoConfig: VideoConfig = {
  streamServerUrl: env.VITE_VIDEO_STREAM_URL ?? 'http://localhost:8084/streams',
  hlsBufferSeconds: 6,
};
