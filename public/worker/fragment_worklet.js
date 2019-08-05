/*
 * Fragment additive synthesis engine using AudioWorklet.
 */

class FragmentWorkletProcessor extends AudioWorkletProcessor {
    constructor() {
        super();

        this.oscillators = [];
        this.note_buffer = [];
        this.next_note_buffer = [];
        this.wavetable = [];
        this.note_time_samples = 0;
        this.lerp_t_step = 0;
        this.lerp_t = 0;
        this.curr_sample = 0;
        this.wavetable_size = 0;
        this.wavetable_size_m1 = 0;
        this.play = false;

        this.port.onmessage = (event) => {
            var w = event.data,
                score_height,

                note_buffer,

                prev_data,
                data,

                pvl = 0, pvr = 0, pr, pg, r, g,
                inv_full_brightness,

                dlen,
                y, i,
                volume_l, volume_r,
                index = 0,
                li = 0,
                ri = 1,

                ili = 0,
                iri = 0;

            if (w.type === 0) { // initialization
                this.oscillators = w.oscillators;

                this.note_time_samples = w.nts;
                this.lerp_t_step = w.lts;

                this.wavetable = (function (wsize) {
                        var wavetable = new Float32Array(wsize),

                            wave_phase = 0,
                            wave_phase_step = 2 * Math.PI / wsize,

                            s = 0;

                        for (s = 0; s < wsize; s += 1) {
                            wavetable[s] = Math.sin(wave_phase);

                            wave_phase += wave_phase_step;
                        }

                        return wavetable;
                    })(w.wsize);
                this.wavetable_size = w.wsize;
                this.wavetable_size_m1 = w.wsize - 1;
            } else if (w.type === 1) {
                this.play = false;
            } else if (w.type === 2) {
                this.play = true;
            } else { // pixels data
                this.next_note_buffer = new Float32Array(w.d);
            }
        };
    }


    process(inputs, outputs, parameters) {
        let output = outputs[0];

        let output_data_l = output[0];
        let output_data_r = output[0];

        if (output.length > 1) {
            output_data_r = output[1];
        }

        if (!this.play || this.oscillators.length === 0) {
            for (let i = 0; i < output_data_l.length; ++i) {
                output_data_l[i] = 0;
                output_data_r[i] = 0;
            }

            return true;
        }

        let osc = null;

        let output_l = 0;
        let output_r = 0;

        let s = 0;

        let note_buffer = this.note_buffer;

        let lerp_t_step = this.lerp_t_step;

        let lerp_t = this.lerp_t;

        let wavetable_size = this.wavetable_size;
        let wavetable_size_m1 = this.wavetable_size_m1;

        let curr_sample = this.curr_sample;

        for (let i = 0; i < output_data_l.length; ++i) {
            output_l = 0.0;
            output_r = 0.0;

            for (let j = 0; j < note_buffer.length; j += 5) {
                var osc_index         = note_buffer[j],
                    previous_volume_l = note_buffer[j + 1],
                    previous_volume_r = note_buffer[j + 2],
                    diff_volume_l     = note_buffer[j + 3],
                    diff_volume_r     = note_buffer[j + 4];

                osc = this.oscillators[osc_index];

                s = this.wavetable[osc.phase_index & wavetable_size_m1];

                output_l += (previous_volume_l + diff_volume_l * lerp_t) * s;
                output_r += (previous_volume_r + diff_volume_r * lerp_t) * s;

                osc.phase_index += osc.phase_step;
/*
                if (osc.phase_index >= wavetable_size) {
                    osc.phase_index -= wavetable_size;
                }
*/
                osc.phase_index &= wavetable_size_m1;
            }

            output_data_l[i] = output_l;
            output_data_r[i] = output_r;

            lerp_t += lerp_t_step * 1.0;
            lerp_t = Math.min(lerp_t, 1.0);

            curr_sample += 1;

            if (curr_sample >= this.note_time_samples) {
                lerp_t_step = 0;
                curr_sample = 0;

                if (this.note_buffer !== this.next_note_buffer) {
                    lerp_t = 0;

                    lerp_t_step = 1 / this.note_time_samples;

                    this.note_buffer = this.next_note_buffer;

                    note_buffer = this.note_buffer;

                    this.port.postMessage({ done: true });
                }
            }
        }

        this.lerp_t = lerp_t;
        this.curr_sample = curr_sample;

        return true;
    }
}

registerProcessor('fragment-worklet-processor', FragmentWorkletProcessor);
