import { useState, useMemo, useEffect } from 'react'
import { useIsMobile } from '../../hooks/useIsMobile'

// ── Palette (matches app-wide tokens) ────────────────────────────────────────
const C = {
  cyan:   '#00e5ff',
  orange: '#ff8c00',
  amber:  '#ffb300',
  purple: '#a78bfa',
  green:  '#00ff88',
  blue:   '#4a90d9',
  coral:  '#ff6b35',
  red:    '#ff3d00',
}

// ── Glossary data ─────────────────────────────────────────────────────────────
// Each entry: { id, term, category, formal, eli5, seeAlso? }

const GLOSSARY = [
  // ── ELECTRICAL FUNDAMENTALS ──────────────────────────────────────────────
  {
    id: 'impedance',
    term: 'Impedance',
    symbol: 'Ω (ohms)',
    category: 'Electrical Fundamentals',
    formal:
      'Impedance is the total opposition a circuit presents to alternating current (AC). It combines resistance (which opposes all current) and reactance (which opposes changes in current due to inductance and capacitance in a speaker\'s voice coil and crossover network). Measured in ohms (Ω), it varies with frequency. A speaker\'s nominal impedance is its average AC impedance across its operating band, used as the standard reference for amplifier matching.',
    eli5:
      'Imagine water flowing through a garden hose. Impedance is how hard the hose makes it for the water to flow. A thick hose (low impedance, like 4 Ω) lets lots of water through easily — great for power delivery, but hard work for the pump (your amp). A thin hose (high impedance, like 16 Ω) restricts the flow. Your amp has a minimum hose-width it can handle before it overheats.',
    seeAlso: ['nominal-impedance', 'parallel-wiring', 'series-wiring', 'ohms-law'],
  },
  {
    id: 'nominal-impedance',
    term: 'Nominal Impedance',
    symbol: 'Ω',
    category: 'Electrical Fundamentals',
    formal:
      'The nominal impedance of a loudspeaker is a single-number approximation of its complex, frequency-dependent impedance curve, standardized per IEC 60268-5. It represents the minimum impedance that an amplifier will encounter across the speaker\'s usable frequency range. In practice, a speaker rated "8 Ω nominal" may dip to 6 Ω or rise to 30 Ω at different frequencies. Amplifier matching is based on nominal impedance.',
    eli5:
      'A speaker\'s "8 ohm" rating isn\'t a fixed number — it\'s more like an average label. The actual resistance changes depending on the pitch of the sound playing through it. The nominal number tells the amp "plan for this much resistance most of the time." It\'s like saying a road is "mostly flat" even though it has a few bumps.',
    seeAlso: ['impedance', 'parallel-wiring'],
  },
  {
    id: 'ohms-law',
    term: "Ohm's Law",
    symbol: 'V = I × R',
    category: 'Electrical Fundamentals',
    formal:
      'Ohm\'s Law states that the voltage (V) across a conductor is directly proportional to the current (I) flowing through it, with the constant of proportionality being resistance (R): V = IR. For audio power amplifiers, this extends to P = V²/R (power equals voltage squared divided by impedance), which explains why an amplifier delivers more power into a lower-impedance load — the same output voltage drives more current.',
    eli5:
      'Three things describe electricity: push (voltage), flow (current), and resistance (impedance). Ohm\'s Law says they\'re locked together: push harder and more flows; add more resistance and less flows. In speakers, this means your amp delivers more power into a 4 Ω speaker than an 8 Ω one — same voltage, but less resistance means more current, which means more power.',
    seeAlso: ['impedance', 'rms-power', 'bridged-mode'],
  },
  {
    id: 'voltage',
    term: 'Voltage',
    symbol: 'V (volts)',
    category: 'Electrical Fundamentals',
    formal:
      'Voltage is the electric potential difference between two points in a circuit, measured in volts (V). In audio, it represents the amplitude of the audio signal. A power amplifier raises a small line-level voltage (typically ±1–2 V peak) to a high speaker-level voltage (up to ±100 V peak for large systems). The output voltage swing of an amplifier, combined with the speaker impedance, determines delivered power.',
    eli5:
      'Voltage is electrical pressure — like the difference in water level between two tanks. High pressure pushes more water (current) through the pipe. Your amplifier takes the tiny electrical whisper from a mixing console and amplifies it into a powerful electrical shout that can push a speaker cone back and forth hard enough to fill a 5,000-person venue.',
    seeAlso: ['ohms-law', 'rms-power', 'bridged-mode'],
  },
  {
    id: 'current',
    term: 'Current',
    symbol: 'A (amperes)',
    category: 'Electrical Fundamentals',
    formal:
      'Current is the rate of flow of electric charge through a conductor, measured in amperes (A). In audio power amplification, current delivery capability is critical for driving low-impedance loads. An amplifier must supply high instantaneous current (up to 50 A in touring-class amplifiers) when driving low-impedance speaker arrays, especially during transient peaks. Inadequate current capability causes amplifier clipping and thermal stress.',
    eli5:
      'If voltage is water pressure, current is how fast the water actually flows. A fat pipe lets tons of water through quickly; a thin pipe slows it down. When you wire many speakers together in parallel, the total impedance drops — the amp suddenly needs to push a much bigger rush of current. Amps that can\'t supply enough current start to distort and overheat.',
    seeAlso: ['ohms-law', 'parallel-wiring', 'clipping'],
  },
  {
    id: 'wattage',
    term: 'Wattage (Power)',
    symbol: 'W (watts)',
    category: 'Electrical Fundamentals',
    formal:
      'Electrical power in audio systems is measured in watts (W), defined as P = V × I = V²/R = I²R. Audio specifications distinguish several power ratings: continuous (RMS) power — the steady-state thermal capacity; program power — typically 2× RMS, reflecting real music\'s duty cycle; and peak power — the instantaneous maximum, often 4× RMS. Amplifier and speaker ratings must be compared on the same basis to assess compatibility.',
    eli5:
      'Watts tell you how much electrical work is being done per second — like horsepower for electricity. A 1,000-watt amplifier can push 1,000 joules of energy into speakers every second. But watch out: amp watts and speaker watts must be compared fairly. An amp rated "1,000 W" and a speaker rated "500 W RMS" is a 2× ratio — fine. A 2,000 W amp into that same speaker is risky.',
    seeAlso: ['rms-power', 'peak-power', 'power-ratio'],
  },

  // ── POWER & AMPLIFICATION ────────────────────────────────────────────────
  {
    id: 'rms-power',
    term: 'RMS Power (Continuous)',
    symbol: 'W RMS',
    category: 'Power & Amplification',
    formal:
      'RMS (Root Mean Square) power, also called continuous or AES power, is the average power a loudspeaker can handle indefinitely without thermal failure, measured using a standardized pink noise stimulus per AES2-1984. For amplifiers, it represents the continuous sine-wave output power into a resistive load. RMS power is the correct metric for comparing amplifier output to speaker power handling, as it reflects real thermal stress under sustained programme material.',
    eli5:
      'RMS power is the "safe all-day" number. A speaker rated "500 W RMS" can handle 500 watts continuously without its voice coil burning up. Think of it like a car engine\'s sustained cruising speed vs. its redline. The RMS number is what you should match between your amp and speakers — it\'s the rating that matters for keeping your gear alive during a 4-hour show.',
    seeAlso: ['peak-power', 'power-ratio', 'clipping'],
  },
  {
    id: 'peak-power',
    term: 'Peak / Program Power',
    symbol: 'W peak',
    category: 'Power & Amplification',
    formal:
      'Peak power is the maximum instantaneous power a loudspeaker can withstand without mechanical failure (voice coil displacement, suspension damage). Program power typically equals 2× RMS and reflects the crest factor of real music — transients can momentarily exceed the RMS level by 10–20 dB. Amplifier peak output is limited by power supply headroom and rail voltage. Matching amplifier peak output to speaker program rating provides headroom for transients without exceeding mechanical limits.',
    eli5:
      'Music has loud moments — a kick drum hit, a crash cymbal — that spike way above the average volume. Peak power handles those short bursts. A speaker might handle 500 W continuously but survive 1,000 W for a split second. It\'s like how you can sprint for 10 seconds but can\'t run a marathon at sprint pace. Peak ratings let your system handle the exciting loud moments without blowing a driver.',
    seeAlso: ['rms-power', 'power-ratio', 'clipping'],
  },
  {
    id: 'power-ratio',
    term: 'Power Ratio (Amp-to-Speaker)',
    symbol: 'P_amp ÷ P_speaker',
    category: 'Power & Amplification',
    formal:
      'The power ratio is the quotient of amplifier output power (at the operating load impedance) divided by the combined RMS power rating of the connected speakers. Industry guidelines recommend a ratio of 1.0×–2.0× for clean headroom, with 0.5× as the minimum safe threshold before chronic clipping risk, and 4.0× as the absolute maximum before mechanical driver damage becomes imminent. A ratio above 1.0× ensures the amplifier is never driven into clipping to achieve desired SPL.',
    eli5:
      'The power ratio tells you if your amp and speakers are a fair match. A ratio of 1.5× means "my amp is 50% more powerful than my speakers." That\'s fine — good, even, because clean peaks need headroom. A ratio of 0.1× means your amp is starving your speakers; it will distort trying to keep up (clipping). A ratio of 5× means your amp can literally blow the speakers apart at full volume. This app flags ratios below 0.5× and above 4.0×.',
    seeAlso: ['rms-power', 'clipping', 'bridged-mode'],
  },
  {
    id: 'bridged-mode',
    term: 'Bridged Mode (Mono Bridging)',
    category: 'Power & Amplification',
    formal:
      'Bridged mono operation combines both channels of a stereo amplifier to drive a single speaker load. One channel is inverted in polarity and the two channels are connected in series across the load, effectively doubling the voltage swing. This increases power output by approximately 4× (3–4× in practice due to rail and current limits). However, the minimum safe load impedance doubles — an amplifier stable to 2 Ω per channel becomes stable to only 4 Ω in bridged mode. Exceeding minimum impedance in bridged mode causes amplifier failure.',
    eli5:
      'Bridging is like having two people push the same door from opposite sides at just the right moment — you get double the push force. A stereo amp normally drives two separate speakers; bridged, both channels team up to drive one speaker with much more power. The catch: bridging makes the amp more sensitive to low impedance. If your speakers are wired to a very low impedance, the combined push becomes too much for the amp\'s circuitry to handle, and it overheats or shuts down.',
    seeAlso: ['impedance', 'power-ratio', 'parallel-wiring'],
  },
  {
    id: 'clipping',
    term: 'Clipping',
    category: 'Power & Amplification',
    formal:
      'Clipping occurs when an amplifier is driven beyond its linear operating range, causing the output waveform to be truncated ("clipped") at the supply rail voltage rather than following the input signal. Clipped waveforms contain large amounts of high-frequency harmonic distortion (odd-order harmonics). This harmonic energy significantly increases the average power delivered to tweeters and high-frequency drivers, which are typically rated for far less power than woofers, frequently causing thermal driver failure. An underpowered amplifier running at its limits is more dangerous than an overpowered one used conservatively.',
    eli5:
      'Clipping is what happens when you ask an amp to be louder than it physically can be. Instead of a smooth wave, the tops and bottoms get cut flat — "clipped." The nasty part: a clipped wave sounds harsh AND silently pumps extra heat into the speaker\'s tweeter. Tweeters are small and fragile. This is actually why an underpowered amp is more dangerous than an overpowered one — it clips constantly trying to keep up, slowly cooking the treble drivers while you wonder why your speakers sound scratchy.',
    seeAlso: ['power-ratio', 'rms-power', 'amp-underpowered'],
  },
  {
    id: 'amp-underpowered',
    term: 'Underpowering (Amplifier)',
    category: 'Power & Amplification',
    formal:
      'An amplifier is considered underpowered relative to its speaker load when its RMS output is below 0.5× the combined speaker RMS rating. Underpowering forces the amplifier to operate near its clipping threshold to achieve adequate SPL, increasing harmonic distortion and average DC-content heating of voice coils. Contrary to intuition, underpowering is a leading cause of driver failure in live audio. The standard recommendation is to use an amplifier with 1.0×–2.0× the combined speaker RMS rating.',
    eli5:
      'A too-small amp is like a small car engine in a large truck. It\'s always floored, always straining, always on the verge of overheating. In audio, that strain produces clipping distortion that can damage speakers more than a larger amp used at moderate volume. The fix is simple: use a bigger amp and turn the gain down. A powerful amp playing at 50% volume is safer and sounds better than a weak amp at 100%.',
    seeAlso: ['clipping', 'power-ratio', 'rms-power'],
  },
  {
    id: 'dynamic-headroom',
    term: 'Dynamic Headroom',
    symbol: 'dB',
    category: 'Power & Amplification',
    formal:
      'Dynamic headroom is the difference in dB between an amplifier\'s continuous (RMS) power output and its short-term peak power capability. Amplifiers with large power supply capacitors can deliver peak bursts significantly above their rated RMS output for brief periods (< 1 second). This headroom handles transient audio peaks — snare hits, kick drums, brass stabs — without clipping, even when the average program level is well below the rated continuous power.',
    eli5:
      'Headroom is your safety cushion. Imagine driving at 60 mph but your speedometer goes to 120 mph — you have room to speed up briefly without hitting a wall. In audio, headroom is the gap between your average loudness and the loudest moment you can handle cleanly. More headroom means transient drum hits and explosions in film sound won\'t clip, even if the average level is moderate. It\'s why professional systems are sized well above their "typical" use case.',
    seeAlso: ['clipping', 'rms-power', 'peak-power'],
  },

  // ── WIRING & CONFIGURATION ───────────────────────────────────────────────
  {
    id: 'parallel-wiring',
    term: 'Parallel Wiring',
    symbol: '1/Z = Σ(1/Zᵢ)',
    category: 'Wiring & Configuration',
    formal:
      'In parallel wiring, all speaker cabinets share the same positive and negative terminals from the amplifier, so the same voltage is applied across each cabinet. The total combined impedance follows 1/Z_total = Σ(1/Zᵢ). Two identical 8 Ω cabinets in parallel produce 4 Ω; four produce 2 Ω. Parallel wiring is standard in live audio because each additional cabinet adds volume and the amplifier voltage (and thus power) is applied to each cabinet independently. The tradeoff is that total impedance decreases with each added cabinet, eventually reaching the amplifier\'s minimum safe load.',
    eli5:
      'Parallel wiring is like adding more lanes to a highway. Each speaker gets its own direct connection to the amp, with the same voltage across all of them. But every speaker you add makes the amp\'s job harder, because the total "resistance" drops (more lanes means more traffic can flow). Two 8-ohm speakers wired in parallel = 4 ohms total. Keep adding speakers and eventually the amp overheats trying to push current through such low resistance.',
    seeAlso: ['impedance', 'series-wiring', 'bridged-mode'],
  },
  {
    id: 'series-wiring',
    term: 'Series Wiring',
    symbol: 'Z = ΣZᵢ',
    category: 'Wiring & Configuration',
    formal:
      'In series wiring, speakers are connected end-to-end — the positive terminal of the amplifier connects to one speaker, which connects to the next, which connects back to the amplifier\'s negative terminal. Total impedance is the simple sum: Z_total = ΣZᵢ. Two 8 Ω cabinets produce 16 Ω. Series wiring is rarely used in professional live audio because total power is split among cabinets, the failure of one cabinet silences all others, and the higher impedance reduces total delivered power. It is occasionally used to raise impedance when a parallel combination would fall below the amplifier\'s safe minimum.',
    eli5:
      'Series wiring chains speakers like Christmas lights — electricity flows through one, then the next, then back to the amp. The resistance of each speaker adds up (two 8-ohm speakers = 16 ohms total). The problem: higher total impedance means less total power delivered, each speaker gets only a portion of the output, and if one blows it takes all the others offline. Pros almost always use parallel wiring; series is a last resort when impedance is already too low.',
    seeAlso: ['impedance', 'parallel-wiring'],
  },
  {
    id: 'channel',
    term: 'Amplifier Channel',
    category: 'Wiring & Configuration',
    formal:
      'An amplifier channel is a discrete amplification path: a single input signal fed through gain stages, a power output stage, and a speaker output terminal pair. A stereo amplifier contains two channels. In live audio, each amplifier channel drives an independent speaker zone (e.g., left array, right array, subwoofer, delay ring). Channels can be configured independently for sensitivity, gain, limiter threshold, and filter settings when DSP is present. Multi-channel amplifiers (4–8 channels) are common for distributed systems, monitors, and fills.',
    eli5:
      'An amplifier channel is one "lane" of amplification. A stereo amp has two lanes — left and right. A 4-channel amp has four lanes, each able to drive a completely different group of speakers. In a venue, you\'d typically dedicate one channel to the left speaker array, one to the right, one to subs, one to monitors, and so on. Each channel can be set to a different volume and EQ independently.',
    seeAlso: ['bridged-mode', 'parallel-wiring'],
  },
  {
    id: 'bi-amping',
    term: 'Bi-amping',
    category: 'Wiring & Configuration',
    formal:
      'Bi-amping is a configuration in which separate amplifier channels drive the low-frequency and high-frequency driver sections of a single loudspeaker cabinet, bypassing the passive crossover. An active crossover (electronic) divides the full-range signal into LF and HF bands before amplification. This allows independent gain, EQ, and limiter settings per frequency band, eliminates passive crossover power loss, and allows smaller, optimized amplifiers for each band. Passive bi-amping (two amps with the passive crossover still in circuit) provides some current benefits but is less efficient than active bi-amping.',
    eli5:
      'Bi-amping means having a dedicated amp for the woofer and a separate amp for the tweeter in the same speaker cabinet. Instead of one big amp sending everything to the speaker and letting a passive filter sort it out, you split the signal electronically before amplification. The bass amp only amplifies bass; the treble amp only amplifies treble. Result: better control, less wasted power in the passive crossover, and independent protection for each driver.',
    seeAlso: ['crossover', 'dsp', 'channel'],
  },
  {
    id: 'crossover',
    term: 'Crossover',
    category: 'Wiring & Configuration',
    formal:
      'A crossover is a filter network that divides a full-range audio signal into separate frequency bands, directing each band to an appropriate transducer. A passive crossover uses capacitors, inductors, and resistors placed between the amplifier output and the individual drivers; it requires no power but dissipates some as heat. An active (electronic) crossover processes the signal before amplification using op-amps or DSP algorithms, providing adjustable filter slopes (6–48 dB/octave), alignment delay, and driver-specific limiting. The crossover frequency is the point at which the filter transitions responsibility between bands.',
    eli5:
      'A crossover is a traffic cop for sound frequencies. Low notes (bass) are heavy and need big speakers (woofers). High notes (treble) are light and need small speakers (tweeters). The crossover listens to all the sound coming in and says "you bass notes go left to the woofer, you treble notes go right to the tweeter." Without it, you\'d be sending bass vibrations to a tiny tweeter and blowing it up within seconds.',
    seeAlso: ['bi-amping', 'dsp', 'frequency-response'],
  },

  // ── SIGNAL PATH ──────────────────────────────────────────────────────────
  {
    id: 'signal-chain',
    term: 'Signal Chain',
    category: 'Signal Path',
    formal:
      'The signal chain describes the complete path of an audio signal from source to transducer: microphone → preamp → mixing console → equalizer → crossover/DSP → power amplifier → loudspeaker. Each stage adds gain, filtering, or processing. Maintaining signal integrity requires proper gain staging at each point to maximize dynamic range while minimizing noise floor and preventing clipping. In live audio, the signal chain typically includes digital consoles with onboard DSP followed by additional system processing and amplification.',
    eli5:
      'The signal chain is the journey sound takes from a microphone (or music player) to your ears via the speakers. It\'s like a bucket brigade — each person (device) in the chain does their job and passes it on. If anyone in the chain drops the bucket (introduces distortion, hum, or cuts the signal), the sound coming out the other end suffers. Good signal chain design makes sure the signal is always "just right" — not too quiet (noisy), not too loud (distorted).',
    seeAlso: ['dsp', 'clipping', 'line-level'],
  },
  {
    id: 'line-level',
    term: 'Line Level',
    category: 'Signal Path',
    formal:
      'Line level is the standard operating signal level used to transfer audio between professional equipment (mixers, processors, amplifiers). Professional line level is nominally +4 dBu (≈1.23 V RMS), while consumer equipment uses −10 dBV (≈0.316 V RMS). Line-level connections carry a low-power audio signal — they do not have sufficient voltage or current to drive loudspeakers. XLR balanced connections are the professional standard for line-level signal transmission, providing common-mode noise rejection over long cable runs.',
    eli5:
      'Line level is the "normal conversation voice" of the audio world — not a whisper (microphone level) and not a shout (speaker level). It\'s the standard volume at which mixers, effects units, and the inputs of power amplifiers all talk to each other. XLR cables carry line-level signal. Critically: a line-level XLR connection on an amplifier\'s input is NOT the same as the speaker-level Speakon output — plugging the wrong things into the wrong jacks can cause damage.',
    seeAlso: ['speaker-level', 'signal-chain', 'connector-xlr'],
  },
  {
    id: 'speaker-level',
    term: 'Speaker Level',
    category: 'Signal Path',
    formal:
      'Speaker-level signal is the amplified output of a power amplifier, carrying sufficient voltage and current to directly drive loudspeaker voice coils. Voltages range from a few volts to over 100 V peak for large touring amplifiers. Speaker-level connections must use appropriately rated cables (typically 12–16 AWG for short runs) and connectors rated for the current (Speakon NL4 is rated for 30 A per contact pair). Connecting a speaker-level output directly to a line-level input will destroy the input stage of the receiving device.',
    eli5:
      'Speaker level is the big, powerful signal that comes out of your amplifier — it\'s carrying real electrical force to physically push speaker cones. Think of it as the difference between whispering in someone\'s ear (line level) versus using a megaphone (speaker level). Speaker-level cables (like Speakon) are thick and rugged because they carry a lot of current. Never plug a speaker output into a mixer input — the high voltage will fry the mixer\'s electronics instantly.',
    seeAlso: ['line-level', 'connector-speakon-nl4', 'connector-xlr'],
  },
  {
    id: 'active-speaker',
    term: 'Active (Powered) Speaker',
    category: 'Signal Path',
    formal:
      'An active loudspeaker integrates a power amplifier, active crossover, and often a DSP system within the same enclosure as the transducers. It accepts a line-level signal directly from a mixing console. Active designs allow the amplifier to be precisely matched to the driver characteristics, enabling factory-optimized DSP presets, built-in limiting, thermal management, and diagnostic outputs. Active speakers do not require an external amplifier and must never be connected to amplifier speaker outputs.',
    eli5:
      'An active (or "powered") speaker is a speaker with the amplifier already built inside. You plug it directly into the mixer with an XLR cable (line level in), and it takes care of the rest internally. It\'s the all-in-one approach — like a combo microwave/oven vs. having separate appliances. The convenience tradeoff is less flexibility for large-scale system design, but for most applications they\'re fast to set up and already optimized by the factory.',
    seeAlso: ['passive-speaker', 'line-level', 'dsp'],
  },
  {
    id: 'passive-speaker',
    term: 'Passive Speaker',
    category: 'Signal Path',
    formal:
      'A passive loudspeaker contains only transducers (drivers) and a passive crossover network — no amplification. It requires an external power amplifier to drive it via a speaker-level connection (Speakon or binding posts). Passive designs offer greater system flexibility — amplifiers can be shared, upgraded, or tailored independently of cabinets. Large touring systems are commonly passive because they benefit from purpose-built DSP/amplification systems with system-level calibration and protection algorithms.',
    eli5:
      'A passive speaker is like a traditional stereo speaker — it has the woofer and tweeter, but no amplifier inside. You must connect it to a separate power amp with a speaker cable (Speakon). Without an amp, it makes no sound at all. Most large touring systems use passive speakers because the venue\'s amp racks give engineers more control over each speaker zone independently, and amps are easier to repair and upgrade than rebuilding an entire active cabinet.',
    seeAlso: ['active-speaker', 'speaker-level', 'rms-power'],
  },
  {
    id: 'dsp',
    term: 'DSP (Digital Signal Processing)',
    category: 'Signal Path',
    formal:
      'Digital Signal Processing in professional audio refers to microprocessor-based manipulation of a digitized audio signal for equalization, delay, dynamic limiting, crossover filtering, and speaker protection. In loudspeaker systems, DSP is used to compensate for driver response irregularities, implement time alignment between drivers, apply manufacturer-defined protection curves (limiter thresholds based on driver thermal and excursion limits), and provide tailored presets for each speaker cabinet. Onboard DSP in amplifiers is accessed via proprietary software (e.g., Funktion-One FFA, d&b R1, L-Acoustics P1) that enforces ecosystem-specific calibration.',
    eli5:
      'DSP is the computer brain of a speaker system. It can adjust the sound electronically before it reaches the speaker — boosting certain frequencies, cutting others, delaying one speaker slightly so it lines up perfectly with another, and most importantly: protecting the speaker from signals that would damage it. When an amp manufacturer says it has DSP presets for a specific speaker, that means the computer already knows exactly how loud is too loud for each driver, and it will automatically limit the signal to keep the hardware safe.',
    seeAlso: ['crossover', 'bi-amping', 'limiter', 'cross-manufacturer-dsp'],
  },
  {
    id: 'limiter',
    term: 'Limiter',
    category: 'Signal Path',
    formal:
      'A limiter is a dynamics processor that prevents a signal from exceeding a defined threshold (the "ceiling"). Unlike a compressor (which gradually reduces gain above a threshold with a ratio < ∞:1), a limiter applies a very high ratio (typically ≥ 10:1 or brick-wall ∞:1), preventing any signal from exceeding the threshold. In loudspeaker protection, limiters are calibrated to the speaker\'s RMS and peak power limits to prevent thermal and mechanical failure. Fast-attack limiters (< 1 ms) protect against high-frequency transient overloads; slower thermal limiters protect against sustained high-power operation.',
    eli5:
      'A limiter is an automatic brick wall. Set the ceiling at 500 watts, and no matter how loud the mix gets, the limiter makes sure the speaker never sees more than 500 watts. It\'s like a governor on a car engine — you can push the gas pedal to the floor, but the car won\'t go above 100 mph. In a speaker system, limiters are the last line of defense against burned voice coils and blown tweeters. Without them, one accidental feedback squeal could destroy thousands of dollars of equipment in seconds.',
    seeAlso: ['dsp', 'clipping', 'power-ratio'],
  },
  {
    id: 'cross-manufacturer-dsp',
    term: 'Cross-Manufacturer DSP Compatibility',
    category: 'Signal Path',
    formal:
      'Manufacturer-specific DSP ecosystems (such as Funktion-One FFA, d&b audiotechnik D80, L-Acoustics LA12X) encode proprietary speaker protection and equalization curves that are valid only for the speaker cabinets in that manufacturer\'s product line. Pairing an amplifier from one manufacturer with speakers from another loses these calibrated presets, requiring manual configuration of crossover frequencies, limiter thresholds, and equalization curves. Using cross-manufacturer combinations without proper custom DSP setup risks driver damage from inadequate protection, suboptimal frequency response, and time alignment errors.',
    eli5:
      'When a speaker brand and amp brand make products together, they program the amp with a special recipe specifically for that speaker — the exact EQ curve, the exact protection limits, everything dialed in. Mix brands (e.g., a Funktion-One amp with a Meyer Sound speaker), and that recipe is gone. The amp doesn\'t know how fragile the tweeter is or what frequency needs to be cut slightly for a flat response. You can still make it work, but you need a trained engineer to manually configure all those settings, or you risk damaging the speakers.',
    seeAlso: ['dsp', 'limiter'],
  },

  // ── ACOUSTICS ────────────────────────────────────────────────────────────
  {
    id: 'spl',
    term: 'SPL — Sound Pressure Level',
    symbol: 'dB SPL',
    category: 'Acoustics',
    formal:
      'Sound Pressure Level is a logarithmic measure of the effective pressure of a sound wave relative to the threshold of human hearing (20 µPa), expressed in decibels (dB SPL). The SPL scale spans from 0 dB (threshold of hearing) to approximately 194 dB (maximum physical limit at sea level). Practical limits: 85 dB is the OSHA 8-hour continuous exposure limit; 110–120 dB is typical front-of-house SPL for live concerts; 130 dB is the threshold of pain; and 140+ dB causes immediate physical damage. Maximum SPL for a loudspeaker is specified at 1 m on-axis and represents the limit before significant distortion or mechanical damage.',
    eli5:
      'SPL is how we measure loudness in a way that matches how human ears actually perceive sound. The decibel scale is logarithmic — an increase of 10 dB sounds roughly twice as loud, but actually represents 10× more acoustic power. A normal conversation is about 60 dB. A rock concert is around 110 dB. A jet engine at 30 meters is around 130 dB. The math in this tool adds up the SPL contributions from every speaker in the system to estimate how loud the full rig can get.',
    seeAlso: ['sensitivity-spl', 'max-spl'],
  },
  {
    id: 'sensitivity-spl',
    term: 'Sensitivity',
    symbol: 'dB SPL @ 1W/1m',
    category: 'Acoustics',
    formal:
      'Loudspeaker sensitivity is the on-axis SPL produced at 1 meter distance when driven by 1 watt of pink noise (or 2.83 V RMS into an 8 Ω load, which equals 1 W). Typical sensitivities range from 88 dB/W/m for studio monitors to 105 dB/W/m for high-efficiency touring systems. Each 3 dB increase in sensitivity approximately doubles the acoustic output for the same input power. For a given power level, a 100 dB/W/m speaker is roughly 4× louder than a 94 dB/W/m speaker. High-sensitivity designs are critical in large venues where driving distances and coverage requirements demand maximum efficiency.',
    eli5:
      'Sensitivity tells you how efficient a speaker is — how much sound you get out for the power you put in. A sensitivity of 100 dB/W/m means: "put in 1 watt, and at 1 meter away, you\'ll measure 100 decibels." A speaker rated 94 dB/W/m needs 4 watts to achieve the same 100 dB. In a big venue, high sensitivity saves you money on amplifier power — a more efficient speaker can fill a room with a smaller, cheaper amp.',
    seeAlso: ['spl', 'rms-power', 'wattage'],
  },
  {
    id: 'frequency-response',
    term: 'Frequency Response',
    symbol: 'Hz',
    category: 'Acoustics',
    formal:
      'Frequency response describes the range of audio frequencies a loudspeaker can reproduce within a specified amplitude tolerance, expressed as a frequency range (e.g., 60 Hz–20 kHz) with an associated tolerance window (±3 dB, −6 dB, or −10 dB). Wider frequency response indicates coverage of more of the audible spectrum (20 Hz–20 kHz). Low-frequency extension defines the subwoofer integration point; high-frequency extension determines treble clarity and "air." The −6 dB specification (used in this application) denotes the frequency at which output has dropped to half power relative to the passband average.',
    eli5:
      'Frequency response tells you what range of musical notes a speaker can reproduce. Low frequencies are bass (rumble, kick drum, bass guitar), high frequencies are treble (cymbals, vocals\' clarity, consonants in speech). A spec of "60 Hz–20 kHz" means the speaker handles everything from deep bass to the highest thing a human can hear. A subwoofer might only go up to 120 Hz because it\'s designed specifically for bass — it can\'t and shouldn\'t reproduce highs.',
    seeAlso: ['crossover', 'subwoofer', 'full-range'],
  },
  {
    id: 'coverage-pattern',
    term: 'Coverage Pattern (Dispersion)',
    symbol: '° H × V',
    category: 'Acoustics',
    formal:
      'Coverage pattern describes the angular area over which a loudspeaker maintains output within 6 dB of its on-axis level, specified separately for horizontal (H) and vertical (V) planes (e.g., 90° H × 60° V). Horizontal coverage determines audience width coverage at a given throw distance; vertical coverage determines the depth of coverage area. Cabinet design (horn geometry, driver arrangement) controls dispersion. Line arrays exploit controlled vertical coverage (typically 5°–10° V) stacked in arcs to achieve long-throw consistent coverage over large audience areas.',
    eli5:
      'Coverage pattern is the "spray width" of a speaker. A speaker rated 90° horizontal means its sound spreads 45° to the left and 45° to the right of where it\'s pointing. Aim it at the middle of a wide crowd and the edges still hear it clearly. A very narrow speaker (10° beam) is like a flashlight — great for throwing sound far down a long narrow space (like a delay tower pointed at the back of a large venue) but useless for covering a wide area.',
    seeAlso: ['spl', 'line-array', 'fill-speaker'],
  },
  {
    id: 'decibel',
    term: 'Decibel (dB)',
    symbol: 'dB',
    category: 'Acoustics',
    formal:
      'The decibel is a dimensionless logarithmic unit expressing the ratio between two quantities on a power or amplitude scale. In audio, it is used for multiple distinct measurements: dB SPL (acoustic pressure level), dBu and dBV (signal voltage level), dB gain (amplification ratio), and dBFS (digital full-scale headroom). Because the decibel is logarithmic, differences are multiplicative: +6 dB represents 4× power, +10 dB represents 10× power, +20 dB represents 100× power. This compression of scale makes decibels practical for describing the enormous dynamic range of human hearing (~120 dB, or a 10¹² difference in acoustic power).',
    eli5:
      'The decibel is a way to measure big changes using small numbers, because our ears are built that way — they can hear a pin drop AND a jet engine. The trick: each 10 dB step is actually 10 times more power, but only sounds about twice as loud to our ears. That\'s why +3 dB doesn\'t feel like much even though it\'s actually double the acoustic power. Think of it like a percentage-based bank interest — compounding means the numbers grow faster than they feel like they should.',
    seeAlso: ['spl', 'sensitivity-spl'],
  },

  // ── SPEAKER TYPES ────────────────────────────────────────────────────────
  {
    id: 'full-range',
    term: 'Full-Range / Point Source',
    category: 'Speaker Types',
    formal:
      'A full-range loudspeaker reproduces the complete audio spectrum typically covered by a main PA system, integrating woofers and compression drivers with passive or active crossovers. Point-source cabinets project sound from a single acoustic center, which simplifies phase coherence at the listening position and provides predictable, wide-horizontal coverage patterns. They are typically deployed as hangs, stacks, or in arrays for main PA coverage in venues up to medium scale.',
    eli5:
      'A full-range speaker is a "do everything" box — it plays bass, midrange, and treble all from the same cabinet. Point-source means the sound appears to come from one single location (a point), which makes the acoustics predictable. Think of it like a traditional hi-fi bookshelf speaker, except scaled up for a concert venue. They work great for small to mid-size rooms where you need one speaker per zone rather than a complex multi-element array.',
    seeAlso: ['line-array', 'subwoofer', 'frequency-response'],
  },
  {
    id: 'line-array',
    term: 'Line Array',
    category: 'Speaker Types',
    formal:
      'A line array is a system of loudspeaker elements with closely spaced, matched transducers arranged in a vertical column. When properly configured, line source theory (J-array or cardioid array) describes the sound as cylindrical wave propagation — losing only 3 dB per doubling of distance vs. the 6 dB of a point source. Vertical coverage is controlled by the arc angle between adjacent elements; horizontal coverage is determined by each element\'s individual waveguide. Modern line arrays use DSP to apply per-element delay and gain for beam steering, splay optimization, and near-to-far field transition management.',
    eli5:
      'A line array is a vertical stack of identical speaker elements hung from a ceiling or truss. When you stack them correctly with precise angles, the sound beams outward in a tight sheet — like a horizontal fan of sound — instead of spreading in all directions. This is why concert audiences from front to back hear roughly the same volume. The physics make the volume drop off more slowly with distance than a single box. It\'s the dominant technology for large concert halls, arenas, and outdoor festivals.',
    seeAlso: ['full-range', 'coverage-pattern', 'dsp'],
  },
  {
    id: 'subwoofer',
    term: 'Subwoofer',
    category: 'Speaker Types',
    formal:
      'A subwoofer is a loudspeaker optimized for reproduction of low-frequency audio content, typically in the range of 20–120 Hz. Large-diameter drivers (12"–21") in ported or bandpass enclosures produce high SPL at low frequencies. Due to the long wavelengths of bass frequencies (2.8 m at 120 Hz; 17 m at 20 Hz), multiple subwoofers are often arrayed in cardioid, end-fire, or gradient configurations to control directivity and reduce low-frequency buildup behind the arrays. Subwoofers require high-power amplification due to the relatively low efficiency of moving large amounts of air at low frequencies.',
    eli5:
      'A subwoofer is a speaker built specifically for bass — the kick drum thump, the bass guitar, the rumble you feel in your chest at a concert. Regular speakers struggle to reproduce very low notes because it takes a lot of air movement to create them. A subwoofer uses a big, heavy speaker cone that can push lots of air back and forth slowly. They\'re always separate from the main speakers, and professional systems often use many of them together in specific positions to make the bass hit evenly throughout the venue.',
    seeAlso: ['full-range', 'frequency-response', 'crossover'],
  },
  {
    id: 'monitor',
    term: 'Stage Monitor (Wedge)',
    category: 'Speaker Types',
    formal:
      'A stage monitor, or "wedge," is a loudspeaker placed on the stage floor angled upward toward a performer, delivering a mix of the performer\'s own voice or instrument for self-monitoring during performance. Wedges are designed for high-SPL reproduction in a near-field environment (0.5–2 m) with a low-profile form factor that avoids blocking sightlines. They require dedicated amplifier channels driven from dedicated monitor mixes on the mixing console. Stage monitors can create feedback issues when the frequency response overlaps with open microphones on the same stage.',
    eli5:
      'Stage monitors (wedges) are the speakers on the stage floor that face the musicians — not the audience. They let performers hear themselves and their bandmates clearly over the stage noise and main PA sound. Without monitors, a singer can\'t tell if they\'re in tune or if the band can hear each other. Each musician typically gets their own custom mix (more of my guitar, less drums, etc.) fed to the monitor closest to them.',
    seeAlso: ['full-range', 'channel', 'active-speaker'],
  },
  {
    id: 'fill-speaker',
    term: 'Fill Speaker (Front-Fill / Delay / In-Fill)',
    category: 'Speaker Types',
    formal:
      'Fill speakers supplement the main PA system in areas that receive insufficient coverage from primary arrays. Front-fills are small speakers at the stage lip covering the first several rows directly in front of the stage, which are typically in the shadow zone of hung line arrays. In-fills cover the center of the audience between two widely-spaced main arrays. Delay speakers are distributed throughout the rear of a large venue, fed with a time-aligned (delayed) copy of the main PA signal to reinforce rear audience areas without localization artifacts ("I can hear a distant echo"). All fill speakers require precise DSP delay alignment relative to the main system to maintain apparent source localization.',
    eli5:
      'Fill speakers are helpers that cover the spots where the main speakers can\'t reach. The first few rows right in front of a stage are often in a "dead zone" — the main hang is too high to aim straight down at them. A row of small front-fill speakers along the stage edge fixes this. Delay speakers at the back of a venue work like relay runners, passing the sound backward so the back rows don\'t have to rely solely on the sound traveling all the way from the front. They\'re delayed slightly so the sound from the front and back arrives at the same time.',
    seeAlso: ['line-array', 'coverage-pattern', 'dsp'],
  },

  // ── CONNECTORS ───────────────────────────────────────────────────────────
  {
    id: 'connector-speakon-nl4',
    term: 'Speakon NL4',
    symbol: 'NL4',
    category: 'Connectors',
    formal:
      'The Neutrik Speakon NL4 is a 4-pole locking speaker cable connector rated for 30 A per contact pair (pins 1+/1− and 2+/2−). Its locking twist-and-push mechanism prevents accidental disconnection in live touring conditions. The NL4 carries two independent speaker circuits: 1+/1− for the primary (low-frequency or full-range) path and 2+/2− for a secondary (high-frequency) path, enabling bi-amp connections via a single cable. It is the de facto standard for professional touring speaker cable connections in North America and Europe.',
    eli5:
      'The Speakon NL4 is the professional standard plug for connecting power amplifiers to passive speakers. You\'ve seen them — round, with a twist-lock that won\'t fall out mid-show. The "4" means it has 4 pins inside, which allows it to carry either one powerful speaker signal or two signals (for bi-amped speakers) through one cable. They\'re much safer than old-fashioned ¼" connectors because they lock in place and can\'t be pulled out accidentally, and they can handle high current without sparking.',
    seeAlso: ['connector-speakon-nl2', 'connector-speakon-nl8', 'speaker-level', 'bi-amping'],
  },
  {
    id: 'connector-speakon-nl2',
    term: 'Speakon NL2',
    symbol: 'NL2',
    category: 'Connectors',
    formal:
      'The Neutrik Speakon NL2 is the 2-pole version of the Speakon family, rated for 30 A (pins 1+/1−). Physically identical to NL4 but with only one signal pair, it is used for single-channel speaker connections. NL2 connectors are intermateable with NL4 sockets — an NL2 plug will connect to an NL4 socket using only the 1+/1− contacts. Primarily found in smaller, budget-oriented amplifiers and speaker cabinets; NL4 is preferred in touring applications for its greater flexibility.',
    eli5:
      'The Speakon NL2 is the smaller sibling to the NL4 — same shape, same locking mechanism, but only two pins instead of four. It can carry one speaker signal. It fits into NL4 sockets just fine for simple connections. Most professional touring gear uses NL4 because you get extra flexibility at no extra cost, but NL2 is still common in smaller systems and permanent installations.',
    seeAlso: ['connector-speakon-nl4', 'speaker-level'],
  },
  {
    id: 'connector-speakon-nl8',
    term: 'Speakon NL8',
    symbol: 'NL8',
    category: 'Connectors',
    formal:
      'The Neutrik Speakon NL8 is an 8-pole locking connector rated for 30 A per contact pair. With four independent signal paths (1+/1−, 2+/2−, 3+/3−, 4+/4−), it enables tri-amp or even quad-amp connectivity through a single cable to a multi-way passive speaker. It is less common than NL4, primarily used in high-specification touring systems where enclosures contain three or four separate driver sections requiring independent amplification.',
    eli5:
      'The Speakon NL8 is the top-tier version with 8 pins — four separate signal lanes in one connector. This is used in very complex professional systems where a single speaker cabinet has three or four separate driver sections (subwoofer, mid-bass, midrange, tweeter) each needing its own amp channel. One fat cable from the amp rack to the speaker cabinet, with four independent audio paths inside. It\'s the multi-lane highway version of the speaker cable world.',
    seeAlso: ['connector-speakon-nl4', 'bi-amping'],
  },
  {
    id: 'connector-xlr',
    term: 'XLR (3-Pin Balanced)',
    symbol: 'XLR',
    category: 'Connectors',
    formal:
      'The XLR-3 is a 3-pin locking audio connector standardized for balanced line-level signal connections in professional audio. Pin 1: shield/ground; Pin 2: signal positive (+); Pin 3: signal negative (−). The balanced configuration uses common-mode rejection to cancel electromagnetic interference inducted equally into both signal conductors over long cable runs. XLR connectors are rated for signal levels only (line level, microphone level, AES3 digital) and are NOT suitable for speaker-level amplifier outputs despite appearing on some consumer/semi-professional amplifiers.',
    eli5:
      'XLR is the standard audio cable connector used everywhere in professional audio — microphones, mixers, amplifier inputs, and effects units. The three pins carry a "balanced" signal: the same audio on two wires but with flipped polarity, plus a ground. Any electrical noise that gets into the cable gets picked up equally on both wires, and the balanced input cancels it out. This is why long runs of XLR cable through a venue\'s electrical noise environment still arrive clean. Critical warning: XLR carries line-level audio, NOT speaker power. Never connect an amplifier\'s Speakon speaker output to an XLR input.',
    seeAlso: ['line-level', 'speaker-level', 'connector-speakon-nl4'],
  },
  {
    id: 'connector-xlr5',
    term: 'XLR 5-Pin (AES3 Digital)',
    symbol: 'AES/EBU',
    category: 'Connectors',
    formal:
      'The XLR-5 connector carries AES3 (AES/EBU) digital audio — a professional serial digital audio interface that transmits up to two channels of PCM audio (up to 24-bit/192 kHz) over 110 Ω balanced line per the AES3-2003 standard. Physically it uses a 5-pin XLR shell, distinguishable from the 3-pin analog version. AES3 connections are used in digital mixing consoles, digital signal processors, and high-end amplifiers to maintain signal integrity in digital format until the final conversion stage.',
    eli5:
      'XLR 5-pin carries digital audio — it\'s like a USB cable for professional audio equipment. Instead of sending an analog electrical wave that represents sound, it sends a stream of numbers (1s and 0s) that describe the sound with extreme precision. Digital connections are immune to the hum and interference problems that can affect analog cables, which is why they\'re used in high-end systems where long cable runs and electrical environments could otherwise degrade quality.',
    seeAlso: ['connector-xlr', 'dsp'],
  },
  {
    id: 'connector-powercon',
    term: 'PowerCon (Blue & Grey)',
    symbol: 'NAC3',
    category: 'Connectors',
    formal:
      'Neutrik PowerCon is a locking AC mains power connector used on active loudspeakers and powered equipment in live audio. The blue NAC3FCA (input) connects AC power from wall/distro to the device; the grey NAC3FCB (output/through) allows power daisy-chaining from one active speaker to the next via a "powerCon grey-to-blue" cable. The locking mechanism prevents accidental AC disconnection during operation. PowerCon is rated for 16 A @ 250 V AC, sufficient for most professional powered speakers. It is NOT compatible with standard IEC or Schuko connectors without an adapter.',
    eli5:
      'PowerCon connectors are the locking power plugs you see on active (powered) speakers. The blue one is where power comes IN to the speaker from the wall. The grey one lets you daisy-chain power OUT to another speaker — instead of running a separate extension cord to each speaker, you can plug them together in a chain. The locking mechanism is critical: regular power plugs can fall out mid-show; a PowerCon twists and locks so it takes deliberate effort to disconnect.',
    seeAlso: ['active-speaker'],
  },
  {
    id: 'connector-binding-post',
    term: 'Binding Post',
    category: 'Connectors',
    formal:
      'Binding posts are screw-terminal speaker cable connectors accepting bare wire, spade lugs, or banana plugs. They are rated for lower current than Speakon connectors (typically 15–20 A) and lack a locking mechanism, making them unsuitable for touring applications where cable tension or movement could cause disconnection. Binding posts are found on residential hi-fi equipment and some semi-professional amplifiers. Their use in professional live audio is limited to permanent installations where cables are fixed and current demands are modest.',
    eli5:
      'Binding posts are the screw-terminal connectors on the back of home hi-fi amplifiers and speakers — you push a bare wire end in, tighten a knob, and it holds the wire in place. They work fine for home use where the equipment never moves. In live touring, they\'re avoided because vibration, accidental kicks, and cable tension can cause them to loosen or disconnect during a show. Professional touring gear uses Speakon connectors that lock firmly in place.',
    seeAlso: ['connector-speakon-nl4', 'speaker-level'],
  },
  {
    id: 'connector-trs',
    term: 'TRS ¼" (6.35 mm)',
    symbol: '¼" TRS',
    category: 'Connectors',
    formal:
      'The ¼-inch TRS (Tip-Ring-Sleeve) connector carries either a balanced mono audio signal or an unbalanced stereo signal at line level. In professional audio, TRS is used for balanced line connections on outboard gear, insert points on mixing consoles (tip = send, ring = return), and headphone monitoring outputs. Unlike XLR, TRS offers no locking mechanism and is rated for lower current. In loudspeaker systems, TRS connections are limited to signal-level applications and permanent installation speakers (e.g., ceiling speakers, background music systems) at low power levels.',
    eli5:
      'A ¼" TRS is the headphone jack made big. The "TRS" stands for Tip-Ring-Sleeve (the three metal parts visible on the plug). It can carry a stereo signal (tip = left, ring = right) for headphones, or a balanced mono signal (tip = signal+, ring = signal−) for professional audio gear. You see them on guitar amplifiers, keyboards, and audio interfaces. In speaker systems, they\'re only used for low-power permanent installations — they\'re not rugged enough for touring amplifiers driving large speaker arrays.',
    seeAlso: ['connector-xlr', 'line-level'],
  },
]

// ── Categories config ─────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'All Terms',              color: '#7070a8', icon: '◈' },
  { name: 'Electrical Fundamentals', color: C.cyan,   icon: '⚡' },
  { name: 'Power & Amplification',  color: C.orange,  icon: '📡' },
  { name: 'Wiring & Configuration', color: C.amber,   icon: '⎇'  },
  { name: 'Signal Path',            color: C.purple,  icon: '↝'  },
  { name: 'Acoustics',              color: C.green,   icon: '◉'  },
  { name: 'Speaker Types',          color: C.blue,    icon: '□'  },
  { name: 'Connectors',             color: C.coral,   icon: '⌁'  },
]

function categoryColor(name) {
  return CATEGORIES.find(c => c.name === name)?.color ?? '#7070a8'
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GlossaryModal({ onClose, inline = false }) {
  const isMobile = useIsMobile()

  const [activeCategory, setActiveCategory] = useState('All Terms')
  const [search,         setSearch]         = useState('')
  const [expandedEli5,   setExpandedEli5]   = useState({})

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return GLOSSARY.filter(entry => {
      const matchCat  = activeCategory === 'All Terms' || entry.category === activeCategory
      const matchSearch = !q || (
        entry.term.toLowerCase().includes(q)        ||
        entry.formal.toLowerCase().includes(q)      ||
        entry.eli5.toLowerCase().includes(q)        ||
        (entry.symbol ?? '').toLowerCase().includes(q)
      )
      return matchCat && matchSearch
    })
  }, [activeCategory, search])

  function toggleEli5(id) {
    setExpandedEli5(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function scrollToTerm(id) {
    document.getElementById(`glossary-entry-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ── Inner panel ─────────────────────────────────────────────────────────────
  // Shared by both inline (mobile tab) and modal (desktop overlay) modes.
  // inline=true  → rendered directly inside the tab panel, no overlay wrapper
  // inline=false → rendered inside a fixed full-screen modal overlay
  const panel = (
    <div
      className="relative flex flex-col overflow-hidden"
      style={inline ? {
        // Fills the tab panel container completely
        width: '100%', height: '100%', background: '#0f0f20',
      } : {
        width:        isMobile ? '100vw'          : 'min(96vw, 1100px)',
        height:       isMobile ? '100dvh'         : 'min(94vh, 820px)',
        maxHeight:    isMobile ? '100dvh'         : 'min(94vh, 820px)',
        borderRadius: isMobile ? '0'              : '0.75rem',
        border:       isMobile ? 'none'           : '1px solid #3c3c68',
        background:   '#0f0f20',
        boxShadow:    isMobile ? 'none' : '0 0 60px #00e5ff14, 0 24px 80px #00000088',
      }}
    >
        {/* ── Header ────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: '#28284e' }}
        >
          <div>
            <div className="text-xs font-mono uppercase tracking-widest" style={{ color: C.cyan }}>
              Sound Design Lab · Reference
            </div>
            <div className="text-sm font-bold text-white font-mono tracking-wide">
              Glossary
              <span className="text-xs font-normal ml-2 font-mono" style={{ color: '#7070a8' }}>
                {GLOSSARY.length} terms
              </span>
            </div>
          </div>

          {/* Search — always visible */}
          <input
            type="search"
            placeholder="Search…"
            value={search}
            onChange={e => { setSearch(e.target.value); setActiveCategory('All Terms') }}
            className="text-xs font-mono px-3 py-1.5 rounded border outline-none mx-3 flex-1 max-w-[200px]"
            style={{
              background:  '#161626',
              borderColor: '#3c3c68',
              color:       '#e0e0f0',
            }}
            onFocus={e => { e.target.style.borderColor = C.cyan }}
            onBlur={e  => { e.target.style.borderColor = '#3c3c68' }}
          />

          <button
            onClick={onClose}
            aria-label="Close glossary"
            className="w-9 h-9 rounded flex items-center justify-center text-slate-400
                       hover:text-white hover:bg-white/10 transition-colors font-mono text-lg
                       flex-shrink-0 touch-target-lg"
          >
            ×
          </button>
        </div>

        {/* ── Mobile category pills ──────────────────────────────────── */}
        <div
          className="flex sm:hidden overflow-x-auto gap-2 px-3 py-2 flex-shrink-0 scrollbar-none border-b"
          style={{ borderColor: '#1e1e36' }}
          role="tablist"
          aria-label="Filter by category"
        >
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat.name && !search
            return (
              <button
                key={cat.name}
                role="tab"
                aria-selected={active}
                onClick={() => { setActiveCategory(cat.name); setSearch('') }}
                className="flex-shrink-0 text-[10px] font-mono px-2.5 py-1.5 rounded-full
                           border transition-colors whitespace-nowrap"
                style={{
                  borderColor: active ? cat.color : '#3c3c68',
                  color:       active ? cat.color : '#7070a8',
                  background:  active ? cat.color + '18' : 'transparent',
                }}
              >
                {cat.icon} {cat.name === 'All Terms' ? 'All' : cat.name.split(' ')[0]}
              </button>
            )
          })}
        </div>

        {/* ── Body ──────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar — desktop only */}
          <nav
            className="hidden sm:flex w-52 flex-shrink-0 border-r flex-col overflow-y-auto py-2"
            style={{ borderColor: '#28284e', background: '#0b0b18' }}
            aria-label="Category navigation"
          >
            {CATEGORIES.map(cat => {
              const count  = cat.name === 'All Terms'
                ? GLOSSARY.length
                : GLOSSARY.filter(e => e.category === cat.name).length
              const active = activeCategory === cat.name && !search

              return (
                <button
                  key={cat.name}
                  onClick={() => { setActiveCategory(cat.name); setSearch('') }}
                  className="flex items-center gap-2 px-3 py-2 text-left transition-colors w-full"
                  style={{
                    background:  active ? cat.color + '18' : 'transparent',
                    borderLeft:  active ? `2px solid ${cat.color}` : '2px solid transparent',
                    color:       active ? cat.color : '#7070a8',
                  }}
                >
                  <span className="text-base leading-none w-4 flex-shrink-0" aria-hidden="true">{cat.icon}</span>
                  <span className="text-[11px] font-mono flex-1">{cat.name}</span>
                  <span
                    className="text-[9px] font-mono rounded px-1"
                    style={{
                      background: active ? cat.color + '22' : '#1e1e36',
                      color:      active ? cat.color : '#4a4a6a',
                    }}
                  >
                    {count}
                  </span>
                </button>
              )
            })}

            {/* Quick Rules callout */}
            <div className="mt-4 mx-3 border-t pt-3" style={{ borderColor: '#1e1e36' }}>
              <div className="text-[8px] font-mono uppercase tracking-widest mb-2" style={{ color: '#4a4a6a' }}>
                Quick Rules
              </div>
              {[
                { label: 'Power ratio', rule: '0.5× – 2× RMS', color: C.amber },
                { label: 'Hard limit',  rule: '< 4× RMS',      color: C.orange },
                { label: 'Parallel Z',  rule: '1/Z = Σ(1/Zᵢ)', color: C.cyan },
                { label: 'Bridged min', rule: '2× min load',    color: C.purple },
              ].map(r => (
                <div key={r.label} className="mb-1.5">
                  <div className="text-[8px] font-mono" style={{ color: '#4a4a6a' }}>{r.label}</div>
                  <div className="text-[9px] font-mono" style={{ color: r.color }}>{r.rule}</div>
                </div>
              ))}
            </div>
          </nav>

          {/* Term list */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
            {filtered.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-2xl mb-2">⌕</div>
                  <div className="text-sm font-mono" style={{ color: '#4a4a6a' }}>No terms match "{search}"</div>
                </div>
              </div>
            )}

            {filtered.map(entry => {
              const color         = categoryColor(entry.category)
              const eli5Open      = expandedEli5[entry.id] !== false
              const isDefaultOpen = expandedEli5[entry.id] === undefined

              return (
                <div
                  id={`glossary-entry-${entry.id}`}
                  key={entry.id}
                  className="rounded-lg border overflow-hidden"
                  style={{ borderColor: '#28284e', background: '#161626' }}
                >
                  {/* Term header */}
                  <div
                    className="flex items-start gap-3 px-4 py-3 border-b"
                    style={{ borderColor: '#1e1e36', borderLeft: `3px solid ${color}` }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-sm font-bold font-mono text-white">{entry.term}</span>
                        {entry.symbol && (
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ color, background: color + '18' }}>
                            {entry.symbol}
                          </span>
                        )}
                        <span
                          className="text-[8px] font-mono px-1.5 py-0.5 rounded border ml-auto"
                          style={{ color, borderColor: color + '44', background: color + '0d' }}
                        >
                          {entry.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Formal definition */}
                  <div className="px-4 pt-3 pb-2">
                    <div className="text-[9px] font-mono uppercase tracking-widest mb-1.5" style={{ color: '#4a4a6a' }}>
                      Formal Definition
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: '#c0c0d8' }}>
                      {entry.formal}
                    </p>
                  </div>

                  {/* ELI5 toggle */}
                  <div className="px-4 pb-3">
                    <button
                      onClick={() => toggleEli5(entry.id)}
                      aria-expanded={isDefaultOpen || eli5Open}
                      className="flex items-center gap-2 text-[9px] font-mono uppercase
                                 tracking-widest mb-1.5 transition-colors touch-target"
                      style={{
                        color: (isDefaultOpen || eli5Open) ? C.amber : '#4a4a6a',
                        minHeight: '32px',
                      }}
                    >
                      <span aria-hidden="true">{(isDefaultOpen || eli5Open) ? '▾' : '▸'}</span>
                      Explain Like I&apos;m 5
                    </button>

                    {(isDefaultOpen || eli5Open) && (
                      <div
                        className="rounded-md px-3 py-2.5"
                        style={{ background: '#1a1a08', borderLeft: `2px solid ${C.amber}44` }}
                      >
                        <p className="text-xs leading-relaxed" style={{ color: '#d4c090' }}>
                          {entry.eli5}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* See also */}
                  {entry.seeAlso && entry.seeAlso.length > 0 && (
                    <div
                      className="px-4 py-2 border-t flex items-center gap-2 flex-wrap"
                      style={{ borderColor: '#1e1e36' }}
                    >
                      <span className="text-[8px] font-mono uppercase tracking-widest" style={{ color: '#4a4a6a' }}>
                        See also:
                      </span>
                      {entry.seeAlso.map(ref => {
                        const target = GLOSSARY.find(e => e.id === ref)
                        if (!target) return null
                        const refColor = categoryColor(target.category)
                        return (
                          <button
                            key={ref}
                            onClick={() => {
                              setActiveCategory('All Terms')
                              setSearch('')
                              setTimeout(() => scrollToTerm(ref), 50)
                            }}
                            className="text-[9px] font-mono px-1.5 py-1 rounded border
                                       transition-colors touch-target"
                            style={{ color: refColor, borderColor: refColor + '44', background: refColor + '0d' }}
                          >
                            {target.term}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <div
          className="px-4 py-2 border-t flex items-center justify-between flex-shrink-0"
          style={{
            borderColor: '#1e1e36',
            background:  '#0b0b18',
            paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
          }}
        >
          <span className="text-[9px] font-mono" style={{ color: '#3c3c68' }}>
            {filtered.length} of {GLOSSARY.length} terms
          </span>
          <span className="hidden sm:block text-[9px] font-mono" style={{ color: '#3c3c68' }}>
            Press <kbd className="px-1 rounded" style={{ background: '#1e1e36', color: '#7070a8' }}>Esc</kbd> to close
          </span>
        </div>
    </div>  // end panel
  )

  // Inline mode: panel fills the mobile tab container directly — no overlay
  if (inline) return panel

  // Modal mode: panel sits inside a fixed full-screen overlay
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: '#000000cc', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {panel}
    </div>
  )
}
