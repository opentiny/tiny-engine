import { defineComponent } from 'vue';
import { mediaProps, usePlayer } from './helper';
import 'plyr/dist/plyr.css';
import { EVENT_NAMES, audioName } from './const';

export default defineComponent({
    name: audioName,
    props: mediaProps,
    emits: [...EVENT_NAMES],
    setup(props, { emit, expose }) {
        const { playerRef, getPlayer, play, pause, restart, stop } = usePlayer(props, emit, 'audio');
        expose({ playerRef, getPlayer, play, pause, restart, stop })

        return () => (
            <div class="audio-player">
                <audio ref={playerRef} crossorigin={props.crossorigin} />
            </div>
        )
    },
});

