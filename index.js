// Spectral synthesizer adapted from https://github.com/grz0zrg/fs


const HydraSynth = require('hydra-synth')
const Editor = require('./src/editor.js')
const Canvas = require('./src/canvas.js')
const loop = require('raf-loop')
var Audio = require('./fs_audio.js')

var presentationIndex = 0
var audioInitialized = false
function init () {


  var options = {
    _fps: 60,
    _canvas_height: 400,
    _canvas_width: 400,
    _notification: (str) => { console.log(str)}
  }

  // TO DO:: add notes processing function from fsynth/graphics.js

  // for (i = 0; i < _output_channels; i += 1) {
  //                 tmp_buffer.push(new _synth_data_array(_data[i]));
  //             }
  //
  //             _notesProcessing(_prev_data, _data);
  //
  //             for (i = 0; i < _output_channels; i += 1) {
  //                 _prev_data[i] = tmp_buffer[i];
  //             }
  //         }

  window.onclick = () => {
    if(!audioInitialized){
      audioInitialized = true
      var audio = new Audio(options)

      // only read one row of pixelsthis.
      var canvas = document.createElement('canvas')
      canvas.width = options._canvas_width
      canvas.height = options._canvas_height
      canvas.style.width = '70%'
      canvas.style.height = '100%'
      canvas.style.position = 'absolute'
      //  canvas.style.zIndex = -10
      document.getElementById('hydra-ui').appendChild(canvas)

      var playCanvas = document.createElement('canvas')
      playCanvas.width = options._canvas_width
      playCanvas.height = options._canvas_height

      playCanvas.style.width = '70%'
      playCanvas.style.height = '100%'
      playCanvas.style.position = 'absolute'
      //  playCanvas.style.backgroundColor = 'rgba(0, 0, 0, 0)'
      document.getElementById('hydra-ui').appendChild(playCanvas)

      var ctx = playCanvas.getContext("2d");
      ctx.fillStyle = "white"
      ctx.fillRect(playCanvas.width/3, 0, 2, playCanvas.height)

      // should this be Float32Array?
      var pixelBuffer =  new Uint8Array(4 * canvas.height)
      var prevBuffer = new Uint8Array(4 * canvas.height)

      var hydra = new HydraSynth ({
        canvas: canvas,
        autoLoop: false
      })

      //  initial code
      shape(2, 0.02, 0.1).modulate(noise(10, 0.03).pixelate(2).color(1, 0.7), 0.4).scrollY(-0.15).scrollX(0, 0.02).modulateScale(o0).diff(o0).scale(1.01).blend(solid(), 0.4).out()

      var gl = hydra.regl._gl

      const engine = loop((dt) => {
        hydra.tick(dt)

        gl.readPixels(canvas.width/3, 0, 1, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixelBuffer)

        var tempBuffer = new Uint8Array(pixelBuffer)
        var tempBufferPrev = new Uint8Array(prevBuffer)
        prevBuffer = new Uint8Array(pixelBuffer)
        audio._notesProcessing([tempBufferPrev], [tempBuffer])

      }).start()

      audio._playWorklet()
    }
  }

  var editor = new Editor()
  //var menu = new Menu({ editor: editor, hydra: hydra})
  editor.cm.setValue(presentation[0].code)
  editor.evalAll()

  // hush clears what you see on the screen
  window.hush = () => {
    solid().out()
    solid().out(o1)
    solid().out(o2)
    solid().out(o3)
    render(o0)
  }

}

window.onload = init
