<template>
  <div class="loading-warp">
    <div class="loading">
      <div><span></span></div>
      <div><span></span></div>
      <div><span></span></div>
    </div>
  </div>
</template>

<style>
.loading-warp {
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: fixed;
  top: -75px;
  bottom: 0;
  left: 0;
  right: 0;
}
.loading {
  width: 60px;
  height: 60px;
  margin: 0 auto;
  position: relative;
  animation: load 3s linear infinite;
}
.loading div {
  width: 100%;
  height: 100%;
  position: absolute;
}
.loading span {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #99cc66;
  position: absolute;
  left: 50%;
  margin-top: -10px;
  margin-left: -10px;
  animation: changeBgColor 3s ease infinite;
}
@keyframes load {
  0% {
    transform: rotate(0deg);
  }
  33.3% {
    transform: rotate(120deg);
  }
  66.6% {
    transform: rotate(240deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
@keyframes changeBgColor {
  0%,
  100% {
    background: #99cc66;
  }
  33.3% {
    background: #ffff66;
  }
  66.6% {
    background: #ff6666;
  }
}
.loading div:nth-child(2) {
  transform: rotate(120deg);
}
.loading div:nth-child(3) {
  transform: rotate(240deg);
}
.loading div:nth-child(2) span {
  animation-delay: 1s;
}
.loading div:nth-child(3) span {
  animation-delay: 2s;
}
</style>
