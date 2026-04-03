"""
Educational content library.

Each compatibility rule has a plain-English explanation and a recommendation
so new hires learn *why* a connection is valid or problematic, not just whether it is.
"""
from app.models.enums import IssueCode

EXPLANATIONS: dict[IssueCode, dict[str, str]] = {
    IssueCode.PASSIVE_NEEDS_AMP: {
        "explanation": (
            "Passive speakers have no built-in amplifier. They contain only drivers (woofers, "
            "tweeters, compression drivers) and a passive crossover network. Without a power "
            "amplifier to raise the line-level signal (typically −10 dBV to +4 dBu) to a "
            "speaker-level signal (tens of volts at several amps), the drivers will produce "
            "virtually no sound — or none at all."
        ),
        "recommendation": (
            "Assign a compatible power amplifier to this channel. Match the amplifier's output "
            "impedance rating to the total speaker load, and keep the power ratio between "
            "1× and 2× the speaker's continuous (RMS) power rating."
        ),
    },
    IssueCode.ACTIVE_NO_EXTERNAL_AMP: {
        "explanation": (
            "Active (self-powered) speakers already contain an amplifier — and often a DSP — "
            "matched specifically to their drivers. They accept a balanced line-level XLR signal "
            "directly from a mixing console or signal processor."
        ),
        "recommendation": (
            "Connect this speaker directly to a line-level output (console aux send, matrix "
            "output, or DSP output) using a balanced XLR cable. No external power amplifier "
            "is needed or should be inserted in the signal chain."
        ),
    },
    IssueCode.ACTIVE_CONNECTED_TO_AMP: {
        "explanation": (
            "Connecting the speaker-level output of an external power amplifier to an active "
            "speaker's XLR input would send a very high-voltage, high-current signal into an "
            "input stage designed for millivolt-level balanced audio. This will instantly destroy "
            "the input electronics and may damage the internal amplifier as well."
        ),
        "recommendation": (
            "Remove the external amplifier from this channel. Run a balanced XLR cable directly "
            "from your console or DSP to the active speaker's line-level XLR input."
        ),
    },
    IssueCode.IMPEDANCE_BELOW_AMP_MINIMUM: {
        "explanation": (
            "The combined load impedance of the speakers wired to this amplifier channel falls "
            "below the amplifier's rated minimum load. Solid-state amplifiers work by driving "
            "current into the load; as impedance drops, current demand rises sharply. Below the "
            "minimum, the output transistors must source more current than they can safely handle, "
            "leading to thermal runaway, protection shutdowns, or permanent amplifier damage. "
            "\n\n"
            "Impedance in parallel: 1/Z_total = 1/Z1 + 1/Z2 + … "
            "(e.g. two 8 Ω cabinets in parallel = 4 Ω; four 8 Ω cabinets = 2 Ω)."
        ),
        "recommendation": (
            "Reduce the number of speakers on this channel, switch to series wiring to raise the "
            "total impedance, or use an amplifier rated for a lower minimum load. "
            "Always verify the amplifier's minimum impedance spec before adding cabinets."
        ),
    },
    IssueCode.IMPEDANCE_VERY_HIGH: {
        "explanation": (
            "The total speaker impedance on this channel is significantly higher than the "
            "amplifier's nominal rated load. While this is safe (no hardware damage), the "
            "amplifier will deliver far less power than its rated output, reducing maximum SPL "
            "and headroom. For example, an amp rated 2 000 W @ 4 Ω produces only ~1 000 W @ 8 Ω "
            "and ~500 W @ 16 Ω."
        ),
        "recommendation": (
            "Add a second cabinet in parallel (halving the impedance) to draw more power, "
            "or choose an amplifier with a higher wattage rating at the actual load impedance."
        ),
    },
    IssueCode.AMP_SEVERELY_OVERPOWERED: {
        "explanation": (
            "The amplifier's continuous output at this load impedance is more than four times "
            "the speaker's rated RMS power. Even brief full-level transients can deliver enough "
            "energy to rupture voice coils or shatter compression driver diaphragms. This is the "
            "most common cause of speaker damage at live events — the belief that 'headroom' "
            "means unlimited power. Headroom of 1–2× is safe; 4× and beyond is destructive."
        ),
        "recommendation": (
            "Either use an amplifier with a lower power rating, add more speaker cabinets to "
            "share the load, or install a limiter/DSP that hard-clips the signal before the "
            "amplifier stage."
        ),
    },
    IssueCode.AMP_OVERPOWERED: {
        "explanation": (
            "The amplifier output is 2–4× the speaker's RMS rating. A well-disciplined operator "
            "with good gain structure can run this safely, but any mistake — a feedback squeal, "
            "a fader bump, a hot aux return — can instantly exceed the speaker's thermal and "
            "mechanical limits. Modern PA systems use DSP limiters precisely to allow this "
            "headroom without risking driver damage."
        ),
        "recommendation": (
            "Use a DSP processor or built-in amp limiter to set a hard output ceiling no higher "
            "than 2× the speaker's RMS rating. Many touring engineers run 2× headroom "
            "intentionally — but always with limiting engaged."
        ),
    },
    IssueCode.AMP_UNDERPOWERED: {
        "explanation": (
            "The amplifier provides less than half the speaker's rated RMS power. "
            "Under-powering forces the amp to clip (square-wave distortion) when pushed toward "
            "the speaker's design SPL. A clipped signal carries far more high-frequency energy "
            "than a clean sine wave, and that energy is absorbed by compression driver diaphragms "
            "— leading to tweeter failure even though the overall wattage is low."
        ),
        "recommendation": (
            "Upgrade to an amplifier that can deliver at least 0.75–1× the speaker's RMS rating "
            "at the load impedance. Avoid the temptation to 'just turn it up' when the system "
            "sounds quiet — that almost always leads to clipping damage."
        ),
    },
    IssueCode.AMP_CLIPPING_RISK: {
        "explanation": (
            "The amplifier is operating close to its clipping threshold for the expected program "
            "material. Sustained clipping generates DC offset and high-frequency harmonics that "
            "are particularly damaging to high-frequency compression drivers."
        ),
        "recommendation": (
            "Check your gain structure: ensure the console, amp input sensitivity, and DSP "
            "output levels are aligned so that 0 dBVU on the console corresponds to "
            "approximately −18 dBFS, leaving adequate headroom before the amplifier clips."
        ),
    },
    IssueCode.CONNECTOR_MISMATCH: {
        "explanation": (
            "The output connector on the upstream device does not match the input connector on "
            "the downstream device. Using adapters is possible but introduces mechanical weak "
            "points and, in some cases (e.g. connecting an XLR mic cable to a Speakon speaker "
            "output), can send speaker-level current through cable and connectors rated only for "
            "line-level signals — creating a fire and safety hazard."
        ),
        "recommendation": (
            "Use cables with the correct connectors for the signal type: Speakon NL4 for "
            "speaker-level connections between amplifiers and passive speakers; balanced XLR for "
            "line-level connections to active speakers, consoles, and DSPs."
        ),
    },
    IssueCode.SPEAKER_LEVEL_ON_LINE_LEVEL: {
        "explanation": (
            "An XLR connector is being used on a speaker-level output. XLR is a balanced "
            "line-level standard carrying millivolts to ~4 V RMS. A power amplifier's output "
            "carries tens of volts and several amperes — orders of magnitude more current than "
            "the XLR standard specifies. Forcing speaker current through an XLR cable will "
            "destroy the cable, the connectors, and whatever is at the receiving end."
        ),
        "recommendation": (
            "Use Speakon NL4 cables for all speaker-level connections. Never use XLR for "
            "speaker outputs."
        ),
    },
    IssueCode.CROSS_MANUFACTURER_DSP: {
        "explanation": (
            "This configuration mixes speakers and amplifiers from different manufacturers. "
            "High-end systems (L-Acoustics, d&b audiotechnik, Meyer Sound) ship from the factory "
            "with precisely calibrated DSP presets — alignment filters, FIR correction, limiters, "
            "and crossover slopes — that are optimised for that brand's drivers. When you pair a "
            "speaker with a third-party amplifier that lacks these presets, you lose all of that "
            "optimisation. The result is a system that will typically sound worse and may "
            "sustain driver damage because the manufacturer's limiters are no longer active."
        ),
        "recommendation": (
            "Use the manufacturer's own amplifier/DSP ecosystem wherever possible. If cross-brand "
            "use is unavoidable, programme the equivalent filters manually in a third-party DSP "
            "(Lake, Dante, BSS, etc.) using the manufacturer's published tuning data."
        ),
    },
    IssueCode.MISSING_REQUIRED_PROCESSOR: {
        "explanation": (
            "This speaker system is designed to be driven through a dedicated DSP controller or "
            "amplified controller (e.g. L-Acoustics LA12X, d&b D80). Without it, the system "
            "lacks the crossover filters, time alignment, and limiting that protect and optimise "
            "the drivers."
        ),
        "recommendation": (
            "Add the manufacturer's recommended amplified controller to the signal chain before "
            "the speaker cabinets."
        ),
    },
    IssueCode.CHANNEL_OVERLOADED: {
        "explanation": (
            "Too many speaker cabinets are wired to a single amplifier channel, driving the "
            "combined impedance dangerously low and pushing current demand beyond safe limits."
        ),
        "recommendation": (
            "Distribute the cabinets across multiple amplifier channels, or split the load "
            "with a series/parallel combination that keeps total impedance at or above the "
            "amplifier's minimum rating."
        ),
    },
    IssueCode.NO_SPEAKERS_ON_CHANNEL: {
        "explanation": (
            "This channel has an amplifier assigned but no speakers. An unloaded amplifier "
            "output is safe on modern designs, but typically indicates a configuration error."
        ),
        "recommendation": (
            "Assign at least one speaker to the channel or remove the amplifier assignment."
        ),
    },
    IssueCode.NON_AMPLIFIER_AS_AMP: {
        "explanation": (
            "The component assigned as an amplifier on this channel is not classified as an "
            "amplifier. Using a speaker, DSP, or other component as an amplifier in a signal "
            "chain is an error in the configuration."
        ),
        "recommendation": (
            "Select a power amplifier component for this channel's amplifier slot."
        ),
    },
}


def get_education(code: IssueCode) -> dict[str, str]:
    """Return the educational explanation and recommendation for an issue code."""
    return EXPLANATIONS.get(
        code,
        {
            "explanation": "No additional information is available for this issue.",
            "recommendation": "Review the manufacturer's specification sheet.",
        },
    )
