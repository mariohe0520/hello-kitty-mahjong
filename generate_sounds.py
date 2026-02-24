#!/usr/bin/env python3
"""
🎲 真实麻将碰撞音效生成器
物理建模合成 - 模拟真实麻将牌的材质和碰撞特性
"""

import numpy as np
import soundfile as sf
import os

def generate_mahjong_tap(duration=0.15, sample_rate=44100):
    """
    轻触麻将牌的声音
    - 高频清脆的撞击
    - 短促的衰减
    - 类似瓷器/密胺材质的清脆感
    """
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # 主频率 - 麻将牌特有的清脆高频
    freq_main = 2800 + np.random.randint(-200, 200)
    
    # 多层谐波模拟密胺材质
    signal = (
        0.6 * np.sin(2 * np.pi * freq_main * t) +
        0.3 * np.sin(2 * np.pi * freq_main * 2.1 * t) +
        0.15 * np.sin(2 * np.pi * freq_main * 3.2 * t) +
        0.08 * np.sin(2 * np.pi * freq_main * 4.5 * t)
    )
    
    # 快速指数衰减 - 短促的碰撞
    envelope = np.exp(-t / 0.025)
    
    # 添加轻微的高频噪声模拟表面摩擦
    noise = np.random.randn(len(t)) * 0.05
    noise_envelope = np.exp(-t / 0.01)
    
    signal = signal * envelope + noise * noise_envelope
    
    # 带通滤波效果 (模拟空气传播)
    # 使用简单的加权来模拟
    signal = np.convolve(signal, np.array([0.2, 0.6, 0.2]), mode='same')
    
    return signal * 0.8

def generate_mahjong_place(duration=0.25, sample_rate=44100):
    """
    麻将牌放到桌面的声音
    - 低频的"咔哒"声
    - 桌面共振
    - 比tap更深沉
    """
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # 主频率 - 较低，因为是整体放置
    freq_main = 1200 + np.random.randint(-100, 100)
    freq_low = 400  # 桌面共振
    
    # 多层合成
    signal = (
        0.5 * np.sin(2 * np.pi * freq_main * t) +
        0.4 * np.sin(2 * np.pi * freq_main * 1.9 * t) +
        0.3 * np.sin(2 * np.pi * freq_low * t) +
        0.2 * np.sin(2 * np.pi * freq_low * 2.1 * t)
    )
    
    # 双层衰减 - 快速撞击 + 慢速共振
    envelope_fast = np.exp(-t / 0.03)
    envelope_slow = np.exp(-t / 0.15) * 0.3
    envelope = envelope_fast + envelope_slow
    
    # 更明显的噪声 - 桌面摩擦
    noise = np.random.randn(len(t)) * 0.08
    noise_envelope = np.exp(-t / 0.02)
    
    signal = signal * envelope + noise * noise_envelope
    
    return signal * 0.9

def generate_mahjong_shuffle(duration=0.8, sample_rate=44100):
    """
    洗牌声音
    - 连续的碰撞声
    - 多普勒效应模拟
    - 复杂的随机碰撞
    """
    t = np.linspace(0, duration, int(sample_rate * duration))
    signal = np.zeros_like(t)
    
    # 生成多个随机碰撞事件
    num_collisions = 25
    for _ in range(num_collisions):
        # 随机时间位置
        start_idx = np.random.randint(0, len(t) - int(sample_rate * 0.1))
        collision_duration = int(sample_rate * np.random.uniform(0.03, 0.08))
        end_idx = min(start_idx + collision_duration, len(t))
        
        # 随机频率 - 洗牌的频率变化大
        freq = np.random.uniform(1500, 3500)
        
        # 生成这个碰撞
        collision_t = np.linspace(0, (end_idx - start_idx) / sample_rate, end_idx - start_idx)
        collision = (
            np.sin(2 * np.pi * freq * collision_t) * 0.5 +
            np.sin(2 * np.pi * freq * 2 * collision_t) * 0.25
        )
        
        # 快速衰减
        env = np.exp(-collision_t / 0.02)
        collision = collision * env * np.random.uniform(0.3, 0.7)
        
        signal[start_idx:end_idx] += collision
    
    # 添加持续噪声背景
    noise = np.random.randn(len(t)) * 0.05
    # 噪声包络 - 洗牌时高，结束时低
    noise_env = np.ones_like(t)
    noise_env[-int(sample_rate * 0.2):] = np.linspace(1, 0, int(sample_rate * 0.2))
    
    signal = signal + noise * noise_env
    
    # 柔化
    signal = np.convolve(signal, np.array([0.1, 0.8, 0.1]), mode='same')
    
    return signal * 0.7

def generate_mahjong_win(duration=1.5, sample_rate=44100):
    """
    胡牌庆祝音效
    - 喜庆的铃声
    - 渐强的和声
    - 中国风格
    """
    t = np.linspace(0, duration, int(sample_rate * duration))
    signal = np.zeros_like(t)
    
    # 五声音阶 - 中国传统音乐风格
    # 宫商角徵羽 -> C D E G A (简化为频率)
    base_freq = 523.25  # C5
    pentatonic = [1.0, 1.125, 1.25, 1.5, 1.667]  # 五声音阶比例
    
    # 创建渐强的和声
    for i, ratio in enumerate(pentatonic):
        freq = base_freq * ratio
        # 每个音有不同的进入时间和持续
        delay = i * 0.15
        attack = 0.3
        
        # 创建这个音的包络
        env = np.zeros_like(t)
        start_idx = int(delay * sample_rate)
        if start_idx < len(t):
            attack_samples = int(attack * sample_rate)
            sustain_samples = int(0.8 * sample_rate)
            
            # Attack
            if start_idx + attack_samples <= len(t):
                env[start_idx:start_idx + attack_samples] = np.linspace(0, 0.3, attack_samples)
            # Sustain with decay
            if start_idx + attack_samples + sustain_samples <= len(t):
                decay = np.linspace(0.3, 0, sustain_samples)
                env[start_idx + attack_samples:start_idx + attack_samples + sustain_samples] = decay
        
        signal += np.sin(2 * np.pi * freq * t) * env
    
    # 添加一些谐波让声音更丰满
    signal += 0.3 * np.sin(2 * np.pi * base_freq * 2 * t) * np.maximum(0, signal)
    
    # 添加轻微混响效果 (简单延迟)
    delay_samples = int(0.05 * sample_rate)
    reverb = np.zeros_like(signal)
    reverb[delay_samples:] = signal[:-delay_samples] * 0.3
    signal = signal + reverb
    
    return signal * 0.8

def save_sound(signal, filename, sample_rate=44100):
    """保存音频文件"""
    # 归一化
    max_val = np.max(np.abs(signal))
    if max_val > 0:
        signal = signal / max_val * 0.9
    
    # 确保目录存在
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    
    # 保存为WAV
    sf.write(filename, signal, sample_rate)
    print(f"✅ Generated: {filename}")

# 生成所有音效
if __name__ == "__main__":
    output_dir = "/Users/mario/.openclaw/workspace/games/hello-kitty-mahjong/assets/sounds"
    
    print("🎲 生成麻将碰撞音效...")
    
    # 生成多个变体
    for i in range(3):
        tap = generate_mahjong_tap()
        save_sound(tap, f"{output_dir}/tap_{i+1}.wav")
    
    for i in range(3):
        place = generate_mahjong_place()
        save_sound(place, f"{output_dir}/place_{i+1}.wav")
    
    shuffle = generate_mahjong_shuffle()
    save_sound(shuffle, f"{output_dir}/shuffle.wav")
    
    win = generate_mahjong_win()
    save_sound(win, f"{output_dir}/win.wav")
    
    print("🎉 所有音效生成完成!")
