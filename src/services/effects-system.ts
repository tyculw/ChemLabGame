import type { EffectType } from '../types';
import { audioService } from './audio-service';

export interface EffectConfig {
    type: EffectType;
    duration: number;
}

/**
 * 特效系统 - 管理视觉特效和音效的播放
 */
class EffectSystem {
    /**
     * 播放特效（视觉+音效）
     */
    playEffect(effectType: EffectType, container: HTMLElement): () => void {
        console.log('[Effects] Playing effect:', effectType);

        let cleanup: (() => void) | null = null;

        switch (effectType) {
            case 'combustion':
                cleanup = this.playCombustionEffect(container);
                audioService.playBurning(3000);
                break;

            case 'explosion':
                cleanup = this.playExplosionEffect(container);
                audioService.playExplosion();
                break;

            case 'bubbling':
                cleanup = this.playBubblingEffect(container);
                audioService.playBubbling(2000);
                break;

            case 'sparks':
                cleanup = this.playSparksEffect(container);
                audioService.playSparks(1500);
                break;

            case 'smoke':
                cleanup = this.playSmokeEffect(container);
                audioService.playSmoke(2000);
                break;

            case 'color_change':
                cleanup = this.playColorChangeEffect(container);
                break;

            case 'none':
            default:
                cleanup = () => { };
                break;
        }

        return cleanup || (() => { });
    }

    /**
     * 燃烧特效
     */
    private playCombustionEffect(container: HTMLElement): () => void {
        const canvas = document.createElement('canvas');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d')!;
        const particles: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            life: number;
            maxLife: number;
            size: number;
        }> = [];

        let animationId: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 生成新粒子
            if (particles.length < 100) {
                for (let i = 0; i < 3; i++) {
                    particles.push({
                        x: canvas.width / 2 + (Math.random() - 0.5) * 60,
                        y: canvas.height * 0.7,
                        vx: (Math.random() - 0.5) * 2,
                        vy: -2 - Math.random() * 3,
                        life: 1,
                        maxLife: 0.5 + Math.random() * 0.5,
                        size: 5 + Math.random() * 10
                    });
                }
            }

            // 更新和绘制粒子
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1; // 重力
                p.life -= 0.02;

                if (p.life <= 0) {
                    particles.splice(i, 1);
                    continue;
                }

                const alpha = p.life;
                const hue = 20 + (1 - p.life) * 40; // 从黄色到红色

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${alpha})`;
                ctx.fill();
            }

            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationId);
            canvas.remove();
        };
    }

    /**
     * 爆炸特效
     */
    private playExplosionEffect(container: HTMLElement): () => void {
        const canvas = document.createElement('canvas');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d')!;
        const particles: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            life: number;
            size: number;
            color: string;
        }> = [];

        // 创建爆炸粒子
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        for (let i = 0; i < 80; i++) {
            const angle = (Math.PI * 2 * i) / 80;
            const speed = 3 + Math.random() * 5;
            particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                size: 4 + Math.random() * 8,
                color: Math.random() > 0.5 ? '#ff6600' : '#ffaa00'
            });
        }

        // 屏幕震动
        container.style.animation = 'shake 0.3s';
        setTimeout(() => {
            container.style.animation = '';
        }, 300);

        let animationId: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 绘制冲击波
            const shockwaveRadius = (1 - particles[0]?.life || 0) * 200;
            ctx.beginPath();
            ctx.arc(centerX, centerY, shockwaveRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${particles[0]?.life || 0})`;
            ctx.lineWidth = 3;
            ctx.stroke();

            // 更新和绘制粒子
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.15; // 重力
                p.vx *= 0.98; // 摩擦
                p.life -= 0.015;

                if (p.life <= 0) {
                    particles.splice(i, 1);
                    continue;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            if (particles.length > 0) {
                animationId = requestAnimationFrame(animate);
            } else {
                canvas.remove();
            }
        };

        animate();

        return () => {
            cancelAnimationFrame(animationId);
            canvas.remove();
        };
    }

    /**
     * 冒泡特效
     */
    private playBubblingEffect(container: HTMLElement): () => void {
        const canvas = document.createElement('canvas');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d')!;
        const bubbles: Array<{
            x: number;
            y: number;
            vy: number;
            size: number;
            life: number;
        }> = [];

        let animationId: number;
        let frameCount = 0;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            frameCount++;

            // 生成新气泡
            if (frameCount % 10 === 0 && bubbles.length < 30) {
                bubbles.push({
                    x: canvas.width / 2 + (Math.random() - 0.5) * 100,
                    y: canvas.height * 0.8,
                    vy: -1 - Math.random() * 2,
                    size: 5 + Math.random() * 15,
                    life: 1
                });
            }

            // 更新和绘制气泡
            for (let i = bubbles.length - 1; i >= 0; i--) {
                const b = bubbles[i];
                b.y += b.vy;
                b.x += Math.sin(b.y / 20) * 0.5;

                if (b.y < 50) {
                    bubbles.splice(i, 1);
                    continue;
                }

                // 绘制气泡
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(100, 150, 255, 0.3)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(150, 200, 255, 0.6)';
                ctx.lineWidth = 2;
                ctx.stroke();

                // 高光
                ctx.beginPath();
                ctx.arc(b.x - b.size / 3, b.y - b.size / 3, b.size / 4, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.fill();
            }

            if (frameCount < 200) {
                animationId = requestAnimationFrame(animate);
            } else {
                canvas.remove();
            }
        };

        animate();

        return () => {
            cancelAnimationFrame(animationId);
            canvas.remove();
        };
    }

    /**
     * 火花特效
     */
    private playSparksEffect(container: HTMLElement): () => void {
        const canvas = document.createElement('canvas');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d')!;
        const sparks: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            life: number;
        }> = [];

        // 生成火花
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            sparks.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1
            });
        }

        let animationId: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = sparks.length - 1; i >= 0; i--) {
                const s = sparks[i];
                s.x += s.vx;
                s.y += s.vy;
                s.vy += 0.2; // 重力
                s.life -= 0.02;

                if (s.life <= 0) {
                    sparks.splice(i, 1);
                    continue;
                }

                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s.x - s.vx * 2, s.y - s.vy * 2);
                ctx.strokeStyle = `rgba(255, 255, 100, ${s.life})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            if (sparks.length > 0) {
                animationId = requestAnimationFrame(animate);
            } else {
                canvas.remove();
            }
        };

        animate();

        return () => {
            cancelAnimationFrame(animationId);
            canvas.remove();
        };
    }

    /**
     * 烟雾特效
     */
    private playSmokeEffect(container: HTMLElement): () => void {
        const div = document.createElement('div');
        div.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 200px;
            height: 200px;
            background: radial-gradient(circle, rgba(100,100,100,0.5) 0%, transparent 70%);
            animation: smokeRise 2s ease-out;
            pointer-events: none;
        `;

        container.appendChild(div);

        setTimeout(() => {
            div.remove();
        }, 2000);

        return () => div.remove();
    }

    /**
     * 颜色变化特效
     */
    private playColorChangeEffect(container: HTMLElement): () => void {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            animation: colorPulse 2s ease-in-out;
            pointer-events: none;
        `;

        container.appendChild(overlay);

        setTimeout(() => {
            overlay.remove();
        }, 2000);

        return () => overlay.remove();
    }
}

// 导出单例
export const effectSystem = new EffectSystem();
