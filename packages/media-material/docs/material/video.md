## MVideo 视频

## 基本使用
通过src设置视频地址

<ExampleDoc>
<VideoDemo />
<template #code>

<<< @/examples/videoDemo.vue

</template>
</ExampleDoc>


## 多种画质
src可接收数组，设置多种画质，并可以通过quality属性指定画质

<ExampleDoc>
<VideoQuality />
<template #code>

<<< @/examples/videoDemo.vue

</template>
</ExampleDoc>


## Props

| 属性             | 说明                                                                           | 类型              | 默认值                |
| ---------------- | ------------------------------------------------------------------------------ | ----------------- | --------------------- |
| src             | 多媒体资源地址                   | `String` `Array`         | -                     |
| poster           | 封面图片地址，仅MVideo有效                                                                  | `String`         | -                     |
| autoplay         | 是否自动播放                                                                     | `Boolean`         | `false`               |
| loop             | 是否循环播放                                                                       | `Boolean`         | `false`               |
| muted            | 是否静音                                                                           | `Boolean`         | `false`               |
| currentTime      | 当前播放时间                                                                       | `Number`         | -                     |
| volume           | 音量                                                                           | `Number`         | -                   |
| speed            | 播放速度                                                                           | `Number`         | `1`                   |
| quality          | 画质，仅MVideo有效                                                                          | `Number`         | -                   |
| crossorigin      | 跨域设置                                                                           | `anonymous` `use-credentials`         | -                     |
| blankVideo       | 空白视频地址，仅MVideo有效                                          | `String`         | -                     |
## Events

| 事件名称 | 说明             | 回调参数        |
| -------- | ---------------- | --------------- |
| `progress`         | Sent periodically to inform interested parties of progress downloading the media. Information about the current amount of the media that has been downloaded is available in the media element's `buffered` attribute. |
| `playing`          | Sent when the media begins to play (either for the first time, after having been paused, or after ending and then restarting).                                                                                         |
| `play`             | Sent when playback of the media starts after having been paused; that is, when playback is resumed after a prior `pause` event.                                                                                        |
| `pause`            | Sent when playback is paused.                                                                                                                                                                                          |
| `timeupdate`       | The time indicated by the element's `currentTime` attribute has changed.                                                                                                                                               |
| `volumechange`     | Sent when the audio volume changes (both when the volume is set and when the `muted` state is changed).                                                                                                                |
| `seeking`          | Sent when a seek operation begins.                                                                                                                                                                                     |
| `seeked`           | Sent when a seek operation completes.                                                                                                                                                                                  |
| `ratechange`       | Sent when the playback speed changes.                                                                                                                                                                                  |
| `ended`            | Sent when playback completes. _Note:_ This does not fire if `autoplay` is true.                                                                                                                                        |
| `enterfullscreen`  | Sent when the player enters fullscreen mode (either the proper fullscreen or full-window fallback for older browsers).                                                                                                 |
| `exitfullscreen`   | Sent when the player exits fullscreen mode.                                                                                                                                                                            |
| `captionsenabled`  | Sent when captions are enabled.                                                                                                                                                                                        |
| `captionsdisabled` | Sent when captions are disabled.                                                                                                                                                                                       |
| `languagechange`   | Sent when the caption language is changed.                                                                                                                                                                             |
| `controlshidden`   | Sent when the controls are hidden.                                                                                                                                                                                     |
| `controlsshown`    | Sent when the controls are shown.                                                                                                                                                                                      |
| `ready`            | Triggered when the instance is ready for API calls.     
| `loadstart`      | Sent when loading of the media begins.                                                                                                                                                                                                                                                                                                         |
| `loadeddata`     | The first frame of the media has finished loading.                                                                                                                                                                                                                                                                                             |
| `loadedmetadata` | The media's metadata has finished loading; all attributes now contain as much useful information as they're going to.                                                                                                                                                                                                                          |
| `qualitychange`  | The quality of playback has changed.                                                                                                                                                                                                                                                                                                           |
| `canplay`        | Sent when enough data is available that the media can be played, at least for a couple of frames. This corresponds to the `HAVE_ENOUGH_DATA` `readyState`.                                                                                                                                                                                     |
| `canplaythrough` | Sent when the ready state changes to `CAN_PLAY_THROUGH`, indicating that the entire media can be played without interruption, assuming the download rate remains at least at the current level. _Note:_ Manually setting the `currentTime` will eventually fire a `canplaythrough` event in firefox. Other browsers might not fire this event. |
| `stalled`        | Sent when the user agent is trying to fetch media data, but data is unexpectedly not forthcoming.                                                                                                                                                                                                                                              |
| `waiting`        | Sent when the requested operation (such as playback) is delayed pending the completion of another operation (such as a seek).                                                                                                                                                                                                                  |
| `emptied`        | he media has become empty; for example, this event is sent if the media has already been loaded (or partially loaded), and the `load()` method is called to reload it.                                                                                                                                                                         |
| `cuechange`      | Sent when a `TextTrack` has changed the currently displaying cues.                                                                                                                                                                                                                                                                             |
| `error`          | Sent when an error occurs. The element's `error` attribute contains more information. 
