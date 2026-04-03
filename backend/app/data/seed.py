"""
Seed data — manufacturers and components with real-world specifications.

Sources:
 • Funktion-One Evolution & F-Series datasheets (funktion-one.com)
 • Danley Sound Labs SH96, TH118, SH50, BC218 spec sheets (danleysoundlabs.com)
 • L-Acoustics K2, KS28, A15, LA12X, LA4X (l-acoustics.com)
 • d&b audiotechnik V8, V-Sub, Yi12, D80 (dbaudio.com)
 • Meyer Sound LEOPARD, LYON, 1100-LFC (meyersound.com)
 • QSC PLX3602 (qsc.com)
 • Lab.gruppen FP14000 technical data sheet
"""
from sqlalchemy.orm import Session

from app.models.manufacturer import Manufacturer
from app.models.component import Component
from app.models.enums import ComponentType, PowerType, ConnectorType


# ── Manufacturer seed data ────────────────────────────────────────────────────

MANUFACTURERS = [
    dict(
        name="Funktion-One",
        country="United Kingdom",
        founded_year=1992,
        headquarters="Surrey, UK",
        specialty="High-efficiency touring and club loudspeakers",
        dsp_ecosystem=None,
        preferred_amp_brand="Lab.gruppen / Powersoft",
        description=(
            "Founded by Tony Andrews and John Newsham, Funktion-One is celebrated for "
            "exceptional dynamic range, low distortion, and highly efficient horn-loaded "
            "designs. Their Evo and Resolution series are staples of the underground club "
            "and festival circuit worldwide."
        ),
    ),
    dict(
        name="Danley Sound Labs",
        country="United States",
        founded_year=2004,
        headquarters="Gainesville, Georgia, USA",
        specialty="Synergy Horn and Tapped Horn loudspeakers",
        dsp_ecosystem=None,
        preferred_amp_brand="Crown / Lab.gruppen",
        description=(
            "Tom Danley's patented Synergy Horn technology achieves true point-source "
            "radiation from a single aperture, producing extraordinary pattern control and "
            "sensitivity. Tapped Horn subwoofers provide exceptional low-frequency output "
            "with high efficiency."
        ),
    ),
    dict(
        name="L-Acoustics",
        country="France",
        founded_year=1984,
        headquarters="Marcoussis, France",
        specialty="Line arrays and Wavefront Sculpture Technology",
        dsp_ecosystem="LA Network Manager / Soundvision",
        preferred_amp_brand="L-Acoustics (LA12X, LA4X)",
        description=(
            "Inventors of the modern V-DOSC line array and Wavefront Sculpture Technology. "
            "L-Acoustics systems are specified on A-list tours and major venues worldwide. "
            "Their LA amplified controllers embed the brand's complete DSP ecosystem, "
            "including speaker management, time alignment, and limiting."
        ),
    ),
    dict(
        name="d&b audiotechnik",
        country="Germany",
        founded_year=1981,
        headquarters="Backnang, Germany",
        specialty="Touring and installation loudspeaker systems",
        dsp_ecosystem="ArrayCalc / R1 Remote / d&b Soundscape",
        preferred_amp_brand="d&b audiotechnik (D80, D20, 30D)",
        description=(
            "d&b is synonymous with precision engineering and system integration. "
            "Their closed ecosystem (cabinets + amplifiers + R1 remote control) ensures "
            "every component operates with factory-optimised DSP. Mission Ballroom in "
            "Denver runs a full d&b KSL / SL-Sub / D80 installation."
        ),
    ),
    dict(
        name="Meyer Sound",
        country="United States",
        founded_year=1979,
        headquarters="Berkeley, California, USA",
        specialty="Self-powered loudspeaker systems",
        dsp_ecosystem="Galileo GALAXY / NADIA / Spacemap Go",
        preferred_amp_brand="Integrated (self-powered)",
        description=(
            "Meyer Sound pioneered the self-powered loudspeaker concept, integrating "
            "precisely matched amplification and DSP inside every cabinet. Systems like "
            "LEOPARD, LYON, and the 900-LFC / 1100-LFC bass elements are found at "
            "premier concert venues and touring productions globally."
        ),
    ),
    dict(
        name="QSC",
        country="United States",
        founded_year=1968,
        headquarters="Costa Mesa, California, USA",
        specialty="Professional power amplifiers and Q-SYS platform",
        dsp_ecosystem="Q-SYS",
        preferred_amp_brand="QSC",
        description=(
            "QSC manufactures a broad range of professional power amplifiers and the "
            "Q-SYS integrated audio-video-control platform. PL-series amplifiers are "
            "widely used to drive passive speakers when a manufacturer-specific amp "
            "is not required or available."
        ),
    ),
    dict(
        name="Lab.gruppen",
        country="Sweden",
        founded_year=1979,
        headquarters="Kungsbacka, Sweden",
        specialty="High-power touring amplifiers",
        dsp_ecosystem=None,
        preferred_amp_brand="Lab.gruppen",
        description=(
            "Lab.gruppen's Class TD topology delivers audiophile-grade fidelity at "
            "staggering output levels. The FP-series is a backstage staple for "
            "driving large passive sub arrays where brute-force power is required."
        ),
    ),
]


# ── Component seed data ───────────────────────────────────────────────────────
# manufacturer_name is resolved to manufacturer_id during seeding.

COMPONENTS = [

    # ────────────────── FUNKTION-ONE ──────────────────────────────────────────

    dict(
        manufacturer_name="Funktion-One",
        name="Evo 6",
        model_number="EVO 6",
        component_type=ComponentType.FULL_RANGE,
        power_type=PowerType.PASSIVE,
        description=(
            "Compact 3-way horn-loaded system with a 15\" mid-bass, 10\" mid, and 1.4\" "
            "HF driver. 50° horizontal coverage, ideal for club and medium-venue "
            "deployments requiring controlled dispersion and high sensitivity."
        ),
        nominal_impedance_ohms=8.0,
        power_handling_rms_watts=750.0,
        power_handling_peak_watts=1500.0,
        sensitivity_db_spl=108.0,
        freq_response_low_hz=50.0,
        freq_response_high_hz=20000.0,
        max_spl_db=137.0,
        coverage_horizontal_deg=50.0,
        coverage_vertical_deg=40.0,
        input_connector=ConnectorType.SPEAKON_NL4,
        weight_kg=62.0,
    ),
    dict(
        manufacturer_name="Funktion-One",
        name="Evo 7",
        model_number="EVO 7",
        component_type=ComponentType.FULL_RANGE,
        power_type=PowerType.PASSIVE,
        description=(
            "Long-throw 3-way version of the Evo series. 40° horizontal pattern for "
            "extended throw in large rooms and festival stages."
        ),
        nominal_impedance_ohms=8.0,
        power_handling_rms_watts=750.0,
        power_handling_peak_watts=1500.0,
        sensitivity_db_spl=108.0,
        freq_response_low_hz=45.0,
        freq_response_high_hz=20000.0,
        max_spl_db=137.0,
        coverage_horizontal_deg=40.0,
        coverage_vertical_deg=30.0,
        input_connector=ConnectorType.SPEAKON_NL4,
        weight_kg=66.0,
    ),
    dict(
        manufacturer_name="Funktion-One",
        name="F121 Subwoofer",
        model_number="F121",
        component_type=ComponentType.SUBWOOFER,
        power_type=PowerType.PASSIVE,
        description=(
            "Single 21\" reflex-loaded subwoofer. Exceptional low-frequency extension "
            "to 20 Hz with 101 dB sensitivity. Often used in stacked cardioid sub arrays."
        ),
        nominal_impedance_ohms=8.0,
        power_handling_rms_watts=750.0,
        power_handling_peak_watts=1500.0,
        sensitivity_db_spl=101.0,
        freq_response_low_hz=20.0,
        freq_response_high_hz=200.0,
        max_spl_db=133.0,
        input_connector=ConnectorType.SPEAKON_NL4,
        weight_kg=68.0,
    ),
    dict(
        manufacturer_name="Funktion-One",
        name="F221 Subwoofer",
        model_number="F221",
        component_type=ComponentType.SUBWOOFER,
        power_type=PowerType.PASSIVE,
        description=(
            "Dual 21\" reflex subwoofer — the flagship Funktion-One low-frequency "
            "cabinet. Each 21\" driver is wired to its own voice-coil terminal "
            "(2 × 8 Ω), configurable for parallel (4 Ω) or independent bi-amp use."
        ),
        nominal_impedance_ohms=4.0,   # parallel (standard wiring)
        power_handling_rms_watts=1500.0,
        power_handling_peak_watts=3000.0,
        sensitivity_db_spl=104.0,
        freq_response_low_hz=20.0,
        freq_response_high_hz=85.0,
        max_spl_db=140.0,
        input_connector=ConnectorType.SPEAKON_NL4,
        weight_kg=118.0,
    ),

    # ────────────────── DANLEY SOUND LABS ────────────────────────────────────

    dict(
        manufacturer_name="Danley Sound Labs",
        name="SH96 Synergy Horn",
        model_number="SH96",
        component_type=ComponentType.FULL_RANGE,
        power_type=PowerType.PASSIVE,
        description=(
            "Flagship 3-way Synergy Horn with four 15\" LF, six 4\" MF, and one 1.4\" "
            "HF driver radiating from a single point-source aperture. True pattern "
            "control from below 100 Hz, eliminating the typical horn crossover "
            "coherence problems."
        ),
        nominal_impedance_ohms=8.0,
        power_handling_rms_watts=250.0,
        power_handling_peak_watts=1000.0,
        sensitivity_db_spl=109.0,
        freq_response_low_hz=65.0,
        freq_response_high_hz=18000.0,
        max_spl_db=141.0,
        coverage_horizontal_deg=90.0,
        coverage_vertical_deg=60.0,
        input_connector=ConnectorType.SPEAKON_NL4,
        weight_kg=141.0,
    ),
    dict(
        manufacturer_name="Danley Sound Labs",
        name="SH50 Synergy Horn",
        model_number="SH50",
        component_type=ComponentType.FULL_RANGE,
        power_type=PowerType.PASSIVE,
        description=(
            "Mid-size Synergy Horn. Array-able design for medium venues and "
            "as side/front fills in larger installations. 106 dB sensitivity."
        ),
        nominal_impedance_ohms=8.0,
        power_handling_rms_watts=200.0,
        power_handling_peak_watts=800.0,
        sensitivity_db_spl=106.0,
        freq_response_low_hz=80.0,
        freq_response_high_hz=18000.0,
        max_spl_db=136.0,
        coverage_horizontal_deg=90.0,
        coverage_vertical_deg=60.0,
        input_connector=ConnectorType.SPEAKON_NL4,
        weight_kg=68.0,
    ),
    dict(
        manufacturer_name="Danley Sound Labs",
        name="TH118 Tapped Horn Sub",
        model_number="TH118",
        component_type=ComponentType.SUBWOOFER,
        power_type=PowerType.PASSIVE,
        description=(
            "18\" tapped horn subwoofer. The tapped horn topology uses the driver as "
            "both the compression and expansion driver simultaneously, achieving "
            "extraordinary sensitivity (105 dB) with 500 W continuous power handling. "
            "Operating range: 37–213 Hz (−4 dB)."
        ),
        nominal_impedance_ohms=8.0,
        power_handling_rms_watts=500.0,
        power_handling_peak_watts=2000.0,
        sensitivity_db_spl=105.0,
        freq_response_low_hz=37.0,
        freq_response_high_hz=213.0,
        max_spl_db=138.0,
        input_connector=ConnectorType.SPEAKON_NL4,
        weight_kg=91.0,
    ),
    dict(
        manufacturer_name="Danley Sound Labs",
        name="BC218 Bass Compact Horn",
        model_number="BC218",
        component_type=ComponentType.SUBWOOFER,
        power_type=PowerType.PASSIVE,
        description=(
            "Dual 18\" paired horn subwoofer with a shared exit aperture. High "
            "directivity control in the low frequencies reduces stage bleed and "
            "sub buildup at the mix position. 4 Ω nominal load."
        ),
        nominal_impedance_ohms=4.0,
        power_handling_rms_watts=1000.0,
        power_handling_peak_watts=4000.0,
        sensitivity_db_spl=108.0,
        freq_response_low_hz=35.0,
        freq_response_high_hz=100.0,
        max_spl_db=141.0,
        input_connector=ConnectorType.SPEAKON_NL4,
        weight_kg=122.0,
    ),
    dict(
        manufacturer_name="Danley Sound Labs",
        name="SM80F Stage Monitor",
        model_number="SM80F",
        component_type=ComponentType.MONITOR,
        power_type=PowerType.PASSIVE,
        description=(
            "Hybrid Synergy Horn / Tapped Horn stage monitor. Combines a Tapped Horn "
            "sub section with a Synergy Horn top for a compact wedge with impressive "
            "low-end extension and high SPL capability."
        ),
        nominal_impedance_ohms=8.0,
        power_handling_rms_watts=300.0,
        power_handling_peak_watts=1200.0,
        sensitivity_db_spl=104.0,
        freq_response_low_hz=60.0,
        freq_response_high_hz=18000.0,
        max_spl_db=134.0,
        coverage_horizontal_deg=80.0,
        coverage_vertical_deg=60.0,
        input_connector=ConnectorType.SPEAKON_NL4,
        weight_kg=36.0,
    ),

    # ────────────────── L-ACOUSTICS ───────────────────────────────────────────

    dict(
        manufacturer_name="L-Acoustics",
        name="K2 Line Array Element",
        model_number="K2",
        component_type=ComponentType.LINE_ARRAY,
        power_type=PowerType.PASSIVE,
        description=(
            "Mid-to-large format WST line array element with Panflex directivity control "
            "(adjustable 70°–110° H). Covers 35 Hz–20 kHz. Requires an L-Acoustics LA "
            "amplified controller (LA12X or LA4X) for DSP preset loading and limiting."
        ),
        nominal_impedance_ohms=8.0,
        power_handling_rms_watts=1000.0,
        power_handling_peak_watts=4000.0,
        sensitivity_db_spl=98.0,
        freq_response_low_hz=35.0,
        freq_response_high_hz=20000.0,
        max_spl_db=142.0,
        input_connector=ConnectorType.SPEAKON_NL4,
        weight_kg=25.0,
    ),
    dict(
        manufacturer_name="L-Acoustics",
        name="KS28 Dual 18\" Subwoofer",
        model_number="KS28",
        component_type=ComponentType.SUBWOOFER,
        power_type=PowerType.PASSIVE,
        description=(
            "Dual 18\" neodymium bass reflex subwoofer. Peak SPL: 143 dB. "
            "Extends usable low-frequency response down to 25 Hz. 4 Ω nominal — "
            "always drive with an L-Acoustics LA12X for the cardioid sub preset."
        ),
        nominal_impedance_ohms=4.0,
        power_handling_rms_watts=2000.0,
        power_handling_peak_watts=8000.0,
        sensitivity_db_spl=104.0,
        freq_response_low_hz=25.0,
        freq_response_high_hz=100.0,
        max_spl_db=143.0,
        input_connector=ConnectorType.SPEAKON_NL4,
        weight_kg=95.0,
    ),
    dict(
        manufacturer_name="L-Acoustics",
        name="A15 Wide",
        model_number="A15 WIDE",
        component_type=ComponentType.FULL_RANGE,
        power_type=PowerType.PASSIVE,
        description=(
            "Medium-throw compact WST line-source element with 110° × 10° dispersion. "
            "Used as a standalone fill or in small arrays for intimate venue coverage."
        ),
        nominal_impedance_ohms=8.0,
        power_handling_rms_watts=600.0,
        power_handling_peak_watts=2400.0,
        sensitivity_db_spl=100.0,
        freq_response_low_hz=60.0,
        freq_response_high_hz=20000.0,
        max_spl_db=139.0,
        coverage_horizontal_deg=110.0,
        coverage_vertical_deg=10.0,
        input_connector=ConnectorType.SPEAKON_NL4,
        weight_kg=18.5,
    ),
    dict(
        manufacturer_name="L-Acoustics",
        name="LA12X Amplified Controller",
        model_number="LA12X",
        component_type=ComponentType.AMPLIFIER,
        description=(
            "4-channel amplified controller with dual SHARC DSP at 96 kHz. "
            "Power: 3 300 W / ch @ 2.7 Ω, 2 600 W / ch @ 4 Ω, 1 400 W / ch @ 8 Ω. "
            "Houses the complete L-Acoustics preset library for all current cabinets."
        ),
        channels=4,
        output_power_at_8ohm_watts=1400.0,
        output_power_at_4ohm_watts=2600.0,
        output_power_at_2ohm_watts=3300.0,   # rated at 2.7 Ω; approximated at 2 Ω
        min_load_impedance_ohms=2.0,
        has_onboard_dsp=True,
        input_connector=ConnectorType.XLR_3PIN,
        output_connector=ConnectorType.SPEAKON_NL4,
        weight_kg=19.5,
    ),
    dict(
        manufacturer_name="L-Acoustics",
        name="LA4X Amplified Controller",
        model_number="LA4X",
        component_type=ComponentType.AMPLIFIER,
        description=(
            "4-channel amplified controller for fills, monitors, and smaller systems. "
            "1 000 W / ch @ 4 Ω, 600 W / ch @ 8 Ω. Full L-Acoustics preset library."
        ),
        channels=4,
        output_power_at_8ohm_watts=600.0,
        output_power_at_4ohm_watts=1000.0,
        output_power_at_2ohm_watts=1400.0,
        min_load_impedance_ohms=2.0,
        has_onboard_dsp=True,
        input_connector=ConnectorType.XLR_3PIN,
        output_connector=ConnectorType.SPEAKON_NL4,
        weight_kg=13.0,
    ),

    # ────────────────── D&B AUDIOTECHNIK ──────────────────────────────────────

    dict(
        manufacturer_name="d&b audiotechnik",
        name="V8 Line Array Element",
        model_number="V8",
        component_type=ComponentType.LINE_ARRAY,
        power_type=PowerType.PASSIVE,
        description=(
            "Compact 2-way line array element from the d&b V-Series. 500 W RMS / "
            "2 000 W peak. Covers 65 Hz–18 kHz. Pairs with d&b D80 or D20 amplifiers "
            "and requires R1 Remote for DSP preset loading."
        ),
        nominal_impedance_ohms=8.0,
        power_handling_rms_watts=500.0,
        power_handling_peak_watts=2000.0,
        sensitivity_db_spl=98.0,
        freq_response_low_hz=65.0,
        freq_response_high_hz=18000.0,
        max_spl_db=140.0,
        coverage_horizontal_deg=100.0,
        coverage_vertical_deg=10.0,
        input_connector=ConnectorType.SPEAKON_NL4,
        weight_kg=18.5,
    ),
    dict(
        manufacturer_name="d&b audiotechnik",
        name="V-Sub Subwoofer",
        model_number="V-SUB",
        component_type=ComponentType.SUBWOOFER,
        power_type=PowerType.PASSIVE,
        description=(
            "Dual 12\" cardioid-capable subwoofer for the V-Series system. "
            "800 W RMS / 3 200 W peak. 32–100 Hz. Often rigged above or below the "
            "V8 array for integrated bass management."
        ),
        nominal_impedance_ohms=8.0,
        power_handling_rms_watts=800.0,
        power_handling_peak_watts=3200.0,
        sensitivity_db_spl=102.0,
        freq_response_low_hz=32.0,
        freq_response_high_hz=100.0,
        max_spl_db=138.0,
        input_connector=ConnectorType.SPEAKON_NL4,
        weight_kg=54.0,
    ),
    dict(
        manufacturer_name="d&b audiotechnik",
        name="Yi12 Installation Speaker",
        model_number="Yi12",
        component_type=ComponentType.FULL_RANGE,
        power_type=PowerType.PASSIVE,
        description=(
            "2-way installation and live-performance speaker. 700 W AES. "
            "70 Hz–20 kHz. Used as front fills and zone speakers in the d&b "
            "Y-Series ecosystem."
        ),
        nominal_impedance_ohms=8.0,
        power_handling_rms_watts=700.0,
        power_handling_peak_watts=2800.0,
        sensitivity_db_spl=97.0,
        freq_response_low_hz=70.0,
        freq_response_high_hz=20000.0,
        max_spl_db=136.0,
        coverage_horizontal_deg=90.0,
        coverage_vertical_deg=60.0,
        input_connector=ConnectorType.SPEAKON_NL4,
        weight_kg=22.0,
    ),
    dict(
        manufacturer_name="d&b audiotechnik",
        name="D80 Amplifier",
        model_number="D80",
        component_type=ComponentType.AMPLIFIER,
        description=(
            "4-channel touring amplifier with integrated d&b DSP. TFT display, "
            "remote control via R1. Power: 2 000 W / ch @ 8 Ω, 4 000 W / ch @ 4 Ω. "
            "Minimum load: 2 Ω. The workhorse amplifier behind Mission Ballroom's "
            "18-amp d&b installation."
        ),
        channels=4,
        output_power_at_8ohm_watts=2000.0,
        output_power_at_4ohm_watts=4000.0,
        output_power_at_2ohm_watts=5600.0,
        min_load_impedance_ohms=2.0,
        has_onboard_dsp=True,
        input_connector=ConnectorType.XLR_3PIN,
        output_connector=ConnectorType.SPEAKON_NL4,
        weight_kg=12.0,
    ),

    # ────────────────── MEYER SOUND ───────────────────────────────────────────

    dict(
        manufacturer_name="Meyer Sound",
        name="LEOPARD Line Array Element",
        model_number="LEOPARD",
        component_type=ComponentType.LINE_ARRAY,
        power_type=PowerType.ACTIVE,
        description=(
            "Compact self-powered line array element with two 9\" LF drivers and a "
            "3\" HF compression driver. Linear Peak SPL: 133.5 dB. Accepts a balanced "
            "XLR line-level input directly from a console or Meyer Galileo GALAXY. "
            "Input impedance: 10 kΩ differential. No external amplifier needed."
        ),
        freq_response_low_hz=55.0,
        freq_response_high_hz=18000.0,
        max_spl_db=133.5,
        coverage_horizontal_deg=100.0,
        coverage_vertical_deg=15.0,
        voltage_nominal=120.0,
        current_draw_amps=8.0,
        input_connector=ConnectorType.XLR_3PIN,
        power_connector=ConnectorType.POWERCON_BLUE,
        weight_kg=19.2,
    ),
    dict(
        manufacturer_name="Meyer Sound",
        name="LYON Line Array Element",
        model_number="LYON",
        component_type=ComponentType.LINE_ARRAY,
        power_type=PowerType.ACTIVE,
        description=(
            "Large-format self-powered line array with dual 12\" LF and dual 3\" HF "
            "drivers. Linear Peak SPL: 145 dB. The flagship touring element for "
            "stadium and amphitheatre deployments. Accepts XLR line level."
        ),
        freq_response_low_hz=50.0,
        freq_response_high_hz=18000.0,
        max_spl_db=145.0,
        coverage_horizontal_deg=90.0,
        coverage_vertical_deg=8.0,
        voltage_nominal=208.0,
        current_draw_amps=12.0,
        input_connector=ConnectorType.XLR_3PIN,
        power_connector=ConnectorType.POWERCON_BLUE,
        weight_kg=47.0,
    ),
    dict(
        manufacturer_name="Meyer Sound",
        name="1100-LFC Low-Frequency Control Element",
        model_number="1100-LFC",
        component_type=ComponentType.SUBWOOFER,
        power_type=PowerType.ACTIVE,
        description=(
            "Self-powered dual 18\" subwoofer. Linear Peak SPL: 140 dB. "
            "Operating frequency: 28–100 Hz. Requires 208–235 V AC mains. "
            "Class AB/H bridged internal amplification. XLR balanced input."
        ),
        freq_response_low_hz=28.0,
        freq_response_high_hz=100.0,
        max_spl_db=140.0,
        voltage_nominal=208.0,
        current_draw_amps=18.0,
        input_connector=ConnectorType.XLR_3PIN,
        power_connector=ConnectorType.POWERCON_BLUE,
        weight_kg=113.0,
    ),

    # ────────────────── QSC ───────────────────────────────────────────────────

    dict(
        manufacturer_name="QSC",
        name="PLX3602 Power Amplifier",
        model_number="PLX3602",
        component_type=ComponentType.AMPLIFIER,
        description=(
            "2-channel lightweight touring amplifier. Stereo: 775 W @ 8 Ω, "
            "1 250 W @ 4 Ω, 1 800 W @ 2 Ω. Bridged mono: 2 600 W @ 8 Ω, "
            "3 600 W @ 4 Ω. Minimum load: 2 Ω stereo, 4 Ω bridged. "
            "PowerWave output topology."
        ),
        channels=2,
        output_power_at_8ohm_watts=775.0,
        output_power_at_4ohm_watts=1250.0,
        output_power_at_2ohm_watts=1800.0,
        min_load_impedance_ohms=2.0,
        has_onboard_dsp=False,
        input_connector=ConnectorType.XLR_3PIN,
        output_connector=ConnectorType.SPEAKON_NL4,
        weight_kg=5.4,
    ),

    # ────────────────── LAB.GRUPPEN ───────────────────────────────────────────

    dict(
        manufacturer_name="Lab.gruppen",
        name="FP14000 Power Amplifier",
        model_number="FP14000",
        component_type=ComponentType.AMPLIFIER,
        description=(
            "2-channel Class TD touring amplifier — the industry benchmark for "
            "high-power passive sub arrays. Per-channel: 7 000 W @ 2 Ω, "
            "4 400 W @ 4 Ω, 2 350 W @ 8 Ω. Bridged: 14 000 W @ 4 Ω, "
            "8 800 W @ 8 Ω. Peak output current: 90 A per channel."
        ),
        channels=2,
        output_power_at_8ohm_watts=2350.0,
        output_power_at_4ohm_watts=4400.0,
        output_power_at_2ohm_watts=7000.0,
        min_load_impedance_ohms=2.0,
        has_onboard_dsp=False,
        input_connector=ConnectorType.XLR_3PIN,
        output_connector=ConnectorType.SPEAKON_NL4,
        weight_kg=19.0,
    ),
]


# ── Seeding function ──────────────────────────────────────────────────────────

def seed_database(db: Session) -> None:
    """
    Insert all manufacturers and components if the database is empty.
    Safe to call multiple times — skips if data already exists.
    """
    if db.query(Manufacturer).count() > 0:
        return  # already seeded

    # Insert manufacturers and build a name → id map
    name_to_mfr: dict[str, Manufacturer] = {}
    for mfr_data in MANUFACTURERS:
        mfr = Manufacturer(**mfr_data)
        db.add(mfr)
        name_to_mfr[mfr.name] = mfr

    db.flush()  # populate ids without committing

    # Insert components — copy each dict so the global list is not mutated
    for raw in COMPONENTS:
        comp_data = dict(raw)                   # shallow copy prevents mutation
        mfr_name = comp_data.pop("manufacturer_name")
        mfr = name_to_mfr[mfr_name]
        comp = Component(manufacturer_id=mfr.id, **comp_data)
        db.add(comp)

    db.commit()
