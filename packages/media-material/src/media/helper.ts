import Plyr from 'plyr';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import iconSvg from './assets/plyr.svg';
import type { MediaType } from 'plyr';
import type { ExtractPublicPropTypes, Ref } from 'vue';

export const mediaProps = {
    src: {
        type: [String, Array],
        default: '',
    },
    poster: {
        type: String,
        default: '',
    },
    autoplay: {
        type: Boolean,
        default: false,
    },
    muted: {
        type: Boolean,
        default: false,
    },
    loop: {
        type: Boolean,
    },
    currentTime: {
        type: Number,
    },
    volume: {
        type: Number,
    },
    speed: {
        type: Number,
    },
    quality: {
        type: Number,
    },
    crossorigin: {
        type: String,
    },
    blankVideo: {
        type: String,
    },
};

type MediaProps = ExtractPublicPropTypes<typeof mediaProps>;

export const usePlayer = (props: MediaProps, emit: (event: string, ...args: any[]) => void, type: 'video' | 'audio') => {
    const playerRef: Ref<HTMLElement> = ref(null);
    let player: Plyr;

    const computedSource = computed(() => {
        if (!props.src)
            return;
        const source = {
            type: type as MediaType,
            sources: [] as any[],
        };
        if (Array.isArray(props.src)) {
            source.sources = props.src;
        } else {
            source.sources = [
                {
                    src: props.src,
                    type: type === 'video' ? `${type}/mp4` : `${type}/mp3`,
                },
            ];
        }
        return source;
    });

    watch(() => props.autoplay, () => player && (player.autoplay = props.autoplay));
    watch(() => props.currentTime, () => player && (player.currentTime = props.currentTime));
    watch(() => props.muted, () => player && (player.muted = props.muted));
    watch(() => props.volume, () => player && (player.volume = props.volume));
    watch(() => props.speed, () => player && (player.speed = props.speed));
    watch(() => props.loop, () => player && (player.loop = props.loop));
    watch(() => props.poster, () => player && (player.poster = props.poster));
    watch(() => props.quality, () => player && (player.quality = props.quality));
    watch(computedSource, () => {
        if (!player)
            return;
        player.source = computedSource.value;
    });

    onMounted(() => {
        if (!playerRef.value) return;
        player = new Plyr(playerRef.value, {
            loadSprite: true,
            iconUrl: iconSvg,
            blankVideo: props.blankVideo,
        });
        player.source = computedSource.value;
        player.poster = props.poster;
        player.autoplay = props.autoplay;
        player.currentTime = props.currentTime;
        player.muted = props.muted;
        player.volume = props.volume;
        player.speed = props.speed;
        player.loop = props.loop;
        player.quality = props.quality;
        player.on('progress', (evt) => emit('progress', evt));
        player.on('playing', (evt) => emit('playing', evt));
        player.on('play', (evt) => emit('play', evt));
        player.on('pause', (evt) => emit('pause', evt));
        player.on('timeupdate', (evt) => emit('timeupdate', evt));
        player.on('volumechange', (evt) => emit('volumechange', evt));
        player.on('seeking', (evt) => emit('seeking', evt));
        player.on('seeked', (evt) => emit('seeked', evt));
        player.on('ratechange', (evt) => emit('ratechange', evt));
        player.on('ended', (evt) => emit('ended', evt));
        player.on('enterfullscreen', (evt) => emit('enterfullscreen', evt));
        player.on('exitfullscreen', (evt) => emit('exitfullscreen', evt));
        player.on('captionsenabled', (evt) => emit('captionsenabled', evt));
        player.on('captionsdisabled', (evt) => emit('captionsdisabled', evt));
        player.on('languagechange', (evt) => emit('languagechange', evt));
        player.on('controlshidden', (evt) => emit('controlshidden', evt));
        player.on('controlsshown', (evt) => emit('controlsshown', evt));
        player.on('loadstart', (evt) => emit('loadstart', evt));
        player.on('loadeddata', (evt) => emit('loadeddata', evt));
        player.on('loadedmetadata', (evt) => emit('loadedmetadata', evt));
        player.on('qualitychange', (evt) => emit('qualitychange', evt));
        player.on('canplay', (evt) => emit('canplay', evt));
        player.on('canplaythrough', (evt) => emit('canplaythrough', evt));
        player.on('stalled', (evt) => emit('stalled', evt));
        player.on('waiting', (evt) => emit('waiting', evt));
        player.on('emptied', (evt) => emit('emptied', evt));
        player.on('cuechange', (evt) => emit('cuechange', evt));
        player.on('error', (evt) => emit('error', evt));
    });

    onBeforeUnmount(() => {
        player?.destroy();
    });

    return {
        playerRef,
        getPlayer: () => player,
        play: () => player?.play(),
        pause: () => player?.pause(),
        restart: () => player?.restart(),
        stop: () => player?.stop(),
    };
};
