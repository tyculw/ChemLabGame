/**
 * 音效服务 - 使用Web Audio API程序化生成音效
 */

class AudioService {
    private audioContext: AudioContext | null = null;
    private masterVolume = 0.3; // 主音量 (0-1)

    /**
     * 初始化音频上下文
     */
    private getContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return this.audioContext;
    }

    /**
     * 播放燃烧音效
     */
    playBurning(duration: number = 3000): void {
        const ctx = this.getContext();
        const now = ctx.currentTime;

        // 创建白噪声作为火焰的"嘶嘶"声
        const bufferSize = ctx.sampleRate * (duration / 1000);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // 低通滤波器，模拟火焰的低沉声音
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 1;

        // 音量包络 - 渐入渐出
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.15, now + 0.3);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.1, now + duration / 1000 - 0.5);
        gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + duration / 1000);
    }

    /**
     * 播放爆炸音效
     */
    playExplosion(): void {
        const ctx = this.getContext();
        const now = ctx.currentTime;

        // 低频轰鸣
        const bass = ctx.createOscillator();
        bass.type = 'sine';
        bass.frequency.setValueAtTime(60, now);
        bass.frequency.exponentialRampToValueAtTime(30, now + 0.5);

        const bassGain = ctx.createGain();
        bassGain.gain.setValueAtTime(this.masterVolume * 0.8, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        // 白噪声爆裂声
        const bufferSize = ctx.sampleRate * 0.3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / bufferSize * 5);
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(this.masterVolume * 0.6, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        bass.connect(bassGain);
        bassGain.connect(ctx.destination);
        noise.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        bass.start(now);
        bass.stop(now + 0.5);
        noise.start(now);
    }

    /**
     * 播放冒泡音效
     */
    playBubbling(duration: number = 2000): void {
        // const ctx = this.getContext();
        // const now = ctx.currentTime;

        // 创建多个气泡音效
        const bubbleCount = Math.floor(duration / 300);
        for (let i = 0; i < bubbleCount; i++) {
            setTimeout(() => this.playSingleBubble(), i * 300 + Math.random() * 200);
        }
    }

    private playSingleBubble(): void {
        const ctx = this.getContext();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        const startFreq = 400 + Math.random() * 200;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 1.5, now + 0.1);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.masterVolume * 0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    /**
     * 播放火花/电火花音效
     */
    playSparks(duration: number = 1500): void {
        const ctx = this.getContext();
        const sparkCount = Math.floor(duration / 100);

        for (let i = 0; i < sparkCount; i++) {
            setTimeout(() => {
                const now = ctx.currentTime;

                // 高频脉冲
                const osc = ctx.createOscillator();
                osc.type = 'square';
                osc.frequency.setValueAtTime(2000 + Math.random() * 3000, now);

                const gain = ctx.createGain();
                gain.gain.setValueAtTime(this.masterVolume * 0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now);
                osc.stop(now + 0.05);
            }, i * 100 + Math.random() * 50);
        }
    }

    /**
     * 播放烟雾/蒸汽音效
     */
    playSmoke(duration: number = 2000): void {
        const ctx = this.getContext();
        const now = ctx.currentTime;

        // 白噪声 + 低通滤波
        const bufferSize = ctx.sampleRate * (duration / 1000);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 500;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(this.masterVolume * 0.12, now + 0.2);
        gain.gain.linearRampToValueAtTime(0, now + duration / 1000);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + duration / 1000);
    }

    /**
     * 设置主音量
     */
    setVolume(volume: number): void {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
}

// 导出单例
export const audioService = new AudioService();
