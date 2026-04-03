from enum import Enum


class ComponentType(str, Enum):
    FULL_RANGE = "full_range"       # Full-range PA tops / point-source
    LINE_ARRAY = "line_array"       # Line array elements
    SUBWOOFER = "subwoofer"         # Subwoofer cabinets
    MONITOR = "monitor"             # Stage monitors / wedges
    FILL = "fill"                   # Delay, front-fill, in-fill speakers
    AMPLIFIER = "amplifier"         # Power amplifiers
    PROCESSOR = "processor"         # External DSP / signal processors


class PowerType(str, Enum):
    ACTIVE = "active"       # Self-powered (integrated amp + DSP)
    PASSIVE = "passive"     # Requires external power amplifier


class ConnectorType(str, Enum):
    SPEAKON_NL2 = "speakon_nl2"     # Neutrik Speakon 2-pin (30 A per pair)
    SPEAKON_NL4 = "speakon_nl4"     # Neutrik Speakon 4-pin — touring standard
    SPEAKON_NL8 = "speakon_nl8"     # Neutrik Speakon 8-pin — bi-amp / tri-amp
    XLR_3PIN = "xlr_3pin"           # Balanced line-level signal (NOT speaker-level)
    XLR_5PIN = "xlr_5pin"           # AES3 digital audio
    POWERCON_BLUE = "powercon_blue" # Neutrik PowerCon — mains AC input (blue)
    POWERCON_GREY = "powercon_grey" # Neutrik PowerCon — mains AC output (grey)
    BINDING_POST = "binding_post"   # Bare wire / banana plug
    TRS_14 = "trs_14"               # ¼-inch TRS (monitoring / installs)


class WiringMode(str, Enum):
    PARALLEL = "parallel"   # Impedance decreases: 1/Z = 1/Z1 + 1/Z2 ...
    SERIES = "series"       # Impedance adds: Z = Z1 + Z2 ...


class IssueSeverity(str, Enum):
    ERROR = "error"         # Will cause hardware damage or failure
    WARNING = "warning"     # May cause performance degradation
    INFO = "info"           # Best-practice recommendation


class IssueCode(str, Enum):
    # Passive / Active rules
    PASSIVE_NEEDS_AMP = "PASSIVE_NEEDS_AMP"
    ACTIVE_NO_EXTERNAL_AMP = "ACTIVE_NO_EXTERNAL_AMP"
    ACTIVE_CONNECTED_TO_AMP = "ACTIVE_CONNECTED_TO_AMP"

    # Impedance rules
    IMPEDANCE_BELOW_AMP_MINIMUM = "IMPEDANCE_BELOW_AMP_MINIMUM"
    IMPEDANCE_VERY_HIGH = "IMPEDANCE_VERY_HIGH"
    IMPEDANCE_NOMINAL = "IMPEDANCE_NOMINAL"

    # Power matching rules
    AMP_SEVERELY_OVERPOWERED = "AMP_SEVERELY_OVERPOWERED"   # > 4× RMS
    AMP_OVERPOWERED = "AMP_OVERPOWERED"                     # 2× – 4× RMS
    AMP_UNDERPOWERED = "AMP_UNDERPOWERED"                   # < 0.5× RMS
    AMP_CLIPPING_RISK = "AMP_CLIPPING_RISK"                 # Chronic underpowering

    # Connector rules
    CONNECTOR_MISMATCH = "CONNECTOR_MISMATCH"
    SPEAKER_LEVEL_ON_LINE_LEVEL = "SPEAKER_LEVEL_ON_LINE_LEVEL"

    # Ecosystem / DSP rules
    CROSS_MANUFACTURER_DSP = "CROSS_MANUFACTURER_DSP"
    MISSING_REQUIRED_PROCESSOR = "MISSING_REQUIRED_PROCESSOR"

    # Configuration rules
    CHANNEL_OVERLOADED = "CHANNEL_OVERLOADED"
    NO_SPEAKERS_ON_CHANNEL = "NO_SPEAKERS_ON_CHANNEL"
    NON_AMPLIFIER_AS_AMP = "NON_AMPLIFIER_AS_AMP"
