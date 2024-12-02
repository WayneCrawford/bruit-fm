"""
Calculate compliance automatically using tiskitpy using two cleaning steps
- Rotation of vertical channel to mimimize noise
- Transfer-function based noise removal (channel 1, then 2, then H)
"""
from obspy.core.stream import read
from obspy import read_inventory, UTCDateTime

from tiskitpy import (CleanRotator, DataCleaner, SpectralDensity,
                      ResponseFunctions, CleanedStream, TimeSpans)


# Define high noise periods
glitches = TimeSpans([
            ['2022-05-08T02:00', '2022-05-08T08:15'],  # Seismometer wait time
            ['2022-05-08T14:24:30', '2022-05-08T14:25:00'],
            ['2022-05-17T17:15', '2022-05-17T19:21'],  # End of data 
        ])
LP_bads = TimeSpans([
            ['2022-05-08T02:00', '2022-05-08T08:30'],  # Seismometer wait time
            ['2022-05-08T13:49', '2022-05-08T14:09'],  # 1-2 transient
            ['2022-05-08T20:00', '2022-05-08T21:00'],  # Big Z transient
            ['2022-05-10T23:05', '2022-05-11T01:05'],  # LP EQ?
            ['2022-05-17T17:19', '2022-05-17T19:20'],  # LP EQ?
        ])
LP_EQs = TimeSpans([
            ['2022-05-09T07:03', '2022-05-09T08:13'],
            ['2022-05-09T23:00', '2022-05-10T01:18'],
            ['2022-05-10T23:05', '2022-05-11T01:05'],
            ['2022-05-17T17:19', '2022-05-17T19:20'],
            ['2022-05-23T05:45', '2022-05-23T11:22'],
            ['2022-05-24T03:00', '2022-05-24T08:39'],
            ['2022-05-26T04:40', '2022-05-26T07:00'],
            ['2022-05-26T12:00', '2022-05-26T14:00'],
            ['2022-05-26T15:53', '2022-05-26T18:00'],
            ['2022-05-27T03:44', '2022-05-27T04:53'],
            ['2022-05-28T14:00', '2022-05-28T15:00'],
        ])

# read the data
stream = read('XX.AS02.mseed')

# read the inventory
inv = read_inventory('AS02_L.station.xml')

# Cut deployment and recovery
stream.trim(starttime=UTCDateTime('2022-05-09T00'),
            endtime=UTCDateTime('2022-05-17T12'))

# Superclass of Stream that carries transformation information
stream = CleanedStream(stream)

#  NOISE REDUCTION: first time AUTOMATIC, second time MANUAL
for avoidance, avoid_spans in zip(('Automatic', 'Manual'),
                                  (None, glitches + LP_bads + LP_EQs)):
    cr = CleanRotator(stream, avoid_spans=avoid_spans)
    stream_rot = cr.apply(stream)
    dc_all = DataCleaner(stream_rot, ['*1', '*2', '*H'], avoid_spans=avoid_spans)
    dc_tilt = DataCleaner(stream_rot, ['*1', '*2'], avoid_spans=avoid_spans)
    stream_rot_tilt_cleaned = dc_tilt.clean_stream(stream_rot)
    stream_rot_all_cleaned = dc_all.clean_stream(stream_rot)

    # Compare total noise reduction (tilt + pressure)
    z_compare = (stream.select(channel='*Z')
                 + stream_rot.select(channel='*Z')
                 + stream_rot_all_cleaned.select(channel='*Z'))
    z_compare.plot(outfile=f'plots/AS02.{avoidance}_z_compare.png')
    sd_compare = SpectralDensity.from_stream(z_compare, inv=inv,
                                             avoid_spans=avoid_spans)
    sd_compare.plot(overlay=True, outfile=f'plots/AS02.{avoidance}.sd_compare.png')

    # Calculate compliance base on rot+tilt cleaned data
    sd_rot_tilt_cleaned = SpectralDensity.from_stream(stream_rot_tilt_cleaned,
                                                      avoid_spans=avoid_spans)
    sd_rot_tilt_cleaned.plot_one_coherence('*Z', '*H',
                                           outfile=f'plots/AS02.{avoidance}.ZHcoher.png')
    rf = ResponseFunctions(sd_rot_tilt_cleaned, '*H', ['*Z'])
    rf.plot(outfile=f'plots/AS02.{avoidance}.ZHrf.png')
    wdepth = 2554  # Water depth in meters
    rf.to_norm_compliance(wdepth)
    rf.plot(outfile=f'plots/AS02.{avoidance}.ZHcompl.png')
