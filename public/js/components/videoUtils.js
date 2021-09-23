'use strict';

exports.getDevicesInfo = async () => {
    // trigger user permission ack to enable enumeration
    let stream = null;
    if (navigator.permissions &&
        (typeof navigator.permissions.requestAll === 'function')) {
        await navigator.permissions.requestAll([{name:'camera'},
                                                {name:'microphone'}]);
    } else {
        stream = await navigator.mediaDevices
            .getUserMedia({audio: true, video: true});
    }
    const devicesInfo = await navigator.mediaDevices
          .enumerateDevices();
    stream && stream.getTracks().forEach((track) => track.stop());
    return devicesInfo;
};


exports.requestFrame = (video, callback) =>
    ('requestVideoFrameCallback' in window.HTMLVideoElement.prototype) ?
      video.requestVideoFrameCallback(callback) :
      requestAnimationFrame(callback);

exports.cancelFrame = (video, handle) =>
      ('cancelVideoFrameCallback' in window.HTMLVideoElement.prototype) ?
      video.cancelVideoFrameCallback(handle) :
      cancelAnimationFrame(handle);
