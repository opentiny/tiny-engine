import { defineComponent } from 'vue';
import { mediaProps, usePlayer } from './helper';
import 'plyr/dist/plyr.css';
import { EVENT_NAMES, videoName } from './const';

export default defineComponent({
    name: videoName,
    props: mediaProps,
    emits: [...EVENT_NAMES],
    setup(props, { emit, expose }) {
        const { playerRef, getPlayer, play, pause, restart, stop } = usePlayer(props, emit, 'video');

        expose({ playerRef, getPlayer, play, pause, restart, stop })

        return () => (
            <div class="video-player">
                <video ref={playerRef} crossorigin={props.crossorigin}/>
            </div>
        );
    },
});
